import { FactorKey } from '../enums';

/**
 * System weights for each factor — sum to ~1.0. Tweakable via env later if needed.
 * These are distinct from the per-result `confidence` value the UI renders as a bar
 * (which reflects evidence strength for a specific provider).
 */
export const FACTOR_WEIGHTS: Record<FactorKey, number> = {
    [FactorKey.SPECIALIZATION]: 0.22,
    [FactorKey.ON_TIME]: 0.18,
    [FactorKey.DISTANCE]: 0.16,
    [FactorKey.CANCEL_RATE]: 0.12,
    [FactorKey.REVIEW_RECENCY]: 0.1,
    [FactorKey.CAPACITY]: 0.1,
    [FactorKey.BUDGET_FIT]: 0.07,
    [FactorKey.PRICE_PER_VISIT]: 0.05,
};
