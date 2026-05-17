export interface CreateProviderData {
    userId: number;
    name: string;
    phone?: string | null;
    location?: string | null;
    serviceCategories?: string[];
    specializationTags?: string[];
    rating?: number;
    onTimePercent?: number;
    cancelRate?: number;
    totalJobs?: number;
    serviceAreaKm?: number;
    isAvailable?: boolean;
}

export interface ProviderSummary {
    id: number;
    name: string;
    phone: string | null;
    location: string | null;
    serviceCategories: string[];
    specializationTags: string[];
    rating: number;
    onTimePercent: number;
    cancelRate: number;
    totalJobs: number;
    serviceAreaKm: number;
    isAvailable: boolean;
    createdAt: Date;
}
