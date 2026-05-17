# Agent Pipeline — QuickFix

All agents live in `AgentsModule` as `@Injectable()` services, coordinated by the Orchestrator.
The Orchestrator owns the trace context and runs agents in sequence.

---

## Pipeline Flow

```
User Input (natural language / Roman Urdu / Urdu)
  ↓
POST /api/v1/requests
  ↓
Orchestrator
  ↓
1. Intent Agent        → structured request + confidence score
  ↓ if confidence < 0.7: return status: 'needs_clarification'
  ↓ user answers → POST /requests/:id/clarify → resume here
2. Discovery Agent     → candidate providers from DB (by category + location)
  ↓
3. Ranking Agent       → top 3 with 8-factor scores + reasoning narrative
  ↓
4. Pricing Agent       → quote with cost breakdown + fairness band
  ↓
Return status: 'ready' with intent + candidates + pricing + ranking summary

  ↓ (user confirms booking)
5. Booking Agent       → slot reservation, conflict detection, QF-####-XXX ID
  ↓ (background cron)
6. Follow-up Agent     → reminder notifications + ETA recalculation
  ↓ (on provider cancellation)
7. Reschedule Agent    → re-run ranking, exclude cancelled, auto-book next-best, 5-step trace
  ↓ (after completion)
8. Feedback Agent      → rating ingestion, reputation update, trending theme insight
  ↓ (if dispute filed)
9. Dispute Agent       → resolution recommendation with confidence (uses Gemini Pro)
```

---

## Agent Reference Table

| # | Agent | Model | Trigger | Owner |
|---|-------|-------|---------|-------|
| 1 | Intent Agent | Gemini Flash | Every request | BE-1 |
| 2 | Discovery Agent | Gemini Flash | After intent | BE-1 |
| 3 | Ranking Agent | Gemini Flash | After discovery | BE-1 |
| 4 | Pricing Agent | Gemini Flash | After ranking | BE-1 |
| 5 | Booking Agent | Deterministic | User confirms | BE-1 |
| 6 | Follow-up Agent | Gemini Flash | Post-booking cron | BE-1 |
| 7 | Reschedule Agent | Gemini Flash | On cancellation | BE-1 |
| 8 | Feedback Agent | Logic + Flash | After completion | BE-1 |
| 9 | Dispute Agent | **Gemini Pro** | Dispute filed | BE-1 |

> **Hot path** (Intent → Discovery → Ranking → Pricing): must use Gemini Flash — these run inside the synchronous `POST /requests`. Pro would make 8s become 20s.

---

## Agent 1: Intent Agent

**Responsibility:** Parse natural language (English / Urdu / Roman Urdu / auto-detect) into a structured `intent` object. Assign `confidence` score (0.0–1.0). If confidence < 0.70 → generate clarification questions.

**Output:**
```typescript
{
  service: { category: string, label: string, severity: 'low'|'medium'|'high' },
  location: { sector: string, city: string, lat?: number, lng?: number },
  when: { window: string, start: ISO, end: ISO },
  budget: { max: number, currency: 'PKR', priceSensitive: boolean },
  urgency: 'low'|'medium'|'high',
  confidence: number,   // 0.0 – 1.0
  extractedFields: ExtractedField[],
  glosses: { ur: string, en: string }[]  // e.g. { ur: 'kal', en: 'tomorrow' }
}
```

**Roman Urdu support:** Prompt is engineered to handle mixed-language input natively. Glosses are inline annotations the UI displays.

---

## Agent 2: Discovery Agent

**Responsibility:** Query the `providers` table filtered by:
- Service category matching `intent.service.category`
- Location within `intent.location` radius
- `isAvailable = true`
- Has slots in the requested time window (`availability` table)

Returns a list of raw candidate providers for the Ranking Agent.

---

## Agent 3: Ranking Agent

**Responsibility:** Wrap `MatchingModule.score()` to compute 8-factor scores for each candidate, then call Gemini Flash to generate:
- A `narrative` ("Ali is not the closest — I picked him because...")
- A `comparisonAgainst` ("Bilal is closer but lower on-time...")
- Per-factor `contribution` strings (`'+18'`, `'-2'`) with `weight` and `note`

**Must return for each factor:**
```typescript
{ label: string, weight: number, contribution: string, note: string }
```

---

## The 8 Matching Factors — `MatchingModule`

**This is 25% of the hackathon grade.** Implement in `MatchingModule` as a deterministic scoring function. The Ranking Agent narrates it; `MatchingModule` computes it.

