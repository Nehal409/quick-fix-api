import { GeminiTrace } from './gemini-trace.interface';

export interface GeminiTextResult {
    text: string;
    trace: GeminiTrace;
}

export interface GeminiJsonResult<T> {
    data: T;
    raw: string;
    trace: GeminiTrace;
}
