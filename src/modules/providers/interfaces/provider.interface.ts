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

export interface CreateSlotData {
    providerId: number;
    date: string;       // 'YYYY-MM-DD'
    startTime: string;  // 'HH:MM'
    endTime: string;    // 'HH:MM'
}

/** Used to query slots that overlap a requested time window. */
export interface SlotWindow {
    date: string;       // 'YYYY-MM-DD'
    startTime: string;  // 'HH:MM'
    endTime: string;    // 'HH:MM'
}

export interface SlotSummary {
    id: number;
    providerId: number;
    date: string;
    startTime: string;
    endTime: string;
    isBooked: boolean;
    bookingId: number | null;
}
