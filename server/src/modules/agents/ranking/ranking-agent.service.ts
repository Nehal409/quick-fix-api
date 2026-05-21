import { Injectable, Logger } from '@nestjs/common';
import { LogModuleTypes } from 'src/common';
import { GeminiModelTier, GeminiService } from '../../gemini';
import { FACTOR_WEIGHTS, FactorComputation, MatchResult, MatchingService } from '../../matching';
import { estimateSectorDistance } from '../../matching/factors/sector-distance';
import { Provider } from '../../providers/entities';
import { Agent, AgentRunContext } from '../interfaces';
import { ParsedIntent } from '../intent';
import { AgentOrchestratorService } from '../services';
import {
    buildRankingNarrativePrompt,
    RANKING_AGENT_SYSTEM_INSTRUCTION,
} from './ranking-agent.prompt';
import { RANKING_NARRATIVE_SCHEMA, RankingNarrativeResponse } from './ranking-agent.schema';
import {
    ExplainOneInput,
    ExplainOneResult,
    FactorOutput,
    RankedCandidate,
    RankingAgentInput,
    RankingAgentResult,
} from './ranking-agent.types';

const DEFAULT_LIMIT = 5;

@Injectable()
export class RankingAgentService implements Agent<RankingAgentInput, RankingAgentResult> {
    readonly name = 'ranking_agent';
    private readonly logger = new Logger(LogModuleTypes.AGENTS);

    constructor(
        private readonly matching: MatchingService,
        private readonly gemini: GeminiService,
        private readonly orchestrator: AgentOrchestratorService,
    ) {}

    async run(input: RankingAgentInput, context: AgentRunContext): Promise<RankingAgentResult> {
        const startedAt = Date.now();
        const limit = input.limit ?? DEFAULT_LIMIT;

        const scored = this.matching.scoreAll(input.intent, input.providers);
        const ordered = scored
            .map((result, idx) => ({ result, provider: input.providers[idx] }))
            .sort((a, b) => b.result.matchScore - a.result.matchScore);

        const top = ordered.slice(0, limit);
        const candidates: RankedCandidate[] = top.map((entry, idx) =>
            this.toCandidate(entry.provider, entry.result, idx === 0, input.intent),
        );

        const summary = this.buildSummary(input, candidates);
        const latencyMs = Date.now() - startedAt;

        this.orchestrator.recordTrace(context, {
            agent: this.name,
            tookMs: latencyMs,
            note: `scored=${ordered.length} returned=${candidates.length} top=${candidates[0]?.matchScore ?? 0}`,
        });

        return {
            candidates,
            summary,
            factorCount: Object.keys(FACTOR_WEIGHTS).length,
            totalScanned: ordered.length,
            latencyMs,
        };
    }

    async explainOne(input: ExplainOneInput, context: AgentRunContext): Promise<ExplainOneResult> {
        const peers = input.peers.filter((p) => p.id !== input.target.id);
        const scored = this.matching.scoreAll(input.intent, [input.target, ...peers]);
        const targetResult = scored[0];
        const peerResults = scored.slice(1);
        const runnerUpIdx = peerResults.findIndex(
            (r) => r.matchScore === Math.max(...peerResults.map((p) => p.matchScore)),
        );
        const runnerUp =
            runnerUpIdx >= 0
                ? { provider: peers[runnerUpIdx], result: peerResults[runnerUpIdx] }
                : undefined;

        const startedAt = Date.now();
        const prompt = buildRankingNarrativePrompt({
            intent: input.intent,
            pick: { provider: input.target, result: targetResult },
            runnerUp,
        });

        const { data, trace } = await this.gemini.generateJson<RankingNarrativeResponse>(prompt, {
            tier: GeminiModelTier.FLASH,
            systemInstruction: RANKING_AGENT_SYSTEM_INSTRUCTION,
            temperature: 0.3,
            responseSchema: RANKING_NARRATIVE_SCHEMA,
            validate: isNarrativeResponse,
        });

        this.orchestrator.recordTrace(context, {
            agent: `${this.name}.explainOne`,
            gemini: trace,
            tookMs: Date.now() - startedAt,
            note: `target=${input.target.uuid} runnerUp=${runnerUp?.provider.uuid ?? '-'}`,
        });

        return {
            providerId: input.target.uuid,
            matchScore: targetResult.matchScore,
            narrative: data.narrative,
            factors: targetResult.factors.map(toFactorOutput),
            comparisonAgainst:
                runnerUp && data.comparisonNarrative
                    ? {
                          providerId: runnerUp.provider.uuid,
                          displayName: runnerUp.provider.displayName,
                          narrative: data.comparisonNarrative,
                          scoreDelta: runnerUp.result.matchScore - targetResult.matchScore,
                      }
                    : undefined,
            trace: {
                agent: this.name,
                latencyMs: trace.latencyMs,
                tokens: trace.totalTokens,
                model: trace.model,
            },
        };
    }

    private toCandidate(
        provider: Provider,
        result: MatchResult,
        isBestMatch: boolean,
        intent: ParsedIntent,
    ): RankedCandidate {
        const sd = estimateSectorDistance(intent.location.sector, provider.homeSector);
        return {
            providerId: provider.id,
            providerUuid: provider.uuid,
            displayName: provider.displayName,
            matchScore: result.matchScore,
            isBestMatch,
            tag: this.buildTag(provider),
            distanceKm: Number(sd.km.toFixed(1)),
            etaMinutes: sd.minutes,
            priceEstimate: provider.baseVisitFee,
            factors: result.factors,
        };
    }

    private buildTag(provider: Provider): string {
        if (provider.specializationTags.length === 0) return 'Generalist';
        if (provider.specializationTags.includes('budget')) {
            const other = provider.specializationTags.find((t) => t !== 'budget') ?? 'service';
            return `Budget · ${other} AC`;
        }
        if (provider.specializationTags.includes('premium')) {
            return `Specialist · ${provider.specializationTags.find((t) => t !== 'premium') ?? 'premium'}`;
        }
        return `Specialist · ${provider.specializationTags[0]}`;
    }

    private buildSummary(input: RankingAgentInput, candidates: RankedCandidate[]): string {
        const sector = input.intent.location.sector ?? 'your area';
        const entries = Object.entries(FACTOR_WEIGHTS) as Array<[string, number]>;
        const topFactors = entries
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([key]) => key.replace(/_/g, ' '));
        const topMatch = candidates[0]?.matchScore ?? 0;
        return `Ranked by ${entries.length} factors — top three by weight: ${topFactors.join(', ')}. Best match scored ${topMatch} (near ${sector}).`;
    }
}

function toFactorOutput(factor: FactorComputation): FactorOutput {
    return {
        label: factor.label,
        weight: factor.weight,
        confidence: factor.confidence,
        contribution: `${factor.contribution >= 0 ? '+' : ''}${factor.contribution}`,
        note: factor.note,
    };
}

function isNarrativeResponse(value: unknown): value is RankingNarrativeResponse {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return typeof v.narrative === 'string';
}
