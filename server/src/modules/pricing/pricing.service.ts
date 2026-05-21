import { Injectable } from '@nestjs/common';
import { Provider } from '../providers/entities';
import { MarketSignal, PricingKey, PricingKind } from './enums';
import { estimateSectorDistance } from '../matching/factors/sector-distance';
import { PriceBreakdownRow, PriceFairnessBand, PriceQuote, PricingInput } from './interfaces';

const TRAVEL_RATE_PKR_PER_KM = 50;
const PLATFORM_FEE_PCT = 0.2;
const FAIRNESS_BAND_PCT = 0.15;

const URGENCY_MULTIPLIERS = { high: 1.1, medium: 1.05, low: 1.0 } as const;
const SURGE_MULTIPLIERS: Record<MarketSignal, number> = {
    [MarketSignal.NORMAL]: 1.0,
    [MarketSignal.HEATWAVE]: 1.1,
    [MarketSignal.HOLIDAY]: 1.05,
};

const COMPLEXITY_TABLE: Array<{ tag: string; amount: number; label: string }> = [
    { tag: 'inverter', amount: 1200, label: 'Inverter unit · intermediate' },
    { tag: 'central', amount: 1500, label: 'Central AC · advanced' },
    { tag: 'commercial', amount: 1400, label: 'Commercial · advanced' },
    { tag: 'split', amount: 800, label: 'Split unit · standard' },
    { tag: 'window', amount: 400, label: 'Window unit · basic' },
];

const SURGE_REASON: Record<MarketSignal, string> = {
    [MarketSignal.NORMAL]: 'standard demand',
    [MarketSignal.HEATWAVE]: 'Heatwave alert',
    [MarketSignal.HOLIDAY]: 'Public holiday',
};

@Injectable()
export class PricingService {
    computeQuote(input: PricingInput): PriceQuote {
        const visit = this.computeVisitFee(input.provider);
        const travel = this.computeTravel(input);
        const complexity = this.computeComplexity(input);
        const baseSubtotal = visit.amount + travel.amount + complexity.amount;

        const urgency = this.computeUrgency(input, baseSubtotal);
        const loyaltyDiscount = this.computeLoyaltyDiscount(input, baseSubtotal + urgency.amount);
        const demandSurge = this.computeDemandSurge(input, baseSubtotal);

        const breakdown: PriceBreakdownRow[] = [
            visit,
            travel,
            complexity,
            urgency,
            loyaltyDiscount,
            demandSurge,
        ];

        const estimateTotal = breakdown.reduce((sum, row) => sum + row.amount, 0);
        const budgetCap = input.intent.budget.max;
        const withinBudget = budgetCap == null ? true : estimateTotal <= budgetCap;

        return {
            estimateTotal: Math.round(estimateTotal),
            currency: 'PKR',
            budgetCap,
            withinBudget,
            breakdown,
            fairness: this.computeFairness(estimateTotal, input.peers, input.provider, input),
        };
    }

    private computeVisitFee(provider: Provider): PriceBreakdownRow {
        return {
            key: PricingKey.VISIT_FEE,
            label: 'Visit fee',
            description: 'Diagnostic + first 30 min',
            amount: provider.baseVisitFee,
            kind: PricingKind.BASE,
        };
    }

    private computeTravel(input: PricingInput): PriceBreakdownRow {
        const distance = estimateSectorDistance(
            input.intent.location.sector,
            input.provider.homeSector,
        );
        const amount = Math.round(distance.km * TRAVEL_RATE_PKR_PER_KM);
        return {
            key: PricingKey.TRAVEL,
            label: 'Travel cost',
            description: `${distance.km.toFixed(1)} km × Rs. ${TRAVEL_RATE_PKR_PER_KM}/km`,
            amount,
            kind: PricingKind.BASE,
        };
    }

