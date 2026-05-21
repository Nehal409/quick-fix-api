import { PriceBreakdownRow } from './price-breakdown.interface';

export interface PriceFairnessBand {
    marketLow: number;
    marketHigh: number;
    yourPrice: number;
    providerKeeps: number;
    platformFee: number;
}

export interface PriceQuote {
    estimateTotal: number;
    currency: 'PKR';
    budgetCap: number | null;
    withinBudget: boolean;
    breakdown: PriceBreakdownRow[];
    fairness: PriceFairnessBand;
}
