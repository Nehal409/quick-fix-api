import { GeminiTrace } from '../../gemini';

export interface AgentRunContext {
    traceId: string;
    requestId?: string;
    startedAt: number;
    traces: AgentTraceEntry[];
}

export interface AgentTraceEntry {
    agent: string;
    gemini?: GeminiTrace;
    tookMs: number;
    note?: string;
}
