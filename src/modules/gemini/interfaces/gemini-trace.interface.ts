export interface GeminiTrace {
    model: string;
    latencyMs: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    attempts: number;
    finishReason?: string;
}
