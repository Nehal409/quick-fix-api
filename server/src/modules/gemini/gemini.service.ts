import { badImplementation, gatewayTimeout, serverUnavailable } from '@hapi/boom';
import { GenerateContentResponse, GoogleGenAI, Schema } from '@google/genai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LogModuleTypes, messages } from 'src/common';
import { GeminiModelTier } from './enums';
import {
    GeminiCallOptions,
    GeminiJsonCallOptions,
    GeminiJsonResult,
    GeminiTextResult,
    GeminiTrace,
} from './interfaces';

const RETRYABLE_HTTP_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const RETRYABLE_NETWORK_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'ENOTFOUND']);

interface InternalCallConfig {
    systemInstruction?: string;
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
    responseSchema?: Schema;
    abortSignal?: AbortSignal;
}

@Injectable()
export class GeminiService {
    private readonly logger = new Logger(LogModuleTypes.GEMINI);
    private readonly client: GoogleGenAI;
    private readonly flashModel: string;
    private readonly proModel: string;
    private readonly defaultTimeoutMs: number;
    private readonly defaultMaxRetries: number;

    constructor(config: ConfigService) {
        this.client = new GoogleGenAI({ apiKey: config.getOrThrow<string>('gemini.apiKey') });
        this.flashModel = config.getOrThrow<string>('gemini.flashModel');
        this.proModel = config.getOrThrow<string>('gemini.proModel');
        this.defaultTimeoutMs = config.getOrThrow<number>('gemini.timeoutMs');
        this.defaultMaxRetries = config.getOrThrow<number>('gemini.maxRetries');
    }

    async generateText(prompt: string, options: GeminiCallOptions = {}): Promise<GeminiTextResult> {
        const { response, trace } = await this.execute(prompt, options, {});
        const text = response.text ?? '';
        if (!text) {
            this.logger.error({ message: 'Gemini returned empty text', data: { trace } });
            throw serverUnavailable(messages.GEMINI.EMPTY_RESPONSE);
        }
        return { text, trace };
    }

    async generateJson<T>(
        prompt: string,
        options: GeminiJsonCallOptions<T>,
    ): Promise<GeminiJsonResult<T>> {
        const { response, trace } = await this.execute(prompt, options, {
            responseMimeType: 'application/json',
            responseSchema: options.responseSchema,
        });

        const raw = response.text ?? '';
        if (!raw) {
            this.logger.error({ message: 'Gemini returned empty JSON', data: { trace } });
            throw serverUnavailable(messages.GEMINI.EMPTY_RESPONSE);
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(raw);
        } catch {
            this.logger.error({ message: 'Gemini returned malformed JSON', data: { raw, trace } });
            throw badImplementation(messages.GEMINI.INVALID_JSON);
        }

        if (options.validate && !options.validate(parsed)) {
            this.logger.error({
                message: 'Gemini JSON failed validation',
                data: { parsed, trace },
            });
            throw badImplementation(messages.GEMINI.INVALID_JSON);
        }

        return { data: parsed as T, raw, trace };
    }

    private resolveModel(tier?: GeminiModelTier): string {
        return tier === GeminiModelTier.PRO ? this.proModel : this.flashModel;
    }

    private async execute(
        prompt: string,
        options: GeminiCallOptions,
        extra: Pick<InternalCallConfig, 'responseMimeType' | 'responseSchema'>,
    ): Promise<{ response: GenerateContentResponse; trace: GeminiTrace }> {
        const model = this.resolveModel(options.tier);
        const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
        const maxRetries = options.maxRetries ?? this.defaultMaxRetries;
        const config = this.buildConfig(options, extra);

        const startedAt = Date.now();
        let attempt = 0;
        let lastError: unknown;

        while (attempt <= maxRetries) {
            attempt += 1;
            try {
                const response = await this.callWithTimeout(model, prompt, config, timeoutMs);
                const trace = this.buildTrace(model, response, startedAt, attempt);
                this.logger.log({ message: 'Gemini call succeeded', data: trace });
                return { response, trace };
            } catch (err) {
                lastError = err;
                if (attempt > maxRetries || !this.isRetryable(err)) {
                    break;
                }
                const backoff = this.backoffMs(attempt);
                this.logger.warn({
                    message: `Gemini call failed — retrying in ${backoff}ms`,
                    data: { attempt, model, err: serializeError(err) },
                });
                await sleep(backoff);
            }
        }

        this.logger.error({
            message: 'Gemini call exhausted retries',
            data: { attempts: attempt, model, err: serializeError(lastError) },
        });

        if (lastError instanceof GeminiTimeoutError) {
            throw gatewayTimeout(messages.GEMINI.TIMEOUT);
        }
        throw serverUnavailable(messages.GEMINI.UPSTREAM_FAILURE);
    }

    private buildConfig(
        options: GeminiCallOptions,
        extra: Pick<InternalCallConfig, 'responseMimeType' | 'responseSchema'>,
    ): InternalCallConfig {
        const config: InternalCallConfig = {};
        if (options.systemInstruction) config.systemInstruction = options.systemInstruction;
        if (options.temperature !== undefined) config.temperature = options.temperature;
        if (options.maxOutputTokens !== undefined) config.maxOutputTokens = options.maxOutputTokens;
        if (extra.responseMimeType) config.responseMimeType = extra.responseMimeType;
        if (extra.responseSchema) config.responseSchema = extra.responseSchema;
        return config;
    }

    private async callWithTimeout(
        model: string,
        prompt: string,
        config: InternalCallConfig,
        timeoutMs: number,
    ): Promise<GenerateContentResponse> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await this.client.models.generateContent({
                model,
                contents: prompt,
                config: { ...config, abortSignal: controller.signal },
            });
        } catch (err) {
            if (controller.signal.aborted) {
                throw new GeminiTimeoutError();
            }
            throw err;
        } finally {
            clearTimeout(timer);
        }
    }

    private buildTrace(
        model: string,
        response: GenerateContentResponse,
        startedAt: number,
        attempts: number,
    ): GeminiTrace {
        const usage = response.usageMetadata;
        const finishReason = response.candidates?.[0]?.finishReason;
        return {
            model,
            latencyMs: Date.now() - startedAt,
            promptTokens: usage?.promptTokenCount ?? 0,
            completionTokens: usage?.candidatesTokenCount ?? 0,
            totalTokens: usage?.totalTokenCount ?? 0,
            attempts,
            finishReason: finishReason ? String(finishReason) : undefined,
        };
    }

    private isRetryable(err: unknown): boolean {
        if (err instanceof GeminiTimeoutError) return true;
        const status =
            (err as { status?: number }).status ?? (err as { statusCode?: number }).statusCode;
        if (status && RETRYABLE_HTTP_STATUS.has(status)) return true;
        const code = (err as { code?: string }).code;
        if (code && RETRYABLE_NETWORK_CODES.has(code)) return true;
        return false;
    }

    private backoffMs(attempt: number): number {
        const base = 300 * Math.pow(3, attempt - 1);
        const jitter = Math.floor(Math.random() * 150);
        return base + jitter;
    }
}

class GeminiTimeoutError extends Error {
    constructor() {
        super('Gemini call timed out');
        this.name = 'GeminiTimeoutError';
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function serializeError(err: unknown): Record<string, unknown> {
    if (err instanceof Error) {
        return {
            name: err.name,
            message: err.message,
            code: (err as { code?: string }).code,
            status: (err as { status?: number }).status,
        };
    }
    return { value: String(err) };
}
