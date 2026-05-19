import { Schema } from '@google/genai';
import { GeminiModelTier } from '../enums';

export interface GeminiCallOptions {
    tier?: GeminiModelTier;
    systemInstruction?: string;
    temperature?: number;
    maxOutputTokens?: number;
    timeoutMs?: number;
    maxRetries?: number;
}

export interface GeminiJsonCallOptions<T> extends GeminiCallOptions {
    responseSchema: Schema;
    validate?: (raw: unknown) => raw is T;
}
