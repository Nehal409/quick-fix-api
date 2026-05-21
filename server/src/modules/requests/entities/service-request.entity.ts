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
import { User } from '../../users/entities';
import { ClarificationQuestion, ParsedIntent } from '../../agents/intent/intent-agent.types';
import { PriceQuote } from '../../pricing';
import { RequestStatus } from '../enums';

export interface LocationHint {
    sector?: string;
    city?: string;
}

export interface PersistedRankedCandidate {
    providerId: number;
    providerUuid: string;
    displayName: string;
    matchScore: number;
    isBestMatch: boolean;
    tag: string;
    distanceKm: number;
    etaMinutes: number;
    priceEstimate: number;
}

@Entity('service_requests')
export class ServiceRequest {
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

    @Column({ name: 'raw_input', type: 'text' })
    rawInput: string;

    @Column({ type: 'varchar', length: 16, nullable: true })
    language: string | null;

    @Column({ name: 'location_hint', type: 'jsonb', nullable: true })
    locationHint: LocationHint | null;

    @Column({ name: 'parsed_intent', type: 'jsonb', nullable: true })
    parsedIntent: ParsedIntent | null;

    @Column({ type: 'jsonb', nullable: true })
    clarifications: ClarificationQuestion[] | null;

    @Column({ name: 'clarification_answers', type: 'jsonb', nullable: true })
    clarificationAnswers: Record<string, string> | null;

    @Column({ type: 'real', nullable: true })
    confidence: number | null;

    @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.PENDING })
    status: RequestStatus;

    @Column({ name: 'ranked_candidates', type: 'jsonb', nullable: true })
    rankedCandidates: PersistedRankedCandidate[] | null;

    @Column({ name: 'ranking_summary', type: 'text', nullable: true })
    rankingSummary: string | null;

    @Column({ name: 'pricing_quote', type: 'jsonb', nullable: true })
    pricingQuote: PriceQuote | null;

    @Column({ name: 'trace_id', type: 'varchar', length: 64, nullable: true })
    traceId: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
