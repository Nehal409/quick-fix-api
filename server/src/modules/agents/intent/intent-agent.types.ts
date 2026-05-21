export type ServiceCategory = 'ac_repair' | 'ac_service' | 'ac_install' | 'other';
export type Severity = 'low' | 'medium' | 'high';
export type Urgency = 'low' | 'medium' | 'high';
export type Language = 'en' | 'ur' | 'roman_ur' | 'mixed' | 'auto';

export interface Gloss {
    ur: string;
    en: string;
}

export interface ClarificationOption {
    value: string;
    label: string;
    recommended?: boolean;
}

export interface ClarificationQuestion {
    id: string;
    prompt: string;
    fieldTarget: string;
    type: 'choice' | 'text';
    options?: ClarificationOption[] | null;
}

export interface ParsedIntent {
    service: { category: ServiceCategory; label: string; severity: Severity };
    location: { sector: string | null; city: string | null };
    when: { window: string | null; start: string | null; end: string | null };
    budget: { max: number | null; currency: 'PKR' | null; priceSensitive: boolean };
    urgency: Urgency;
    confidence: number;
    languageDetected: Exclude<Language, 'auto'>;
    glosses: Gloss[];
    clarifications: ClarificationQuestion[];
}

export interface ClarificationAnswer {
    question: string;
    answer: string;
}

export interface IntentAgentInput {
    rawInput: string;
    language?: Language;
    location?: { sector?: string; city?: string };
    asOf?: Date;
    clarificationAnswers?: ClarificationAnswer[];
}

export interface ExtractedField {
    key: string;
    label: string;
    value: string;
    icon: string;
    tags?: string[];
    bilingual?: Gloss;
}

export type IntentAgentResult =
    | {
          status: 'ready';
          intent: ParsedIntent;
          extractedFields: ExtractedField[];
      }
    | {
          status: 'needs_clarification';
          partialIntent: ParsedIntent;
          clarifications: ClarificationQuestion[];
      };
