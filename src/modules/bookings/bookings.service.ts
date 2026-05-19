import { badRequest, forbidden, internal, notFound } from '@hapi/boom';
import { Injectable, Logger } from '@nestjs/common';
import { LogModuleTypes, messages } from 'src/common';
import { AgentOrchestratorService, BookingAgentService } from '../agents';
import { estimateSectorDistance } from '../matching/factors/sector-distance';
import { ProvidersRepository } from '../providers';
import { RequestStatus } from '../requests/enums';
import { RequestsRepository } from '../requests/repositories';
import { UsersRepository } from '../users/repositories';
import { CancelBookingDto, CreateBookingDto, UpdateBookingStatusDto } from './dto';
import { Booking } from './entities';
import {
    ACTIVE_BOOKING_STATUSES,
    BookingStatus,
    CancelledBy,
    TERMINAL_BOOKING_STATUSES,
} from './enums';
import {
    BookingDetailResponse,
    BookingMapData,
    BookingView,
    BookingsListResponse,
    CancelBookingResponse,
    CreateBookingResponse,
    TimelineEntry,
    TimelineKey,
} from './interfaces';
import { BookingsRepository } from './repositories';

const STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
    [BookingStatus.PENDING]: [BookingStatus.CONFIRMED],
    [BookingStatus.CONFIRMED]: [BookingStatus.EN_ROUTE],
    [BookingStatus.EN_ROUTE]: [BookingStatus.IN_PROGRESS],
    [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED],
    [BookingStatus.COMPLETED]: [],
    [BookingStatus.CANCELLED_BY_CUSTOMER]: [],
    [BookingStatus.CANCELLED_BY_PROVIDER]: [],
    [BookingStatus.RESCHEDULED]: [],
    [BookingStatus.DISPUTED]: [],
};

const TIMELINE_KEY_FOR_STATUS: Partial<Record<BookingStatus, TimelineKey>> = {
    [BookingStatus.EN_ROUTE]: 'en_route',
    [BookingStatus.IN_PROGRESS]: 'in_progress',
    [BookingStatus.COMPLETED]: 'completed',
};

@Injectable()
export class BookingsService {
    private readonly logger = new Logger(LogModuleTypes.BOOKINGS);

    constructor(
        private readonly repository: BookingsRepository,
        private readonly requestsRepository: RequestsRepository,
        private readonly providersRepository: ProvidersRepository,
        private readonly usersRepository: UsersRepository,
        private readonly bookingAgent: BookingAgentService,
        private readonly orchestrator: AgentOrchestratorService,
    ) {}

    async create(customerId: number, dto: CreateBookingDto): Promise<CreateBookingResponse> {
        const request = await this.requestsRepository.findByUuidForUser(dto.requestId, customerId);
        if (!request) throw notFound(messages.REQUEST.NOT_FOUND);
        if (request.status !== RequestStatus.READY || !request.parsedIntent) {
            throw badRequest(messages.REQUEST.NOT_READY_FOR_BOOKING);
        }
        if (!request.pricingQuote) {
            throw badRequest(messages.REQUEST.NO_PRICING_QUOTE);
        }

        const ranked = request.rankedCandidates ?? [];
        const candidateEntry = ranked.find((c) => c.providerUuid === dto.providerId);
        if (!candidateEntry) {
            throw badRequest(messages.REQUEST.CANDIDATE_NOT_IN_POOL);
        }

        const [provider, customer] = await Promise.all([
            this.providersRepository.findByUuid(dto.providerId),
            this.usersRepository.findById(customerId),
        ]);
        if (!provider) throw notFound(messages.PROVIDER.NOT_FOUND);
        if (!customer) throw notFound(messages.USER.NOT_FOUND);

        const scheduledAt = this.resolveScheduledAt(
            dto.scheduledAt,
            request.parsedIntent.when.start,
        );

        const context = this.orchestrator.createContext(request.uuid);
        const agent = await this.bookingAgent.run(
            {
                customer,
                provider,
                intent: request.parsedIntent,
                pricingQuote: request.pricingQuote,
                scheduledAt,
            },
            context,
        );

        const booking = await this.repository.create({
            bookingCode: agent.draft.bookingCode,
            requestId: request.id,
            customerId,
            providerId: provider.id,
            scheduledAt,
            address: agent.draft.address,
            service: agent.draft.service,
            providerSnapshot: agent.draft.providerSnapshot,
            customerSnapshot: agent.draft.customerSnapshot,
            quotedTotal: agent.draft.quotedTotal,
            pricingQuote: request.pricingQuote,
            paymentMethod: agent.draft.paymentMethod,
            status: BookingStatus.CONFIRMED,
            statusTimeline: agent.draft.statusTimeline,
            traceId: context.traceId,
        });

        return {
            booking: this.toView(booking),
            confirmationMessage: agent.draft.confirmationMessage,
            simulatedWhatsapp: agent.draft.simulatedWhatsapp,
        };
    }

