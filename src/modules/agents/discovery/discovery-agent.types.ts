import { Provider, ProviderSnapshot } from '../../providers';
import { ParsedIntent } from '../intent';

export interface DiscoveryAgentInput {
    intent: ParsedIntent;
    limit?: number;
}

export type DiscoveryReason = 'sector_match' | 'city_fallback' | 'category_only';

export interface DiscoveredProvider {
    provider: ProviderSnapshot;
    reason: DiscoveryReason;
    initialScore: number;
}

export interface DiscoveryAgentResult {
    /** Display-safe snapshots for UI consumption. */
    candidates: DiscoveredProvider[];
    /** Raw entities passed forward to the Ranking Agent — not exposed in HTTP responses. */
    providers: Provider[];
    summary: {
        totalAvailable: number;
        returned: number;
        category: string;
        sector: string | null;
        city: string | null;
    };
}