    private computeComplexity(input: PricingInput): PriceBreakdownRow {
        const label = input.intent.service.label.toLowerCase();
        const tagsInLabel = COMPLEXITY_TABLE.find((entry) => label.includes(entry.tag));
        const tagsInProvider = COMPLEXITY_TABLE.find((entry) =>
            input.provider.specializationTags.includes(entry.tag),
        );
        const chosen = tagsInLabel ??
            tagsInProvider ?? {
                amount: 600,
                label: 'Standard repair',
                tag: 'standard',
            };
        return {
            key: PricingKey.COMPLEXITY,
            label: 'Service complexity',
            description: chosen.label,
            amount: chosen.amount,
            kind: PricingKind.BASE,
        };
    }

    private computeUrgency(input: PricingInput, baseSubtotal: number): PriceBreakdownRow {
        const multiplier = URGENCY_MULTIPLIERS[input.intent.urgency];
        const amount = Math.round(baseSubtotal * (multiplier - 1));
        const pct = Math.round((multiplier - 1) * 100);
        return {
            key: PricingKey.URGENCY,
            label: 'Urgency adjustment',
            description:
                multiplier === 1
                    ? 'No urgency surcharge'
                    : `${this.urgencyWindow(input.intent.urgency)} · ×${multiplier.toFixed(2)} (+${pct}%)`,
            amount,
            kind: amount > 0 ? PricingKind.SURCHARGE : PricingKind.BASE,
        };
    }

    private computeLoyaltyDiscount(
        input: PricingInput,
        runningSubtotal: number,
    ): PriceBreakdownRow {
        const completed = input.customerCompletedBookings ?? 0;
        let pct = 0;
        if (completed >= 10) pct = 0.05;
        else if (completed >= 3) pct = 0.02;
        const amount = -Math.round(runningSubtotal * pct);
        return {
            key: PricingKey.LOYALTY_DISCOUNT,
            label: 'Loyalty discount',
            description:
                pct === 0
                    ? 'New customer · no discount yet'
                    : `Returning customer · −${Math.round(pct * 100)}%`,
            amount,
            kind: PricingKind.DISCOUNT,
        };
    }

    private computeDemandSurge(input: PricingInput, baseSubtotal: number): PriceBreakdownRow {
        const signal = input.marketContext?.signal ?? MarketSignal.NORMAL;
        const multiplier = SURGE_MULTIPLIERS[signal];
        const amount = Math.round(baseSubtotal * (multiplier - 1));
        return {
            key: PricingKey.DEMAND_SURGE,
            label: 'Demand surge',
            description:
                multiplier === 1
                    ? 'No surge in effect'
                    : `${SURGE_REASON[signal]} · ×${multiplier.toFixed(2)}`,
            amount,
            kind: amount > 0 ? PricingKind.SURCHARGE : PricingKind.BASE,
            signal,
        };
    }

    private computeFairness(
        total: number,
        peers: Provider[],
        provider: Provider,
        input: PricingInput,
    ): PriceFairnessBand {
        const peerPool = peers.length > 0 ? peers : [provider];
        const peerEstimates = peerPool.map((peer) => {
            const distance = estimateSectorDistance(input.intent.location.sector, peer.homeSector);
            const peerComplexity =
                COMPLEXITY_TABLE.find((c) => peer.specializationTags.includes(c.tag))?.amount ??
                600;
            return (
                peer.baseVisitFee +
                Math.round(distance.km * TRAVEL_RATE_PKR_PER_KM) +
                peerComplexity
            );
        });
        const sorted = peerEstimates.sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const median =
            sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
        const marketLow = Math.round(median * (1 - FAIRNESS_BAND_PCT));
        const marketHigh = Math.round(median * (1 + FAIRNESS_BAND_PCT));
        const platformFee = Math.round(total * PLATFORM_FEE_PCT);
        return {
            marketLow,
            marketHigh,
            yourPrice: Math.round(total),
            providerKeeps: Math.round(total) - platformFee,
            platformFee,
        };
    }

    private urgencyWindow(urgency: 'low' | 'medium' | 'high'): string {
        return urgency === 'high'
            ? 'Next-morning slot'
            : urgency === 'medium'
              ? 'Within 3 days'
              : 'Flexible scheduling';
    }
}