    async getDetailForCustomer(customerId: number, uuid: string): Promise<BookingDetailResponse> {
        const booking = await this.repository.findByUuidForCustomer(uuid, customerId);
        if (!booking) throw notFound(messages.BOOKING.NOT_FOUND);
        return this.toDetail(booking);
    }

    async getDetailForProvider(userId: number, uuid: string): Promise<BookingDetailResponse> {
        const provider = await this.providersRepository.findByUserId(userId);
        if (!provider) throw notFound(messages.PROVIDER.NOT_FOUND);
        const booking = await this.repository.findByUuidForProvider(uuid, provider.id);
        if (!booking) throw notFound(messages.BOOKING.NOT_FOUND);
        return this.toDetail(booking);
    }

    async listForCustomer(customerId: number): Promise<BookingsListResponse> {
        const [bookings, summary] = await Promise.all([
            this.repository.list({ customerId }),
            this.repository.sumQuotedTotalThisYear(customerId),
        ]);
        return {
            bookings: bookings.map((b) => this.toView(b)),
            summary: {
                bookingsThisYear: summary.count,
                totalSpent: summary.total,
                savingsVsMarket: this.estimateSavings(bookings),
            },
        };
    }

    async listForProvider(userId: number): Promise<BookingsListResponse> {
        const provider = await this.providersRepository.findByUserId(userId);
        if (!provider) throw notFound(messages.PROVIDER.NOT_FOUND);
        const bookings = await this.repository.list({ providerId: provider.id });
        return {
            bookings: bookings.map((b) => this.toView(b)),
            summary: { bookingsThisYear: 0, totalSpent: 0, savingsVsMarket: 0 },
        };
    }

    async updateStatus(
        userId: number,
        uuid: string,
        dto: UpdateBookingStatusDto,
    ): Promise<{ booking: BookingView }> {
        const provider = await this.providersRepository.findByUserId(userId);
        if (!provider) throw notFound(messages.PROVIDER.NOT_FOUND);

        const booking = await this.repository.findByUuidForProvider(uuid, provider.id);
        if (!booking) throw notFound(messages.BOOKING.NOT_FOUND);

        this.assertTransition(booking.status, dto.status);

        const timeline = this.appendTimeline(booking.statusTimeline, dto.status, dto.note);
        const updated = await this.repository.update(booking.id, {
            status: dto.status,
            statusTimeline: timeline,
        });
        return { booking: this.toView(updated) };
    }

    async cancel(
        userId: number,
        uuid: string,
        dto: CancelBookingDto,
    ): Promise<CancelBookingResponse> {
        const booking = await this.loadBookingForActor(userId, uuid, dto.cancelledBy);
        if (TERMINAL_BOOKING_STATUSES.includes(booking.status)) {
            throw badRequest(messages.BOOKING.NOT_CANCELLABLE);
        }

        const targetStatus =
            dto.cancelledBy === CancelledBy.CUSTOMER
                ? BookingStatus.CANCELLED_BY_CUSTOMER
                : BookingStatus.CANCELLED_BY_PROVIDER;

        const timeline = this.appendCancelTimeline(booking.statusTimeline, dto);
        const updated = await this.repository.update(booking.id, {
            status: targetStatus,
            cancelledBy: dto.cancelledBy,
            cancelReason: dto.reason,
            cancelNote: dto.note ?? null,
            statusTimeline: timeline,
        });

        this.logger.warn({
            message: `Booking cancelled by ${dto.cancelledBy} — reschedule agent not yet wired`,
            data: { bookingCode: booking.bookingCode, reason: dto.reason },
        });

        return {
            originalBooking: this.toView(updated),
            rescheduleAttempted: false,
        };
    }

