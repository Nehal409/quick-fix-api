import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities';

@Entity('providers')
export class Provider {
    @PrimaryGeneratedColumn()
    id: number;

    // 1-1 relationship with a provider-role user
    @OneToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id' })
    userId: number;

    @Column()
    name: string;

    @Column({ type: 'varchar', nullable: true, default: null })
    phone: string | null;

    @Column({ type: 'varchar', nullable: true, default: null })
    location: string | null;

    // e.g. ['ac_repair', 'ac_installation', 'ac_maintenance']
    @Column({ name: 'service_categories', type: 'simple-array', default: '' })
    serviceCategories: string[];

    // e.g. ['inverter_ac', 'split_ac', 'window_ac']
    @Column({ name: 'specialization_tags', type: 'simple-array', default: '' })
    specializationTags: string[];

    // Rolling average rating (0.0 – 5.0)
    @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
    rating: number;

    // Rolling 30-job on-time percentage (0.0 – 1.0)
    @Column({
        name: 'on_time_percent',
        type: 'decimal',
        precision: 5,
        scale: 4,
        default: 1,
    })
    onTimePercent: number;

    // Penalty-weighted cancellation rate (0.0 – 1.0)
    @Column({
        name: 'cancel_rate',
        type: 'decimal',
        precision: 5,
        scale: 4,
        default: 0,
    })
    cancelRate: number;

    @Column({ name: 'total_jobs', type: 'int', default: 0 })
    totalJobs: number;

    // Service radius in kilometres
    @Column({ name: 'service_area_km', type: 'int', default: 10 })
    serviceAreaKm: number;

    @Column({ name: 'is_available', type: 'boolean', default: true })
    isAvailable: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
