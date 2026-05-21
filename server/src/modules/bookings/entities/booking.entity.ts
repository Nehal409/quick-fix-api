import {
    Column,
    CreateDateColumn,
    Entity,
    Generated,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { PriceQuote } from '../../pricing';
import { Provider } from '../../providers/entities';
import { ServiceRequest } from '../../requests/entities';
import { User } from '../../users/entities';
import { BookingStatus, CancelledBy, PaymentMethod } from '../enums';
import {
    BookingAddress,
    BookingCustomerSnapshot,
    BookingProviderSnapshot,
    BookingServiceInfo,
} from '../interfaces/booking-snapshot.interface';
import { TimelineEntry } from '../interfaces/timeline-entry.interface';

@Entity('bookings')
export class Booking {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'uuid', unique: true })
    @Generated('uuid')
    uuid: string;

    @Index()
    @Column({ name: 'booking_code', unique: true, length: 24 })
    bookingCode: string;

    @Index()
    @Column({ name: 'request_id' })
    requestId: number;

    @ManyToOne(() => ServiceRequest, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'request_id' })
    request: ServiceRequest;

    @Index()
    @Column({ name: 'customer_id' })
    customerId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'customer_id' })
    customer: User;

    @Index()
    @Column({ name: 'provider_id' })
    providerId: number;

    @ManyToOne(() => Provider, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'provider_id' })
    provider: Provider;

    @Column({ name: 'scheduled_at', type: 'timestamp' })
    scheduledAt: Date;

    @Column({ type: 'jsonb' })
    address: BookingAddress;

    @Column({ type: 'jsonb' })
    service: BookingServiceInfo;

    @Column({ name: 'provider_snapshot', type: 'jsonb' })
    providerSnapshot: BookingProviderSnapshot;

    @Column({ name: 'customer_snapshot', type: 'jsonb' })
    customerSnapshot: BookingCustomerSnapshot;

    @Column({ name: 'quoted_total', type: 'int' })
    quotedTotal: number;

    @Column({ name: 'final_total', type: 'int', nullable: true })
    finalTotal: number | null;

    @Column({ name: 'pricing_quote', type: 'jsonb' })
    pricingQuote: PriceQuote;

    @Column({
        name: 'payment_method',
        type: 'varchar',
        length: 16,
        default: PaymentMethod.CASH,
    })
    paymentMethod: string;

    @Index()
    @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.CONFIRMED })
    status: BookingStatus;

    @Column({ name: 'status_timeline', type: 'jsonb', default: () => "'[]'" })
    statusTimeline: TimelineEntry[];

    @Column({ name: 'cancel_reason', type: 'varchar', length: 32, nullable: true })
    cancelReason: string | null;

    @Column({ name: 'cancelled_by', type: 'varchar', length: 16, nullable: true })
    cancelledBy: CancelledBy | null;

    @Column({ name: 'cancel_note', type: 'text', nullable: true })
    cancelNote: string | null;

    @Column({ name: 'trace_id', type: 'varchar', length: 64, nullable: true })
    traceId: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
