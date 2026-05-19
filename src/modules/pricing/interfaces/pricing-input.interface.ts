import { ParsedIntent } from '../../agents/intent/intent-agent.types';
import { Provider } from '../../providers/entities';
import { MarketSignal } from '../enums';

export interface MarketContext {
    signal: MarketSignal;
    description?: string;
}

export interface PricingInput {
    intent: ParsedIntent;
    provider: Provider;
    peers: Provider[];
    customerCompletedBookings?: number;
    marketContext?: MarketContext;
}
