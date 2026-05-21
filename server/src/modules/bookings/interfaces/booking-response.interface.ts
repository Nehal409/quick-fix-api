import { PriceQuote } from '../../pricing';
import { BookingStatus, CancelledBy } from '../enums';
import {
    BookingAddress,
    BookingCustomerSnapshot,
    BookingProviderSnapshot,
    BookingServiceInfo,
} from './booking-snapshot.interface';
import { TimelineEntry } from './timeline-entry.interface';

export interface BookingView {
    id: string; // human-readable code, e.g. "QF-2086-K3M"
    uuid: string;
    status: BookingStatus;
    scheduledAt: string;
    address: BookingAddress;
    service: BookingServiceInfo;
    provider: BookingProviderSnapshot;
    customer: BookingCustomerSnapshot;
    quotedTotal: number;
    finalTotal: number | null;
    paymentMethod: string;
    cancel?: {
        by: CancelledBy;
        reason: string;
        note?: string | null;
    };
    createdAt: string;
}

export interface BookingMapData {
    origin: { sector: string | null; lat?: number; lng?: number };
    destination: { sector: string; lat?: number; lng?: number };
    etaMinutes: number;
    distanceKm: number;
    staticMapUrl?: string;
}

export interface BookingSimulatedWhatsapp {
    to: string;
    body: string;
    sentAt: string;
}

export interface CreateBookingResponse {
    booking: BookingView;
    confirmationMessage: string;
    simulatedWhatsapp: BookingSimulatedWhatsapp;
}

export interface BookingDetailResponse {
    booking: BookingView;
    statusTimeline: TimelineEntry[];
    pricing: PriceQuote;
    mapData: BookingMapData;
}

export interface BookingsListSummary {
    bookingsThisYear: number;
    totalSpent: number;
    savingsVsMarket: number;
}

export interface BookingsListResponse {
    bookings: BookingView[];
    summary: BookingsListSummary;
}

export interface CancelBookingResponse {
    originalBooking: BookingView;
    rescheduleAttempted: false;
    // TODO: when Reschedule Agent lands, this shape gains `newBooking` + `rescheduleTrace`.
}
