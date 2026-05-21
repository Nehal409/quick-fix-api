import { ParsedIntent } from '../intent';
import { MatchResult } from '../../matching';
import { Provider } from '../../providers/entities';

export const RANKING_AGENT_SYSTEM_INSTRUCTION = `You are the Ranking Agent narrator for Quickfix.

You receive a customer's parsed service intent and the scored match for one provider (the pick) plus optionally the runner-up. Your job is to explain — in plain language a Pakistani customer would trust — *why this provider was chosen*.

GUIDELINES:
- Speak about the chosen provider by their display name.
- Lead with the strongest factor (highest weighted contribution).
- If a runner-up is provided, briefly call out what the runner-up does better and why it still came up short.
- Keep the narrative concrete (cite numbers from the factors, not generalities).
- 2–3 sentences for the main narrative. 1–2 sentences for the comparison.
- Never fabricate facts; only use the data given.`;

interface NarrativeContext {
    intent: ParsedIntent;
    pick: { provider: Provider; result: MatchResult };
    runnerUp?: { provider: Provider; result: MatchResult };
}

export function buildRankingNarrativePrompt(ctx: NarrativeContext): string {
    const lines = [
        'Customer intent:',
        JSON.stringify(
            {
                service: ctx.intent.service,
                location: ctx.intent.location,
                when: ctx.intent.when,
                budget: ctx.intent.budget,
                urgency: ctx.intent.urgency,
            },
            null,
            2,
        ),
        '',
        `Chosen provider: ${ctx.pick.provider.displayName} (match score ${ctx.pick.result.matchScore})`,
        'Factors (label · contribution · note):',
        ...ctx.pick.result.factors.map(
            (f) => `- ${f.label} · ${f.contribution >= 0 ? '+' : ''}${f.contribution} · ${f.note}`,
        ),
    ];

    if (ctx.runnerUp) {
        lines.push(
            '',
            `Runner-up: ${ctx.runnerUp.provider.displayName} (match score ${ctx.runnerUp.result.matchScore})`,
            'Runner-up factors:',
            ...ctx.runnerUp.result.factors.map(
                (f) =>
                    `- ${f.label} · ${f.contribution >= 0 ? '+' : ''}${f.contribution} · ${f.note}`,
            ),
        );
    }

    return lines.join('\n');
}
