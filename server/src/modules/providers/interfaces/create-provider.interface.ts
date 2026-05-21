export interface CreateProviderData {
    userId: number;
    displayName: string;
    serviceCategories: string[];
    specializationTags?: string[];
    serviceAreas: string[];
    homeSector: string;
    homeCity: string;
    homeLat?: number | null;
    homeLng?: number | null;
    experienceYears: number;
    baseVisitFee: number;
    rating?: number;
    reviewCount?: number;
    onTimePercent?: number;
    cancelRate?: number;
    completedJobs30d?: number;
    isActive?: boolean;
}
