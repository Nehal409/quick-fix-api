import { FactorKey } from '../enums';
import { FactorComputation, FactorInput } from '../interfaces';
import { FACTOR_WEIGHTS } from './factor-weights';
import { estimateSectorDistance } from './sector-distance';

export * from './factor-weights';
export * from './sector-distance';

type FactorFn = (input: FactorInput) => FactorComputation;

const point = (weight: number, normalized: number): number => Math.round(normalized * weight * 100);

const inferIntentTags = (input: FactorInput): Set<string> => {
    const tags = new Set<string>();
    const label = input.intent.service.label.toLowerCase();
    if (label.includes('inverter')) tags.add('inverter');
    if (label.includes('split')) tags.add('split');
    if (label.includes('window')) tags.add('window');
    if (label.includes('central')) tags.add('central');
    if (label.includes('commercial')) tags.add('commercial');
    if (input.intent.budget.priceSensitive) tags.add('budget');
    return tags;
};

const specialization: FactorFn = (input) => {
    const wanted = inferIntentTags(input);
    const overlap = [...wanted].filter((t) => input.provider.specializationTags.includes(t));
    const normalized = wanted.size === 0 ? 0.5 : Math.min(overlap.length / wanted.size, 1);
    const weight = FACTOR_WEIGHTS[FactorKey.SPECIALIZATION];
    return {
        key: FactorKey.SPECIALIZATION,
        label: 'AC specialization match',
        weight,
        confidence: wanted.size === 0 ? 0.5 : 0.95,
        contribution: point(weight, normalized),
        note:
            overlap.length > 0
                ? `tags match: ${overlap.join(', ')}`
                : `no overlap with ${[...wanted].join(', ') || 'inferred tags'}`,
    };
};

const onTime: FactorFn = (input) => {
    const weight = FACTOR_WEIGHTS[FactorKey.ON_TIME];
    return {
        key: FactorKey.ON_TIME,
        label: 'On-time score',
        weight,
        confidence: Math.min(input.provider.completedJobs30d / 30, 1),
        contribution: point(weight, input.provider.onTimePercent),
        note: `${Math.round(input.provider.onTimePercent * 100)}% over last ${input.provider.completedJobs30d} jobs`,
    };
};

const distance: FactorFn = (input) => {
    const sd = estimateSectorDistance(input.intent.location.sector, input.provider.homeSector);
    const weight = FACTOR_WEIGHTS[FactorKey.DISTANCE];
    const normalized = Math.max(0, 1 - sd.km / 10);
    return {
        key: FactorKey.DISTANCE,
        label: 'Distance / travel time',
        weight,
        confidence: 0.6,
        contribution: point(weight, normalized),
        note: `${sd.km.toFixed(1)} km · ${sd.minutes} min — ${sd.rationale}`,
    };
};

const cancelRate: FactorFn = (input) => {
    const weight = FACTOR_WEIGHTS[FactorKey.CANCEL_RATE];
    const normalized = Math.max(0, 1 - input.provider.cancelRate * 10);
    return {
        key: FactorKey.CANCEL_RATE,
        label: 'Cancellation rate',
        weight,
        confidence: 0.9,
        contribution: point(weight, normalized),
        note: `${(input.provider.cancelRate * 100).toFixed(1)}% (lower is better)`,
    };
};

const reviewRecency: FactorFn = (input) => {
    const weight = FACTOR_WEIGHTS[FactorKey.REVIEW_RECENCY];
    const recencyProxy =
        (input.provider.rating / 5) * Math.min(input.provider.reviewCount / 100, 1);
    return {
        key: FactorKey.REVIEW_RECENCY,
        label: 'Review recency',
        weight,
        confidence: 0.5,
        contribution: point(weight, recencyProxy),
        note: `${input.provider.reviewCount} reviews · ${input.provider.rating.toFixed(1)}★ — proxied from rating + volume until reviews table lands`,
    };
};

const capacity: FactorFn = (input) => {
    const weight = FACTOR_WEIGHTS[FactorKey.CAPACITY];
    const normalized = Math.max(0, 1 - input.provider.cancelRate * 4);
    return {
        key: FactorKey.CAPACITY,
        label: 'Capacity in requested window',
        weight,
        confidence: 0.4,
        contribution: point(weight, normalized),
        note: `estimated from cancel rate — replace when availability table lands`,
    };
};

const budgetFit: FactorFn = (input) => {
    const weight = FACTOR_WEIGHTS[FactorKey.BUDGET_FIT];
    const max = input.intent.budget.max;
    if (max == null) {
        return {
            key: FactorKey.BUDGET_FIT,
            label: 'Budget fit',
            weight,
            confidence: 0.2,
            contribution: point(weight, 0.5),
            note: 'no budget cap supplied',
        };
    }
    const fits = input.provider.baseVisitFee <= max;
    return {
        key: FactorKey.BUDGET_FIT,
        label: 'Budget fit',
        weight,
        confidence: 0.85,
        contribution: point(weight, fits ? 1 : 0),
        note: fits
            ? `base fee Rs. ${input.provider.baseVisitFee} ≤ cap Rs. ${max}`
            : `base fee Rs. ${input.provider.baseVisitFee} > cap Rs. ${max}`,
    };
};

const pricePerVisit: FactorFn = (input) => {
    const weight = FACTOR_WEIGHTS[FactorKey.PRICE_PER_VISIT];
    if (input.peers.candidateCount === 0) {
        return {
            key: FactorKey.PRICE_PER_VISIT,
            label: 'Price per visit',
            weight,
            confidence: 0.2,
            contribution: 0,
            note: 'no peer pricing context',
        };
    }
    const delta = input.peers.medianPrice - input.provider.baseVisitFee;
    const normalized = Math.max(-1, Math.min(1, delta / input.peers.medianPrice));
    const contribution = Math.round(normalized * weight * 100);
    return {
        key: FactorKey.PRICE_PER_VISIT,
        label: 'Price per visit',
        weight,
        confidence: 0.7,
        contribution,
        note:
            delta >= 0
                ? `Rs. ${input.provider.baseVisitFee} — below median Rs. ${input.peers.medianPrice}`
                : `Rs. ${input.provider.baseVisitFee} — above median Rs. ${input.peers.medianPrice}`,
    };
};

export const FACTOR_FUNCTIONS: FactorFn[] = [
    specialization,
    onTime,
    distance,
    cancelRate,
    reviewRecency,
    capacity,
    budgetFit,
    pricePerVisit,
];
