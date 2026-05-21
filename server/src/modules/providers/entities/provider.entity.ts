import {
    Column,
    CreateDateColumn,
    Entity,
    Generated,
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

    @Column({ type: 'uuid', unique: true })
    @Generated('uuid')
    uuid: string;

    @Column({ name: 'user_id', unique: true })
    userId: number;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'display_name' })
    displayName: string;

    @Column({ name: 'service_categories', type: 'text', array: true })
    serviceCategories: string[];

    @Column({ name: 'specialization_tags', type: 'text', array: true, default: () => "'{}'" })
    specializationTags: string[];

    @Column({ name: 'service_areas', type: 'text', array: true })
    serviceAreas: string[];

    @Column({ name: 'home_sector' })
    homeSector: string;

    @Column({ name: 'home_city' })
    homeCity: string;

    @Column({ name: 'home_lat', type: 'double precision', nullable: true })
    homeLat: number | null;

    @Column({ name: 'home_lng', type: 'double precision', nullable: true })
    homeLng: number | null;

    @Column({ name: 'experience_years', type: 'int' })
    experienceYears: number;

    @Column({ type: 'real', default: 0 })
    rating: number;

    @Column({ name: 'review_count', type: 'int', default: 0 })
    reviewCount: number;

    @Column({ name: 'on_time_percent', type: 'real', default: 0 })
    onTimePercent: number;

    @Column({ name: 'cancel_rate', type: 'real', default: 0 })
    cancelRate: number;

    @Column({ name: 'completed_jobs_30d', type: 'int', default: 0 })
    completedJobs30d: number;

    @Column({ name: 'base_visit_fee', type: 'int' })
    baseVisitFee: number;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
