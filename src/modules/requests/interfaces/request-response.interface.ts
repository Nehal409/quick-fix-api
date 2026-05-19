import {
    ClarificationQuestion,
    ExtractedField,
    Gloss,
    ParsedIntent,
} from '../../agents/intent/intent-agent.types';
import { PriceQuote } from '../../pricing';

export interface IntentSummary {
    service: ParsedIntent['service'];
    location: ParsedIntent['location'];
    when: ParsedIntent['when'];
    budget: ParsedIntent['budget'];
    urgency: ParsedIntent['urgency'];
    confidence: number;
    languageDetected: ParsedIntent['languageDetected'];
    extractedFields: ExtractedField[];
    glosses: Gloss[];
}

export interface CandidateResponse {
    providerId: string;
    displayName: string;
    matchScore: number;
    isBestMatch: boolean;
    tag: string;
    distance: string;
    eta: string;
    priceEstimate: string;
}

export interface RankingSummary {
    factorCount: number;
    latencyMs: number;
    summary: string;
}

export interface PricingSummary {
    providerId: string;
    quote: PriceQuote;
    explanation: string;
}

export interface ReadyRequestResponse {
    requestId: string;
    traceId: string;
    status: 'ready';
    intent: IntentSummary;
    candidates: CandidateResponse[];
    ranking: RankingSummary;
    pricing: PricingSummary;
}

export interface NeedsClarificationResponse {
    requestId: string;
    traceId: string;
    status: 'needs_clarification';
    partialIntent: IntentSummary;
    clarifications: ClarificationQuestion[];
}

export type RequestResponse = ReadyRequestResponse | NeedsClarificationResponse;
