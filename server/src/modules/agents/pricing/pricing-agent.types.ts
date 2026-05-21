import { PriceQuote, PricingInput } from '../../pricing';

export type PricingAgentInput = PricingInput;

export interface PricingAgentResult {
    quote: PriceQuote;
    explanation: string;
    latencyMs: number;
    usedFallback: boolean;
}
