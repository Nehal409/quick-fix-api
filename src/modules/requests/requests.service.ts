import { badRequest, internal, notFound } from '@hapi/boom';
import { Injectable, Logger } from '@nestjs/common';
import { LogModuleTypes, messages } from 'src/common';
import {
    AgentOrchestratorService,
    AgentRunContext,
    ClarificationAnswer,
    DiscoveryAgentResult,
    DiscoveryAgentService,
    IntentAgentResult,
    IntentAgentService,
    Language,
    ParsedIntent,
    PricingAgentResult,
    PricingAgentService,
    RankedCandidate,
    RankingAgentResult,
    RankingAgentService,
} from '../agents';
import { NotificationsService, NotificationTone, NotificationType } from '../notifications';
import { MarketSignal } from '../pricing';
import { Provider, ProvidersRepository } from '../providers';
import { ClarifyRequestDto, CreateRequestDto } from './dto';
import { PersistedRankedCandidate, ServiceRequest } from './entities';
import { RequestStatus } from './enums';
import {
    CandidateResponse,
    ChatResponse,
    ChatTurn,
    IntentSummary,
    ReasoningResponse,
    RequestResponse,
} from './interfaces';
import { RequestsRepository } from './repositories';

@Injectable()
export class RequestsService {
    private readonly logger = new Logger(LogModuleTypes.AGENTS);

    constructor(
        private readonly repository: RequestsRepository,
        private readonly providersRepository: ProvidersRepository,
        private readonly intentAgent: IntentAgentService,
        private readonly discoveryAgent: DiscoveryAgentService,
        private readonly rankingAgent: RankingAgentService,
        private readonly pricingAgent: PricingAgentService,
        private readonly orchestrator: AgentOrchestratorService,
        private readonly notifications: NotificationsService,
    ) {}

    async create(userId: number, dto: CreateRequestDto): Promise<RequestResponse> {
        const context = this.orchestrator.createContext();
        const request = await this.repository.create({
            userId,
            rawInput: dto.rawInput,
            language: dto.language ?? null,
            locationHint: dto.location ?? null,
            status: RequestStatus.PENDING,
            traceId: context.traceId,
        });

        return this.runPipeline(request, context, async () =>
            this.intentAgent.run(
                { rawInput: dto.rawInput, language: dto.language, location: dto.location },
                context,
            ),
        );
    }

    async clarify(userId: number, uuid: string, dto: ClarifyRequestDto): Promise<RequestResponse> {
        const request = await this.repository.findByUuidForUser(uuid, userId);
        if (!request) {
            throw notFound(messages.REQUEST.NOT_FOUND);
        }
        if (request.status !== RequestStatus.NEEDS_CLARIFICATION) {
            throw badRequest(messages.REQUEST.CLARIFY_NOT_ALLOWED);
        }

        const answers = this.pairAnswersWithQuestions(request, dto.answers);
        const context = this.orchestrator.createContext(request.uuid);

        return this.runPipeline(
            request,
            context,
            async () =>
                this.intentAgent.run(
                    {
                        rawInput: request.rawInput,
                        language: (request.language as Language) ?? undefined,
                        location: request.locationHint ?? undefined,
                        clarificationAnswers: answers,
                    },
                    context,
                ),
            {
                clarificationAnswers: { ...(request.clarificationAnswers ?? {}), ...dto.answers },
            },
        );
    }

    async getReasoning(
        userId: number,
        requestUuid: string,
        providerUuid: string,
    ): Promise<ReasoningResponse> {
        const request = await this.repository.findByUuidForUser(requestUuid, userId);
        if (!request) {
            throw notFound(messages.REQUEST.NOT_FOUND);
        }
        if (request.status !== RequestStatus.READY || !request.parsedIntent) {
            throw badRequest(messages.REQUEST.NOT_READY_FOR_REASONING);
        }
        const ranked = request.rankedCandidates ?? [];
        const targetEntry = ranked.find((c) => c.providerUuid === providerUuid);
        if (!targetEntry) {
            throw notFound(messages.REQUEST.CANDIDATE_NOT_IN_POOL);
        }

        const ids = ranked.map((c) => c.providerId);
        const providers = await this.providersRepository.findManyByIds(ids);
        const target = providers.find((p) => p.uuid === providerUuid);
        if (!target) {
            throw notFound(messages.PROVIDER.NOT_FOUND);
        }
        const peers = providers.filter((p) => p.uuid !== providerUuid);

        const context = this.orchestrator.createContext(request.uuid);
        return this.rankingAgent.explainOne(
            { intent: request.parsedIntent, target, peers },
            context,
        );
    }

