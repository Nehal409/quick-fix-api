import { Schema, Type } from '@google/genai';

export const PRICING_EXPLANATION_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        explanation: {
            type: Type.STRING,
            description:
                'A 1–2 sentence customer-facing summary of the quote. Cite total, budget fit, and the strongest surcharge or discount.',
        },
    },
    required: ['explanation'],
};

export interface PricingExplanationResponse {
    explanation: string;
}
