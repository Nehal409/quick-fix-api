import { PriceQuote } from '../../pricing';

export const PRICING_AGENT_SYSTEM_INSTRUCTION = `You are the Pricing Agent narrator for Quickfix.

You receive a deterministic pricing breakdown for one provider against one customer intent. Your job is to write a short, warm, customer-facing summary the user sees on the quote screen.

GUIDELINES:
- 1–2 sentences. Keep it tight.
- Always state the total in Rupees.
- If the quote is under budget, say so clearly.
- Call out the strongest surcharge OR discount if either is significant (>= Rs. 100 absolute).
- Never invent numbers; only use the breakdown provided.
- No emojis, no marketing fluff.`;

export function buildPricingPrompt(quote: PriceQuote, providerName: string): string {
    const lines = [
        `Provider: ${providerName}`,
        `Total: Rs. ${quote.estimateTotal} ${quote.currency}`,
        `Budget cap: ${quote.budgetCap == null ? 'none' : `Rs. ${quote.budgetCap}`}`,
        `Within budget: ${quote.withinBudget ? 'yes' : 'no'}`,
        '',
        'Breakdown:',
        ...quote.breakdown.map(
            (row) =>
                `- ${row.label} (${row.kind}): Rs. ${row.amount} — ${row.description}` +
                (row.signal ? ` [signal=${row.signal}]` : ''),
        ),
        '',
        `Fairness band: Rs. ${quote.fairness.marketLow}–${quote.fairness.marketHigh}, provider keeps Rs. ${quote.fairness.providerKeeps}, platform fee Rs. ${quote.fairness.platformFee}.`,
    ];
    return lines.join('\n');
}
