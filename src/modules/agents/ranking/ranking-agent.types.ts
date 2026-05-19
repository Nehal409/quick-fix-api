import { FactorComputation } from '../../matching';
import { Provider } from '../../providers/entities';
import { PersistedRankedCandidate } from '../../requests/entities';
import { ParsedIntent } from '../intent';

export interface RankingAgentInput {
    intent: ParsedIntent;
    providers: Provider[];
    limit?: number;
}

export interface RankedCandidate extends PersistedRankedCandidate {
    factors: FactorComputation[];
}

export interface RankingAgentResult {
    candidates: RankedCandidate[];
    summary: string;
    factorCount: number;
    totalScanned: number;
    latencyMs: number;
}

export interface ExplainOneInput {
    intent: ParsedIntent;
    target: Provider;
    peers: Provider[];
}

export interface FactorOutput {
    label: string;
    weight: number;
    confidence: number;
    contribution: string;
    note: string;
}

export interface ComparisonAgainst {
    providerId: string;
    displayName: string;
    narrative: string;
    scoreDelta: number;
}

export interface ExplainOneResult {
    providerId: string;
    matchScore: number;
    narrative: string;
    factors: FactorOutput[];
    comparisonAgainst?: ComparisonAgainst;
    trace: { agent: string; latencyMs: number; tokens?: number; model?: string };
}