| # | Factor | Default Weight | Signal |
|---|--------|----------------|--------|
| 1 | Specialization match | **0.22** | Tags + last-30-jobs category histogram |
| 2 | On-time score | **0.18** | `provider.onTimePercent` (rolling 30 jobs) |
| 3 | Distance / travel time | **0.16** | `MapsModule` Distance Matrix |
| 4 | Cancellation rate | **0.12** | `provider.cancelRate` (penalty-weighted) |
| 5 | Review recency (last 14 days) | **0.10** | Count + avg of recent reviews |
| 6 | Capacity in requested window | **0.10** | `availability` table free slots |
| 7 | Budget fit | **0.07** | Quote ≤ customer budget cap |
| 8 | Price per visit | **0.05** | Negative weight if above peer median |

**Weights are tunable** — expose as a single config object in `MatchingModule`.

**Scoring pattern:**
```typescript
interface MatchScore {
  total: number;  // 0-100
  factors: FactorScore[];
}

interface FactorScore {
  label: string;
  weight: number;
  raw: number;        // 0-1 normalized raw value
  contribution: number; // weight × raw × 100
  note: string;
}
```

---

## Agent 4: Pricing Agent — `PricingModule`

**Responsibility:** Wrap `PricingModule.computeQuote()` and call Gemini Flash for the human-readable `explanation`.

### Pricing Formula (Deterministic)

| Key | Formula |
|-----|---------|
| `visit_fee` | Flat per service category (AC repair: Rs. 1,500) |
| `travel` | `distanceKm × Rs. 50/km` |
| `complexity` | Service sub-type lookup table (inverter intermediate: Rs. 1,200) |
| `urgency` | `base × multiplier` (next-morning ×1.10, same-day ×1.25) |
| `loyalty_discount` | −2% after 3 bookings; −5% after 10 |
| `demand_surge` | `base × surgeMultiplier` from `marketContext.signal` (e.g. `heatwave`) |

**Fairness band:** `providerKeeps = total × 0.80`, `platformFee = total × 0.20`. `marketLow/marketHigh` from peer-provider averages for same category + city.

---

## Agent 5: Booking Agent

**Responsibility:** Pure deterministic logic.
- Check slot still available (conflict detection)
- Generate booking ID: `QF-####-XXX` (unique, idempotent)
- Create `bookings` row, mark `availability` slot as booked
- Return `booking` shape + `confirmationMessage` + `simulatedWhatsapp`

---

## Agent 6: Follow-up Agent

**Responsibility:** Generate reminder notifications + WhatsApp messages in 3 languages. Recalculate ETA based on traffic (via `MapsModule`). Fires via `SchedulingModule` cron.

---

## Agent 7: Reschedule Agent — Hero Demo

**Responsibility:** Triggered when a provider cancels. Must:
1. Observe the cancellation
2. Exclude the cancelled provider from the pool
3. Re-run ranking (via `MatchingModule`) on remaining providers
4. Check availability of the next-best provider
5. Auto-book and notify the customer

**Returns the 5-step trace** (UI renders as green-checkmark list on screen 10):
```typescript
{ ok: boolean, label: string }[]
// + aggregate: { elapsedMs, toolCalls, llmCalls, model }
```

---

## Agent 8: Feedback Agent

**Responsibility:**
- Ingest `rating` (1-5) and `tags[]`
- Recalculate `provider.rating` (rolling average)
- Recalculate `provider.onTimePercent` and `provider.cancelRate`
- Generate "trending theme" insight for provider screen 22 (e.g. "Customers mention 'explained_well' 7× in last 14 days")

---

## Agent 9: Dispute Agent (Gemini Pro)

**Responsibility:** Reason about dispute claim, return ranked resolution recommendations with `confidence` score.

**Response:**
```typescript
{
  confidence: 0.84,
  primary: { action: 'free_rework', label: 'Free rework visit by you', tone: 'success' },
  alternatives: [
    { action: 'partial_refund', label: 'Partial refund · Rs. 500', tone: 'neutral' },
    { action: 'reassign',       label: 'Reassign to another tech',  tone: 'neutral' }
  ],
  rationale: "Looks like a warranty rework...",
  trace: ['dispute_agent → similar_cases(rework_within_24h, n=14)', 'policy: workmanship_window=7d']
}
```

---

## Trace System

Every agent step is persisted to the `agent_traces` table.
- `GET /trace/:id` — single request trace
- `GET /trace/export` — all traces as JSON (hackathon submission deliverable)

The trace is surfaced in the UI on screens 06, 10, 23.
