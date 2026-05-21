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
import { Booking } from '../../bookings/entities/booking.entity';
import { ServiceRequest } from '../../requests/entities';
import { User } from '../../users/entities';
import { NotificationTone, NotificationType } from '../enums';

export interface NotificationCta {
    label: string;
    target: string;
}

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'uuid', unique: true })
    @Generated('uuid')
    uuid: string;

    @Index()
    @Column({ name: 'user_id' })
    userId: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'booking_id', nullable: true })
    bookingId: number | null;

    @ManyToOne(() => Booking, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'booking_id' })
    booking: Booking | null;

    @Column({ name: 'request_id', nullable: true })
    requestId: number | null;

    @ManyToOne(() => ServiceRequest, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'request_id' })
    request: ServiceRequest | null;

    @Column({ type: 'varchar', length: 16 })
    type: NotificationType;

    @Column({ type: 'varchar', length: 16 })
    tone: NotificationTone;

    @Column({ type: 'varchar', length: 32 })
    icon: string;

    @Column({ type: 'varchar', length: 160 })
    title: string;

    @Column({ type: 'text' })
    body: string;

    @Column({ type: 'jsonb', nullable: true })
    cta: NotificationCta | null;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, unknown> | null;

    @Index()
    @Column({ name: 'read_at', type: 'timestamp', nullable: true })
    readAt: Date | null;

    @Index()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
