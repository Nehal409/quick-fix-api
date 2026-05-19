import { AgentRunContext } from './agent-context.interface';

export interface Agent<TInput, TOutput> {
    readonly name: string;
    run(input: TInput, context: AgentRunContext): Promise<TOutput>;
}
