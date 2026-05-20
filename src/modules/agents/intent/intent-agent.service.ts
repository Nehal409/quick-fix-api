import { Injectable, Logger } from '@nestjs/common';
import { LogModuleTypes } from 'src/common';
import { GeminiModelTier, GeminiService } from '../../gemini';
import { AgentRunContext, Agent } from '../interfaces';
import { AgentOrchestratorService } from '../services';
import { INTENT_AGENT_SYSTEM_INSTRUCTION, buildIntentUserPrompt } from './intent-agent.prompt';
import { INTENT_RESPONSE_SCHEMA } from './intent-agent.schema';
import {
    ExtractedField,
    IntentAgentInput,
    IntentAgentResult,
    ParsedIntent,
} from './intent-agent.types';

const CONFIDENCE_THRESHOLD = 0.7;

@Injectable()
export class IntentAgentService implements Agent<IntentAgentInput, IntentAgentResult> {
    readonly name = 'intent_agent';
    private readonly logger = new Logger(LogModuleTypes.AGENTS);

    constructor(
        private readonly gemini: GeminiService,
        private readonly orchestrator: AgentOrchestratorService,
    ) {}

    async run(input: IntentAgentInput, context: AgentRunContext): Promise<IntentAgentResult> {
        const startedAt = Date.now();
        const prompt = buildIntentUserPrompt({
            rawInput: input.rawInput,
            language: input.language,
            location: input.location,
            asOf: input.asOf ?? new Date(),
            clarificationAnswers: input.clarificationAnswers,
        });

        const { data, trace } = await this.gemini.generateJson<ParsedIntent>(prompt, {
            tier: GeminiModelTier.FLASH,
            systemInstruction: INTENT_AGENT_SYSTEM_INSTRUCTION,
            temperature: 0.2,
            responseSchema: INTENT_RESPONSE_SCHEMA,
            validate: isParsedIntent,
        });

        ensureWhenClarification(data, input);

        this.orchestrator.recordTrace(context, {
            agent: this.name,
            gemini: trace,
            tookMs: Date.now() - startedAt,
            note: `confidence=${data.confidence.toFixed(2)} clarifications=${data.clarifications.length}`,
        });

        if (data.confidence < CONFIDENCE_THRESHOLD || data.clarifications.length > 0) {
            this.logger.log({
                message: 'Intent needs clarification',
                data: {
                    traceId: context.traceId,
                    confidence: data.confidence,
                    ambiguities: data.clarifications.length,
                },
            });
            return {
                status: 'needs_clarification',
                partialIntent: data,
                clarifications: data.clarifications,
            };
        }

        return {
            status: 'ready',
            intent: data,
            extractedFields: buildExtractedFields(data),
        };
    }
}

function buildExtractedFields(intent: ParsedIntent): ExtractedField[] {
    const fields: ExtractedField[] = [
        {
            key: 'service',
            label: 'Service',
            value: intent.service.label,
            icon: 'tools',
            tags: intent.service.severity === 'high' ? ['high severity'] : undefined,
        },
    ];

    const locationParts = [intent.location.sector, intent.location.city].filter(Boolean);
    if (locationParts.length > 0) {
        fields.push({
            key: 'location',
            label: 'Location',
            value: locationParts.join(', '),
            icon: 'pin',
        });
    }

    if (intent.when.window || intent.when.start) {
        fields.push({
            key: 'when',
            label: 'When',
            value: intent.when.window ?? intent.when.start ?? '',
            icon: 'cal',
            bilingual: intent.glosses.find((g) => /kal|subah|sham|raat/i.test(g.ur)) ?? undefined,
        });
    }

    if (intent.budget.max != null) {
        fields.push({
            key: 'budget',
            label: 'Budget',
            value: `Up to Rs. ${intent.budget.max.toLocaleString('en-PK')}`,
            icon: 'wallet',
            tags: intent.budget.priceSensitive ? ['price-sensitive'] : undefined,
        });
    }

    fields.push({
        key: 'urgency',
        label: 'Urgency',
        value: `${capitalize(intent.urgency)} · ${urgencyWindow(intent.urgency)}`,
        icon: 'bolt',
    });

    return fields;
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function urgencyWindow(urgency: 'low' | 'medium' | 'high'): string {
    return urgency === 'high' ? 'next 24 hrs' : urgency === 'medium' ? 'next 3 days' : 'flexible';
}

// Belt-and-suspenders: even when Gemini scores high confidence and skips the
// clarification, never let the pipeline schedule a job without an explicit
// time from the user. Skipped when an answer to "when-missing" has already
// been provided in this turn, otherwise we'd loop on the same question.
function ensureWhenClarification(intent: ParsedIntent, input: IntentAgentInput): void {
    const hasTime = Boolean(intent.when.start || intent.when.window);
    if (hasTime) return;

    const alreadyAnswered = (input.clarificationAnswers ?? []).some((qa) =>
        /when|time|schedule|kab|kal|abhi|subah|shaam/i.test(qa.question),
    );
    if (alreadyAnswered) return;

    const alreadyAsked = intent.clarifications.some(
        (c) => /when|time|schedule/i.test(c.id) || /when|time/i.test(c.fieldTarget),
    );
    if (alreadyAsked) return;

    intent.clarifications.push({
        id: 'when-missing',
        prompt: 'When would you like the technician to visit?',
        fieldTarget: 'when.window',
        type: 'choice',
        options: [
            { value: 'now', label: 'As soon as possible', recommended: true },
            { value: 'today_evening', label: 'Today evening' },
            { value: 'tomorrow_morning', label: 'Tomorrow morning' },
            { value: 'tomorrow_evening', label: 'Tomorrow evening' },
        ],
    });
}

function isParsedIntent(value: unknown): value is ParsedIntent {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.confidence === 'number' &&
        typeof v.urgency === 'string' &&
        Array.isArray(v.glosses) &&
        Array.isArray(v.clarifications) &&
        typeof v.service === 'object' &&
        typeof v.location === 'object' &&
        typeof v.when === 'object' &&
        typeof v.budget === 'object'
    );
}
