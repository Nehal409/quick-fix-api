import { MarketSignal, PricingKey, PricingKind } from '../enums';

export interface PriceBreakdownRow {
    key: PricingKey;
    label: string;
    description: string;
    amount: number;
    kind: PricingKind;
    signal?: MarketSignal;
}
