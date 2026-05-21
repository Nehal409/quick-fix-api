export interface BookingProviderSnapshot {
    providerId: number;
    providerUuid: string;
    displayName: string;
    rating: number;
    reviewCount: number;
    homeSector: string;
    homeCity: string;
}

export interface BookingCustomerSnapshot {
    userId: number;
    name: string;
    email: string;
}

export interface BookingAddress {
    sector: string | null;
    city: string | null;
    line?: string;
    lat?: number;
    lng?: number;
}

export interface BookingServiceInfo {
    category: string;
    label: string;
    severity: 'low' | 'medium' | 'high';
}