    private async runPipeline(
        request: ServiceRequest,
        context: AgentRunContext,
        runIntent: () => Promise<IntentAgentResult>,
        extra: Partial<ServiceRequest> = {},
    ): Promise<RequestResponse> {
        try {
            const intent = await runIntent();
            const persistExtra: Partial<ServiceRequest> = { ...extra, traceId: context.traceId };

            if (intent.status === 'needs_clarification') {
                const updated = await this.persistIntent(request.id, intent, persistExtra);
                return this.buildClarificationResponse(updated, intent);
            }

            const discovery = await this.discoveryAgent.run({ intent: intent.intent }, context);
            const ranking = await this.rankingAgent.run(
                { intent: intent.intent, providers: discovery.providers },
                context,
            );
            const bestProvider = this.resolveBestProvider(ranking, discovery.providers);
            const peers = discovery.providers.filter((p) => p.id !== bestProvider.id);
            const pricing = await this.pricingAgent.run(
                {
                    intent: intent.intent,
                    provider: bestProvider,
                    peers,
                    marketContext: { signal: this.inferMarketSignal(intent.intent) },
                },
                context,
            );

            const updated = await this.persistReady(
                request.id,
                intent,
                ranking,
                pricing,
                persistExtra,
            );
            await this.notifyQuoteReady(updated, pricing);
            return this.buildReadyResponse(
                updated,
                intent,
                ranking,
                discovery,
                pricing,
                bestProvider,
            );
        } catch (err) {
            await this.repository.update(request.id, { status: RequestStatus.FAILED });
            this.logger.error({
                message: 'Pipeline failed',
                data: { requestId: request.uuid, traceId: context.traceId, err: String(err) },
            });
            throw err;
        }
    }

