import { Schema, Type } from '@google/genai';

export const INTENT_RESPONSE_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        service: {
            type: Type.OBJECT,
            properties: {
                category: {
                    type: Type.STRING,
                    enum: ['ac_repair', 'ac_service', 'ac_install', 'other'],
                },
                label: { type: Type.STRING },
                severity: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
            },
            required: ['category', 'label', 'severity'],
        },
        location: {
            type: Type.OBJECT,
            properties: {
                sector: { type: Type.STRING, nullable: true },
                city: { type: Type.STRING, nullable: true },
            },
        },
        when: {
            type: Type.OBJECT,
            properties: {
                window: {
                    type: Type.STRING,
                    description:
                        'Human-readable window such as tomorrow_morning, today_afternoon, this_week',
                    nullable: true,
                },
                start: {
                    type: Type.STRING,
                    description: 'ISO 8601 timestamp for window start',
                    nullable: true,
                },
                end: {
                    type: Type.STRING,
                    description: 'ISO 8601 timestamp for window end',
                    nullable: true,
                },
            },
        },
        budget: {
            type: Type.OBJECT,
            properties: {
                max: { type: Type.NUMBER, nullable: true },
                currency: { type: Type.STRING, enum: ['PKR'], nullable: true },
                priceSensitive: { type: Type.BOOLEAN },
            },
            required: ['priceSensitive'],
        },
        urgency: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
        confidence: {
            type: Type.NUMBER,
            description: 'Overall confidence in the extraction, between 0 and 1',
        },
        languageDetected: {
            type: Type.STRING,
            enum: ['en', 'ur', 'roman_ur', 'mixed'],
        },
        glosses: {
            type: Type.ARRAY,
            description:
                'Roman Urdu or Urdu words from the input paired with their English meaning',
            items: {
                type: Type.OBJECT,
                properties: {
                    ur: { type: Type.STRING },
                    en: { type: Type.STRING },
                },
                required: ['ur', 'en'],
            },
        },
        clarifications: {
            type: Type.ARRAY,
            description:
                'Questions to ask the user when a field is ambiguous. Empty when confidence is high.',
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    prompt: { type: Type.STRING },
                    fieldTarget: {
                        type: Type.STRING,
                        description: 'Dotted path of the field this question resolves',
                    },
                    type: { type: Type.STRING, enum: ['choice', 'text'] },
                    options: {
                        type: Type.ARRAY,
                        nullable: true,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                value: { type: Type.STRING },
                                label: { type: Type.STRING },
                                recommended: { type: Type.BOOLEAN, nullable: true },
                            },
                            required: ['value', 'label'],
                        },
                    },
                },
                required: ['id', 'prompt', 'fieldTarget', 'type'],
            },
        },
    },
    required: [
        'service',
        'location',
        'when',
        'budget',
        'urgency',
        'confidence',
        'languageDetected',
        'glosses',
        'clarifications',
    ],
};
