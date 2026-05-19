import { Injectable, Logger } from '@nestjs/common';
import { LogModuleTypes } from 'src/common';
import { GeminiModelTier, GeminiService } from '../../gemini';
import { PriceQuote, PricingKey, PricingService } from '../../pricing';
import { Agent, AgentRunContext } from '../interfaces';
import { AgentOrchestratorService } from '../services';
import { PRICING_AGENT_SYSTEM_INSTRUCTION, buildPricingPrompt } from './pricing-agent.prompt';
import { PRICING_EXPLANATION_SCHEMA, PricingExplanationResponse } from './pricing-agent.schema';
import { PricingAgentInput, PricingAgentResult } from './pricing-agent.types';

@Injectable()
export class PricingAgentService implements Agent<PricingAgentInput, PricingAgentResult> {
    readonly name = 'pricing_agent';
    private readonly logger = new Logger(LogModuleTypes.AGENTS);

    constructor(
        private readonly pricing: PricingService,
        private readonly gemini: GeminiService,
        private readonly orchestrator: AgentOrchestratorService,
    ) {}

    async run(input: PricingAgentInput, context: AgentRunContext): Promise<PricingAgentResult> {
        const startedAt = Date.now();
        const quote = this.pricing.computeQuote(input);

        const { explanation, usedFallback, geminiLatencyMs } = await this.explain(
            quote,
            input.provider.displayName,
            context,
        );

        const latencyMs = Date.now() - startedAt;
        this.orchestrator.recordTrace(context, {
            agent: this.name,
            tookMs: latencyMs,
            note: `total=${quote.estimateTotal} withinBudget=${quote.withinBudget} explanation=${usedFallback ? 'fallback' : 'gemini'} (${geminiLatencyMs}ms)`,
        });

        return { quote, explanation, latencyMs, usedFallback };
    }

    private async explain(
        quote: PriceQuote,
        providerName: string,
        context: AgentRunContext,
    ): Promise<{ explanation: string; usedFallback: boolean; geminiLatencyMs: number }> {
        const startedAt = Date.now();
        try {
            const { data, trace } = await this.gemini.generateJson<PricingExplanationResponse>(
                buildPricingPrompt(quote, providerName),
                {
                    tier: GeminiModelTier.FLASH,
                    systemInstruction: PRICING_AGENT_SYSTEM_INSTRUCTION,
                    temperature: 0.3,
                    responseSchema: PRICING_EXPLANATION_SCHEMA,
                    validate: isExplanationResponse,
                },
            );
            return {
                explanation: data.explanation,
                usedFallback: false,
                geminiLatencyMs: trace.latencyMs,
            };
        } catch (err) {
            this.logger.warn({
                message: 'Pricing narrative failed — using deterministic fallback',
                data: { traceId: context.traceId, err: String(err) },
            });
            return {
                explanation: this.fallbackExplanation(quote),
                usedFallback: true,
                geminiLatencyMs: Date.now() - startedAt,
            };
        }
    }

    private fallbackExplanation(quote: PriceQuote): string {
        const total = `Rs. ${quote.estimateTotal.toLocaleString('en-PK')}`;
        const surge = quote.breakdown.find(
            (r) => r.key === PricingKey.DEMAND_SURGE && r.amount > 0,
        );
        const discount = quote.breakdown.find(
            (r) => r.key === PricingKey.LOYALTY_DISCOUNT && r.amount < 0,
        );

        const parts: string[] = [];
        if (quote.budgetCap != null && quote.withinBudget) {
            parts.push(`${total} — under your Rs. ${quote.budgetCap.toLocaleString('en-PK')} cap.`);
        } else if (quote.budgetCap != null) {
            parts.push(
                `${total} — slightly over your Rs. ${quote.budgetCap.toLocaleString('en-PK')} cap.`,
            );
        } else {
            parts.push(`Estimate ${total}.`);
        }
        if (surge) parts.push(`${surge.description} adds Rs. ${surge.amount}.`);
        else if (discount) parts.push(`${discount.description} applied.`);
        parts.push('Final amount is fixed after diagnostic.');
        return parts.join(' ');
    }
}

function isExplanationResponse(value: unknown): value is PricingExplanationResponse {
    if (!value || typeof value !== 'object') return false;
    return typeof (value as { explanation?: unknown }).explanation === 'string';
}
