import { PaymentMethod } from '../../bookings/enums/payment-method.enum';
import { BookingSimulatedWhatsapp } from '../../bookings/interfaces/booking-response.interface';
import {
    BookingAddress,
    BookingCustomerSnapshot,
    BookingProviderSnapshot,
    BookingServiceInfo,
} from '../../bookings/interfaces/booking-snapshot.interface';
import { TimelineEntry } from '../../bookings/interfaces/timeline-entry.interface';
import { PriceQuote } from '../../pricing';
import { Provider } from '../../providers/entities';
import { User } from '../../users/entities';
import { ParsedIntent } from '../intent';

export interface BookingAgentInput {
    customer: User;
    provider: Provider;
    intent: ParsedIntent;
    pricingQuote: PriceQuote;
    scheduledAt: Date;
}

export interface BookingDraft {
    bookingCode: string;
    scheduledAt: Date;
    address: BookingAddress;
    service: BookingServiceInfo;
    providerSnapshot: BookingProviderSnapshot;
    customerSnapshot: BookingCustomerSnapshot;
    quotedTotal: number;
    paymentMethod: PaymentMethod;
    statusTimeline: TimelineEntry[];
    simulatedWhatsapp: BookingSimulatedWhatsapp;
    confirmationMessage: string;
}

export interface BookingAgentResult {
    draft: BookingDraft;
    latencyMs: number;
}
