import { ClarificationQuestion, ParsedIntent } from '../../agents/intent/intent-agent.types';

export type ChatTurn =
    | { order: number; role: 'user'; kind: 'message'; text: string; at: string }
    | {
          order: number;
          role: 'agent';
          kind: 'clarifications';
          questions: ClarificationQuestion[];
          at: string;
      }
    | {
          order: number;
          role: 'user';
          kind: 'answers';
          answers: Record<string, string>;
          at: string;
      }
    | {
          order: number;
          role: 'agent';
          kind: 'intent_ready';
          intent: ParsedIntent;
          at: string;
      };

export interface ChatResponse {
    requestId: string;
    status: 'pending' | 'needs_clarification' | 'ready' | 'failed';
    turns: ChatTurn[];
}
