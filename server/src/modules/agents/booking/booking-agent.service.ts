import { Injectable, Logger } from '@nestjs/common';
import { randomBytes, randomInt } from 'crypto';
import { LogModuleTypes } from 'src/common';
import { PaymentMethod } from '../../bookings/enums/payment-method.enum';
import { Provider } from '../../providers/entities';
import { User } from '../../users/entities';
import { Agent, AgentRunContext } from '../interfaces';
import { ParsedIntent } from '../intent';
import { AgentOrchestratorService } from '../services';
import { BookingAgentInput, BookingAgentResult, BookingDraft } from './booking-agent.types';

const BOOKING_CODE_PREFIX = 'QF';

@Injectable()
export class BookingAgentService implements Agent<BookingAgentInput, BookingAgentResult> {
    readonly name = 'booking_agent';
    private readonly logger = new Logger(LogModuleTypes.AGENTS);

    constructor(private readonly orchestrator: AgentOrchestratorService) {}

    async run(input: BookingAgentInput, context: AgentRunContext): Promise<BookingAgentResult> {
        const startedAt = Date.now();

        const bookingCode = this.generateBookingCode();
        const scheduledAt = input.scheduledAt;

        const providerSnapshot = this.snapshotProvider(input.provider);
        const customerSnapshot = this.snapshotCustomer(input.customer);
        const address = this.buildAddress(input.intent);
        const service = this.buildService(input.intent);
        const statusTimeline = this.initialTimeline(scheduledAt);
        const wa = this.buildWhatsapp(bookingCode, input.provider, scheduledAt);

        const draft: BookingDraft = {
            bookingCode,
            scheduledAt,
            address,
            service,
            providerSnapshot,
            customerSnapshot,
            quotedTotal: input.pricingQuote.estimateTotal,
            paymentMethod: PaymentMethod.CASH,
            statusTimeline,
            simulatedWhatsapp: wa,
            confirmationMessage: this.buildConfirmation(input.provider, scheduledAt),
        };

        const latencyMs = Date.now() - startedAt;
        this.orchestrator.recordTrace(context, {
            agent: this.name,
            tookMs: latencyMs,
            note: `code=${bookingCode} scheduledAt=${scheduledAt.toISOString()}`,
        });

        return { draft, latencyMs };
    }

    /**
     * Generates a human-readable booking code of the form QF-####-XXX
     * (e.g. QF-2086-K3M). 4-digit random + 3 uppercase-alphanumeric chars gives
     * ~324k combinations per number band — sufficient for the demo without
     * needing a sequence.
     */
    generateBookingCode(): string {
        const numericPart = randomInt(1000, 10000);
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // skip ambiguous chars
        const bytes = randomBytes(3);
        let suffix = '';
        for (let i = 0; i < 3; i += 1) {
            suffix += alphabet[bytes[i] % alphabet.length];
        }
        return `${BOOKING_CODE_PREFIX}-${numericPart}-${suffix}`;
    }

    private snapshotProvider(provider: Provider) {
        return {
            providerId: provider.id,
            providerUuid: provider.uuid,
            displayName: provider.displayName,
            rating: provider.rating,
            reviewCount: provider.reviewCount,
            homeSector: provider.homeSector,
            homeCity: provider.homeCity,
        };
    }

    private snapshotCustomer(user: User) {
        return {
            userId: user.id,
            name: user.name,
            email: user.email,
        };
    }

    private buildAddress(intent: ParsedIntent) {
        return {
            sector: intent.location.sector,
            city: intent.location.city,
        };
    }

    private buildService(intent: ParsedIntent) {
        return {
            category: intent.service.category,
            label: intent.service.label,
            severity: intent.service.severity,
        };
    }

    private initialTimeline(scheduledAt: Date) {
        const now = new Date().toISOString();
        const expectedEnd = new Date(scheduledAt.getTime() + 60 * 60 * 1000).toISOString();
        return [
            {
                key: 'booking_confirmed' as const,
                label: 'Booking confirmed',
                timestamp: now,
                done: true,
            },
            {
                key: 'reminder_sent' as const,
                label: 'Reminder · 1 hour before',
                timestamp: new Date(scheduledAt.getTime() - 60 * 60 * 1000).toISOString(),
                done: false,
                sub: 'Will fire automatically',
            },
            {
                key: 'en_route' as const,
                label: 'Provider en route',
                timestamp: scheduledAt.toISOString(),
                done: false,
            },
            {
                key: 'in_progress' as const,
                label: 'Service in progress',
                timestamp: scheduledAt.toISOString(),
                done: false,
            },
            {
                key: 'completed' as const,
                label: 'Completion + feedback',
                timestamp: expectedEnd,
                done: false,
            },
        ];
    }

    private buildWhatsapp(bookingCode: string, provider: Provider, scheduledAt: Date) {
        const when = scheduledAt.toLocaleString('en-PK', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
        return {
            to: 'demo-customer',
            body: `Quickfix: Booking ${bookingCode} confirmed with ${provider.displayName} for ${when}. Reminder will be sent 1 hour before. Reply CANCEL to cancel.`,
            sentAt: new Date().toISOString(),
        };
    }

    private buildConfirmation(provider: Provider, scheduledAt: Date): string {
        const when = scheduledAt.toLocaleString('en-PK', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
        return `You're booked with ${provider.displayName} for ${when}.`;
    }
}
