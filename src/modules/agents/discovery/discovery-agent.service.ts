import { Injectable, Logger } from '@nestjs/common';
import { LogModuleTypes } from 'src/common';
import { Provider, ProviderSnapshot, ProvidersRepository } from '../../providers';
import { Agent, AgentRunContext } from '../interfaces';
import { AgentOrchestratorService } from '../services';
import {
    DiscoveredProvider,
    DiscoveryAgentInput,
    DiscoveryAgentResult,
    DiscoveryReason,
} from './discovery-agent.types';

const DEFAULT_LIMIT = 10;

@Injectable()
export class DiscoveryAgentService implements Agent<DiscoveryAgentInput, DiscoveryAgentResult> {
    readonly name = 'discovery_agent';
    private readonly logger = new Logger(LogModuleTypes.AGENTS);

    constructor(
        private readonly providers: ProvidersRepository,
        private readonly orchestrator: AgentOrchestratorService,
    ) {}

    async run(input: DiscoveryAgentInput, context: AgentRunContext): Promise<DiscoveryAgentResult> {
        const startedAt = Date.now();
        const { intent } = input;
        const category = intent.service.category;
        const sector = intent.location.sector;
        const city = intent.location.city;
        const limit = input.limit ?? DEFAULT_LIMIT;

        const providers = await this.providers.findCandidates({
            category,
            sector,
            city,
            limit,
        });

        const candidates = providers.map((p) => this.toDiscovered(p, intent));

        const summary: DiscoveryAgentResult['summary'] = {
            totalAvailable: providers.length,
            returned: candidates.length,
            category,
            sector,
            city,
        };

        this.orchestrator.recordTrace(context, {
            agent: this.name,
            tookMs: Date.now() - startedAt,
            note: `category=${category} sector=${sector ?? '-'} returned=${candidates.length}`,
        });

        if (candidates.length === 0) {
            this.logger.warn({
                message: 'Discovery returned zero candidates',
                data: { traceId: context.traceId, category, sector, city },
            });
        }

        return { candidates, providers, summary };
    }

    private toDiscovered(
        provider: Provider,
        intent: DiscoveryAgentInput['intent'],
    ): DiscoveredProvider {
        const snapshot: ProviderSnapshot = {
            id: provider.id,
            uuid: provider.uuid,
            displayName: provider.displayName,
            rating: provider.rating,
            reviewCount: provider.reviewCount,
            experienceYears: provider.experienceYears,
            onTimePercent: provider.onTimePercent,
            specializationTags: provider.specializationTags,
            homeSector: provider.homeSector,
            homeCity: provider.homeCity,
            baseVisitFee: provider.baseVisitFee,
        };

        return {
            provider: snapshot,
            reason: this.classifyReason(provider, intent),
            initialScore: this.initialScore(provider, intent),
        };
    }

    private classifyReason(
        provider: Provider,
        intent: DiscoveryAgentInput['intent'],
    ): DiscoveryReason {
        const sector = intent.location.sector;
        if (sector && provider.serviceAreas.includes(sector)) return 'sector_match';
        if (sector && provider.homeSector === sector) return 'sector_match';
        if (intent.location.city && provider.homeCity === intent.location.city) {
            return 'city_fallback';
        }
        return 'category_only';
    }

    private initialScore(provider: Provider, intent: DiscoveryAgentInput['intent']): number {
        const ratingPoints = provider.rating * 10;
        const onTimePoints = provider.onTimePercent * 30;
        const cancelPenalty = provider.cancelRate * 100;
        const specBonus = this.specializationOverlap(provider, intent) * 8;
        return Number((ratingPoints + onTimePoints - cancelPenalty + specBonus).toFixed(2));
    }

    private specializationOverlap(
        provider: Provider,
        intent: DiscoveryAgentInput['intent'],
    ): number {
        const hints = new Set<string>();
        const label = intent.service.label.toLowerCase();
        if (label.includes('inverter')) hints.add('inverter');
        if (label.includes('split')) hints.add('split');
        if (label.includes('window')) hints.add('window');
        if (intent.budget.priceSensitive) hints.add('budget');
        let overlap = 0;
        for (const tag of provider.specializationTags) {
            if (hints.has(tag)) overlap += 1;
        }
        return overlap;
    }
}
