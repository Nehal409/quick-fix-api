export interface ProviderSnapshot {
    id: number;
    uuid: string;
    displayName: string;
    rating: number;
    reviewCount: number;
    experienceYears: number;
    onTimePercent: number;
    specializationTags: string[];
    homeSector: string;
    homeCity: string;
    baseVisitFee: number;
}
