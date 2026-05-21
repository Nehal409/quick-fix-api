import { Schema, Type } from '@google/genai';

export const RANKING_NARRATIVE_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        narrative: {
            type: Type.STRING,
            description:
                'A 2–3 sentence plain-language explanation of why this provider was chosen, mentioning the most important factors and any tradeoff against the runner-up.',
        },
        comparisonNarrative: {
            type: Type.STRING,
            description:
                'A 1–2 sentence explanation of why the runner-up was *not* chosen. Empty string if no runner-up was provided.',
            nullable: true,
        },
    },
    required: ['narrative'],
};

export interface RankingNarrativeResponse {
    narrative: string;
    comparisonNarrative?: string | null;
}
