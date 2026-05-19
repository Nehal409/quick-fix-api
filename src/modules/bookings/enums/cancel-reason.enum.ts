export enum CustomerCancelReason {
    CHANGED_MIND = 'changed_mind',
    FOUND_ALTERNATIVE = 'found_alternative',
    WRONG_TIME = 'wrong_time',
    OTHER = 'other',
}

export enum ProviderCancelReason {
    FAMILY_EMERGENCY = 'family_emergency',
    VEHICLE_BREAKDOWN = 'vehicle_breakdown',
    SICK_WITH_PROOF = 'sick_with_proof',
    DOUBLE_BOOKED = 'double_booked',
    UNRESPONSIVE_CUSTOMER = 'unresponsive_customer',
    OTHER = 'other',
}

export enum CancelledBy {
    CUSTOMER = 'customer',
    PROVIDER = 'provider',
}

export type CancelReason = CustomerCancelReason | ProviderCancelReason;
