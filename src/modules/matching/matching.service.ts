import { Injectable } from '@nestjs/common';
import { ParsedIntent } from '../agents/intent/intent-agent.types';
import { Provider } from '../providers/entities';
import { FACTOR_FUNCTIONS } from './factors';
import { FactorComputation, MatchResult, PeerContext } from './interfaces';

@Injectable()
export class MatchingService {
    score(intent: ParsedIntent, provider: Provider, peers: PeerContext): MatchResult {
        const factors = FACTOR_FUNCTIONS.map((fn) => fn({ intent, provider, peers }));
        const matchScore = clamp(
            factors.reduce((sum, f) => sum + f.contribution, 0),
            0,
            100,
        );
        return { providerId: provider.id, matchScore, factors };
    }

    scoreAll(intent: ParsedIntent, providers: Provider[]): MatchResult[] {
        const peers = this.buildPeerContext(providers);
        return providers.map((p) => this.score(intent, p, peers));
    }

    private buildPeerContext(providers: Provider[]): PeerContext {
        if (providers.length === 0) {
            return { medianPrice: 0, candidateCount: 0 };
        }
        const prices = providers.map((p) => p.baseVisitFee).sort((a, b) => a - b);
        const mid = Math.floor(prices.length / 2);
        const medianPrice =
            prices.length % 2 === 0 ? Math.round((prices[mid - 1] + prices[mid]) / 2) : prices[mid];
        return { medianPrice, candidateCount: providers.length };
    }

    summariseFactor(factor: FactorComputation): string {
        const sign = factor.contribution >= 0 ? '+' : '';
        return `${factor.label}: ${sign}${factor.contribution} (${factor.note})`;
    }
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}
