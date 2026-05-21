export enum BookingStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    EN_ROUTE = 'en_route',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED_BY_CUSTOMER = 'cancelled_by_customer',
    CANCELLED_BY_PROVIDER = 'cancelled_by_provider',
    RESCHEDULED = 'rescheduled',
    DISPUTED = 'disputed',
}

export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
    BookingStatus.PENDING,
    BookingStatus.CONFIRMED,
    BookingStatus.EN_ROUTE,
    BookingStatus.IN_PROGRESS,
];

export const TERMINAL_BOOKING_STATUSES: BookingStatus[] = [
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED_BY_CUSTOMER,
    BookingStatus.CANCELLED_BY_PROVIDER,
    BookingStatus.RESCHEDULED,
];