    private resolveBestProvider(ranking: RankingAgentResult, pool: Provider[]): Provider {
        const best = ranking.candidates.find((c) => c.isBestMatch) ?? ranking.candidates[0];
        if (!best) {
            throw internal('Ranking returned no candidates');
        }
        const provider = pool.find((p) => p.id === best.providerId);
        if (!provider) {
            throw internal('Best-match provider missing from discovery pool');
        }
        return provider;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private inferMarketSignal(_intent: ParsedIntent): MarketSignal {
        // Hackathon: treat all AC requests as the heatwave demo path. Replace with a
        // real signal feed (weather API, ops toggle) when one exists.
        return MarketSignal.HEATWAVE;
    }

    private pairAnswersWithQuestions(
        request: ServiceRequest,
        answers: Record<string, string>,
    ): ClarificationAnswer[] {
        const pending = request.clarifications ?? [];
        const paired: ClarificationAnswer[] = [];
        for (const [id, answer] of Object.entries(answers)) {
            const question = pending.find((c) => c.id === id);
            if (!question) {
                throw badRequest(`Unknown clarification id "${id}".`);
            }
            paired.push({ question: question.prompt, answer });
        }
        return paired;
    }

    private async persistIntent(
        requestId: number,
        result: Extract<IntentAgentResult, { status: 'needs_clarification' }>,
        extra: Partial<ServiceRequest>,
    ): Promise<ServiceRequest> {
        return this.repository.update(requestId, {
            status: RequestStatus.NEEDS_CLARIFICATION,
            parsedIntent: result.partialIntent,
            clarifications: result.clarifications,
            confidence: result.partialIntent.confidence,
            ...extra,
        });
    }

    private async persistReady(
        requestId: number,
        result: Extract<IntentAgentResult, { status: 'ready' }>,
        ranking: RankingAgentResult,
        pricing: PricingAgentResult,
        extra: Partial<ServiceRequest>,
    ): Promise<ServiceRequest> {
        // NOTE: `clarifications` is intentionally not wiped — keeping it lets the
        // chat reconstruction endpoint show the full back-and-forth even after the
        // request resolves to READY. The `status` field is the source of truth for
        // whether the UI should still surface clarification UI.
        return this.repository.update(requestId, {
            status: RequestStatus.READY,
            parsedIntent: result.intent,
            confidence: result.intent.confidence,
            rankedCandidates: ranking.candidates.map(toPersistedCandidate),
            rankingSummary: ranking.summary,
            pricingQuote: pricing.quote,
            ...extra,
        });
    }

    private async notifyQuoteReady(
        request: ServiceRequest,
        pricing: PricingAgentResult,
    ): Promise<void> {
        try {
            const total = pricing.quote.estimateTotal.toLocaleString('en-PK');
            const withinBudget = pricing.quote.withinBudget
                ? 'under your budget'
                : 'over your budget';
            await this.notifications.create({
                userId: request.userId,
                type: NotificationType.PRICE,
                tone: NotificationTone.NEUTRAL,
                icon: 'wallet',
                title: 'Quote ready',
                body: `Rs. ${total} — ${withinBudget}. Tap to review the breakdown.`,
                cta: { label: 'Review quote', target: `/requests/${request.uuid}` },
                requestId: request.id,
            });
        } catch (err) {
            this.logger.warn({
                message: 'Failed to enqueue quote-ready notification',
                data: { requestId: request.uuid, err: String(err) },
            });
        }
    }

    async getChat(userId: number, uuid: string): Promise<ChatResponse> {
        const request = await this.repository.findByUuidForUser(uuid, userId);
        if (!request) throw notFound(messages.REQUEST.NOT_FOUND);
        return {
            requestId: request.uuid,
            status: request.status,
            turns: this.reconstructChat(request),
        };
    }

    private reconstructChat(request: ServiceRequest): ChatTurn[] {
        const turns: ChatTurn[] = [];
        const createdAt = request.createdAt.toISOString();
        const updatedAt = request.updatedAt.toISOString();

        turns.push({
            order: 0,
            role: 'user',
            kind: 'message',
            text: request.rawInput,
            at: createdAt,
        });

        const clarifications = request.clarifications ?? [];
        if (clarifications.length > 0) {
            turns.push({
                order: 1,
                role: 'agent',
                kind: 'clarifications',
                questions: clarifications,
                at: createdAt,
            });
        }

        const answers = request.clarificationAnswers ?? null;
        if (answers && Object.keys(answers).length > 0) {
            turns.push({
                order: 2,
                role: 'user',
                kind: 'answers',
                answers,
                at: updatedAt,
            });
        }

        if (request.status === RequestStatus.READY && request.parsedIntent) {
            turns.push({
                order: turns.length,
                role: 'agent',
                kind: 'intent_ready',
                intent: request.parsedIntent,
                at: updatedAt,
            });
        }

        return turns;
    }

    private buildReadyResponse(
        request: ServiceRequest,
        result: Extract<IntentAgentResult, { status: 'ready' }>,
        ranking: RankingAgentResult,
        discovery: DiscoveryAgentResult,
        pricing: PricingAgentResult,
        bestProvider: Provider,
    ): RequestResponse {
        return {
            requestId: request.uuid,
            traceId: request.traceId ?? '',
            status: 'ready',
            intent: this.toIntentSummary(result.intent, result.extractedFields),
            candidates: ranking.candidates.map(toCandidateResponse),
            ranking: {
                factorCount: ranking.factorCount,
                latencyMs: ranking.latencyMs,
                summary: this.composeRankingSummary(discovery, ranking),
            },
            pricing: {
                providerId: bestProvider.uuid,
                quote: pricing.quote,
                explanation: pricing.explanation,
            },
        };
    }

    private composeRankingSummary(
        discovery: DiscoveryAgentResult,
        ranking: RankingAgentResult,
    ): string {
        const filtered = discovery.summary.returned;
        const scanned = discovery.summary.totalAvailable;
        const sector = discovery.summary.sector ?? 'your area';
        return `Scanned ${scanned} providers near ${sector}. Filtered to ${filtered} with matching specialization. ${ranking.summary}`;
    }

    private buildClarificationResponse(
        request: ServiceRequest,
        result: Extract<IntentAgentResult, { status: 'needs_clarification' }>,
    ): RequestResponse {
        return {
            requestId: request.uuid,
            traceId: request.traceId ?? '',
            status: 'needs_clarification',
            partialIntent: this.toIntentSummary(result.partialIntent, []),
            clarifications: result.clarifications,
        };
    }

    private toIntentSummary(
        intent: ParsedIntent,
        extractedFields: IntentSummary['extractedFields'],
    ): IntentSummary {
        return {
            service: intent.service,
            location: intent.location,
            when: intent.when,
            budget: intent.budget,
            urgency: intent.urgency,
            confidence: intent.confidence,
            languageDetected: intent.languageDetected,
            extractedFields,
            glosses: intent.glosses,
        };
    }
}

function toPersistedCandidate(candidate: RankedCandidate): PersistedRankedCandidate {
    return {
        providerId: candidate.providerId,
        providerUuid: candidate.providerUuid,
        displayName: candidate.displayName,
        matchScore: candidate.matchScore,
        isBestMatch: candidate.isBestMatch,
        tag: candidate.tag,
        distanceKm: candidate.distanceKm,
        etaMinutes: candidate.etaMinutes,
        priceEstimate: candidate.priceEstimate,
    };
}

function toCandidateResponse(candidate: RankedCandidate): CandidateResponse {
    return {
        providerId: candidate.providerUuid,
        displayName: candidate.displayName,
        matchScore: candidate.matchScore,
        isBestMatch: candidate.isBestMatch,
        tag: candidate.tag,
        distance: `${candidate.distanceKm.toFixed(1)} km`,
        eta: `${candidate.etaMinutes} min`,
        priceEstimate: `Rs. ${candidate.priceEstimate.toLocaleString('en-PK')}`,
    };
}
