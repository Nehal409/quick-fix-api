import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Provider } from './provider.entity';

@Entity('availability')
export class Availability {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Provider, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'provider_id' })
    provider: Provider;

    @Column({ name: 'provider_id' })
    providerId: number;

    /**
     * The calendar date of this slot — stored as 'YYYY-MM-DD' string.
     * Using varchar instead of TypeORM `date` type avoids timezone conversion issues.
     */
    @Column({ type: 'varchar', length: 10 })
    date: string;

    /**
     * Slot start time in 'HH:MM' 24-hour format, e.g. '09:00'.
     */
    @Column({ name: 'start_time', type: 'varchar', length: 5 })
    startTime: string;

    /**
     * Slot end time in 'HH:MM' 24-hour format, e.g. '11:00'.
     */
    @Column({ name: 'end_time', type: 'varchar', length: 5 })
    endTime: string;

    /**
     * True when this slot is reserved by a confirmed booking.
     * Set by BookingAgent on booking confirmation; reset on cancellation.
     */
    @Column({ name: 'is_booked', type: 'boolean', default: false })
    isBooked: boolean;

    /**
     * FK to bookings.id — nullable integer, no FK constraint until BookingsModule
     * creates the bookings table. The constraint will be added in a later migration.
     */
    @Column({ name: 'booking_id', type: 'int', nullable: true, default: null })
    bookingId: number | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
