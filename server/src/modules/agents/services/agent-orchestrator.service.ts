import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { LogModuleTypes } from 'src/common';
import { AgentRunContext, AgentTraceEntry } from '../interfaces';

@Injectable()
export class AgentOrchestratorService {
    private readonly logger = new Logger(LogModuleTypes.AGENTS);

    createContext(requestId?: string): AgentRunContext {
        return {
            traceId: randomUUID(),
            requestId,
            startedAt: Date.now(),
            traces: [],
        };
    }

    recordTrace(context: AgentRunContext, entry: AgentTraceEntry): void {
        context.traces.push(entry);
        this.logger.log({
            message: `${entry.agent} completed`,
            data: { traceId: context.traceId, ...entry },
        });
    }
}