    private resolveScheduledAt(override: string | undefined, intentStart: string | null): Date {
        const raw = override ?? intentStart;
        if (!raw) throw badRequest(messages.BOOKING.SCHEDULE_REQUIRED);
        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) {
            throw badRequest(messages.BOOKING.INVALID_SCHEDULE);
        }
        return parsed;
    }

    private async loadBookingForActor(
        userId: number,
        uuid: string,
        actor: CancelledBy,
    ): Promise<Booking> {
        if (actor === CancelledBy.CUSTOMER) {
            const booking = await this.repository.findByUuidForCustomer(uuid, userId);
            if (!booking) throw notFound(messages.BOOKING.NOT_FOUND);
            return booking;
        }
        const provider = await this.providersRepository.findByUserId(userId);
        if (!provider) throw forbidden(messages.AUTH.UNAUTHORIZED);
        const booking = await this.repository.findByUuidForProvider(uuid, provider.id);
        if (!booking) throw notFound(messages.BOOKING.NOT_FOUND);
        return booking;
    }

    private assertTransition(current: BookingStatus, next: BookingStatus): void {
        const allowed = STATUS_TRANSITIONS[current] ?? [];
        if (!allowed.includes(next)) {
            throw badRequest(`Cannot transition from ${current} to ${next}.`);
        }
    }

    private appendTimeline(
        existing: TimelineEntry[],
        nextStatus: BookingStatus,
        note?: string,
    ): TimelineEntry[] {
        const key = TIMELINE_KEY_FOR_STATUS[nextStatus];
        if (!key) return existing;
        const now = new Date().toISOString();
        return existing.map((entry) => {
            if (entry.key === key) {
                return {
                    ...entry,
                    done: true,
                    current: true,
                    timestamp: now,
                    sub: note ?? entry.sub,
                };
            }
            if (entry.current) {
                return { ...entry, current: false };
            }
            return entry;
        });
    }

    private appendCancelTimeline(
        existing: TimelineEntry[],
        dto: CancelBookingDto,
    ): TimelineEntry[] {
        const now = new Date().toISOString();
        const cleared = existing.map((entry) =>
            entry.current ? { ...entry, current: false } : entry,
        );
        cleared.push({
            key: 'cancelled',
            label: `Cancelled by ${dto.cancelledBy}`,
            timestamp: now,
            done: true,
            current: true,
            sub: dto.reason,
        });
        return cleared;
    }

    private toView(booking: Booking): BookingView {
        return {
            id: booking.bookingCode,
            uuid: booking.uuid,
            status: booking.status,
            scheduledAt: booking.scheduledAt.toISOString(),
            address: booking.address,
            service: booking.service,
            provider: booking.providerSnapshot,
            customer: booking.customerSnapshot,
            quotedTotal: booking.quotedTotal,
            finalTotal: booking.finalTotal,
            paymentMethod: booking.paymentMethod,
            cancel:
                booking.cancelledBy && booking.cancelReason
                    ? {
                          by: booking.cancelledBy,
                          reason: booking.cancelReason,
                          note: booking.cancelNote,
                      }
                    : undefined,
            createdAt: booking.createdAt.toISOString(),
        };
    }

    private toDetail(booking: Booking): BookingDetailResponse {
        if (ACTIVE_BOOKING_STATUSES.length === 0) {
            throw internal('Booking status tables empty');
        }
        return {
            booking: this.toView(booking),
            statusTimeline: booking.statusTimeline,
            pricing: booking.pricingQuote,
            mapData: this.buildMapData(booking),
        };
    }

    private buildMapData(booking: Booking): BookingMapData {
        const sd = estimateSectorDistance(
            booking.address.sector,
            booking.providerSnapshot.homeSector,
        );
        return {
            origin: { sector: booking.providerSnapshot.homeSector },
            destination: { sector: booking.address.sector ?? 'unknown' },
            etaMinutes: sd.minutes,
            distanceKm: Number(sd.km.toFixed(1)),
            staticMapUrl: undefined,
        };
    }

    private estimateSavings(bookings: Booking[]): number {
        // Lightweight heuristic until reviews + market comparison data lands.
        return bookings
            .filter((b) => b.status === BookingStatus.COMPLETED)
            .reduce(
                (sum, b) =>
                    sum + Math.round((b.pricingQuote?.fairness.marketHigh ?? 0) - b.quotedTotal),
                0,
            );
    }
}
