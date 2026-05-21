import { ParsedIntent } from '../../agents/intent/intent-agent.types';
import { Provider } from '../../providers/entities';
import { FactorKey } from '../enums';

export interface PeerContext {
    medianPrice: number;
    candidateCount: number;
}

export interface FactorInput {
    intent: ParsedIntent;
    provider: Provider;
    peers: PeerContext;
}

export interface FactorComputation {
    key: FactorKey;
    label: string;
    weight: number;
    confidence: number;
    contribution: number;
    note: string;
}
