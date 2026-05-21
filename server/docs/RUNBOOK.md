# QuickFix Backend — Runbook

A practical walkthrough of what's built, how the pieces fit together, and how to drive the full agent pipeline from a terminal without the mobile UI.

This document only covers what is **actually implemented** today. Anything listed under [§9 What's Not Built Yet](#9-whats-not-built-yet) is referenced elsewhere but does not exist in the code.

---

## 1. Overview

QuickFix turns a free-form service request — typically a customer typing in Roman Urdu — into a confirmed booking with a ranked-and-priced technician. The flow is a synchronous pipeline of small "agents" coordinated by an orchestrator service.

Today's hot path is:

```
POST /api/v1/requests
   │
   ▼
Intent Agent  ── needs_clarification? ──► returns clarification questions
   │ ready
   ▼
Discovery Agent  ── filters providers by category + sector
   │
   ▼
Ranking Agent    ── deterministic 8-factor scoring, top-5
   │
   ▼
Pricing Agent    ── 6-component math + Gemini explanation (best match only)
   │
   ▼
returns { intent, candidates[], ranking, pricing }
```

Once the response is back, the customer picks a candidate and calls:

```
POST /api/v1/bookings   →   Booking Agent (deterministic ID + snapshot + WhatsApp draft)
```

Tap "How I decided" on any candidate? That's a separate lazy endpoint:

```
GET /api/v1/requests/:uuid/candidates/:providerUuid/reasoning
   │
   ▼
Ranking Agent.explainOne()   ── Gemini narrative + runner-up comparison
```

---

## 2. Module Map

Every module lives under `src/modules/<name>/` with the same shape (`controller`, `service`, `module`, `entities/`, `dto/`, `interfaces/`, `repositories/`, all barreled with `index.ts`).

| Module | Has Controller? | Role |
|---|---|---|
| `authentication` | ✅ | Register / login / JWT issuance |
| `users` | ✅ | Profile CRUD |
| `providers` | ❌ | Provider entity, 30-row seeder, auto-create-on-register |
| `requests` | ✅ | `service_requests` row + the agent pipeline entry points |
| `bookings` | ✅ | Booking lifecycle + status transitions |
| `gemini` | ❌ | Shared SDK wrapper (used by all LLM-touching agents) |
| `matching` | ❌ | Deterministic 8-factor scoring engine |
| `pricing` | ❌ | Deterministic 6-component pricing engine |
| `agents` | ❌ | Houses all 5 agents + the orchestrator |

The dependency graph is one-way: `requests` → `agents` → `providers` / `matching` / `pricing` / `gemini`. `bookings` sits next to `requests` and also pulls from `agents`. No cycles.

---

## 3. The Agents

There are 5 agents shipping today. Each one implements the same `Agent<TInput, TOutput>` contract from `src/modules/agents/interfaces/agent.interface.ts` and reports its trace via the `AgentOrchestratorService`.

### 3.1 Intent Agent — `src/modules/agents/intent/`

- **What it does:** parses raw natural-language input (English / Urdu / Roman Urdu) into a structured intent: service category, location, timing, budget, urgency, plus a confidence score and inline glosses (e.g. `kal → tomorrow`).
- **Gemini call:** **yes** — Gemini Flash, with a `responseSchema` so the model returns typed JSON. Temperature `0.2`.
- **Output:** discriminated union — either `{ status: 'ready', intent, extractedFields }` or `{ status: 'needs_clarification', partialIntent, clarifications[] }`.
- **Threshold:** `confidence < 0.7` OR any clarifications → returns `needs_clarification`. The threshold is decided in code, not by the model.

### 3.2 Discovery Agent — `src/modules/agents/discovery/`

- **What it does:** queries `providers` table for everyone serving the intent's category in or near the intent's sector. Limits to 10 candidates.
- **Gemini call:** **no** — pure DB query with sector-proximity preference + initial heuristic ordering (rating, on-time, low cancel rate).
- **Output:** display-safe `DiscoveredProvider[]` for UI + raw `Provider[]` entities for the next stage.

### 3.3 Ranking Agent — `src/modules/agents/ranking/`

Two entry points on the same service:

- **`run(...)`** — runs on the hot path. Calls `MatchingService.scoreAll()`, sorts by composite score, marks `isBestMatch`, returns top-5. **No Gemini call** — fast, deterministic.
- **`explainOne(...)`** — called only by the "How I decided" reasoning endpoint. Sends the chosen + runner-up factor tables to Gemini Flash for a 2-3 sentence narrative + a "why not X" comparison.

The composite score is built from **8 weighted factors** computed in `src/modules/matching/factors/index.ts`:

| # | Factor | Weight | Notes |
|---|---|---|---|
| 1 | Specialization match | 0.22 | overlap of intent-inferred tags with provider tags |
| 2 | On-time score | 0.18 | `provider.onTimePercent` |
| 3 | Distance / travel time | 0.16 | sector-proximity heuristic (placeholder until MapsModule) |
| 4 | Cancellation rate | 0.12 | inverted, capped |
| 5 | Review recency | 0.10 | proxied by `rating × log(reviewCount)` for now |
| 6 | Capacity in window | 0.10 | proxied by `1 − cancelRate` for now |
| 7 | Budget fit | 0.07 | binary: `baseVisitFee ≤ intent.budget.max` |
| 8 | Price per visit | 0.05 | **can go negative** if above peer median |

The 3 proxied factors say so honestly in their `note` field. They will be replaced when the reviews / availability / Maps integrations land.

### 3.4 Pricing Agent — `src/modules/agents/pricing/`

- **What it does:** computes a 6-row breakdown for the **best-match** provider only, plus a fairness band and a 1-2 sentence customer-facing explanation.
- **Gemini call:** **yes, with graceful fallback** — Gemini Flash for the explanation. If Gemini fails (timeout, upstream error), the agent catches and emits a deterministic explanation from the breakdown. The math is the critical path; the narrative is best-effort.
- **6 components:** `visit_fee`, `travel`, `complexity`, `urgency` (surcharge), `loyalty_discount` (negative), `demand_surge` (currently hardcoded to `heatwave` for the demo).
- **Fairness band:** ±15% around the peer median; 20% platform fee, provider keeps 80%.

### 3.5 Booking Agent — `src/modules/agents/booking/`

- **What it does:** generates the `QF-####-XXX` booking code, builds the provider + customer snapshots, the initial 5-entry status timeline, and the simulated WhatsApp confirmation payload.
- **Gemini call:** **no** — pure logic.
- **ID format:** `QF-` + random 4-digit + `-` + 3 uppercase-alphanumeric chars (alphabet skips `O/0/I/1` to avoid ambiguity).

### 3.6 Agent Orchestrator — `src/modules/agents/services/agent-orchestrator.service.ts`

A thin coordinator. Two responsibilities:
- `createContext()` → mints a `traceId` (UUID) that ties every agent run together across the pipeline.
- `recordTrace(context, entry)` → appends a typed trace entry (model, latency, tokens, note). Will feed the eventual `agent_traces` table.

---

## 4. The Shared Infrastructure

### 4.1 `GeminiService` — `src/modules/gemini/gemini.service.ts`

Every LLM-touching agent calls one of two methods:

- `generateText(prompt, options)` → `{ text, trace }`
- `generateJson<T>(prompt, { responseSchema, validate? })` → `{ data, raw, trace }`

Production-ish wrapper:
- **Tier selection:** `GeminiModelTier.FLASH` (default) vs `PRO`, resolved to model names from config.
- **Timeout:** per-attempt `AbortSignal` — cancels the network request, not just abandons the promise.
- **Retry:** exponential backoff with jitter on `408/429/5xx` and `ECONNRESET/ETIMEDOUT/EAI_AGAIN/ENOTFOUND`.
- **Error mapping:** `gatewayTimeout` (504) on timeout, `serverUnavailable` (503) on upstream after retries, `badImplementation` (500) on malformed JSON.
- **Trace metadata:** `{ model, latencyMs, promptTokens, completionTokens, totalTokens, attempts, finishReason }` — maps 1:1 to the future `agent_traces` row.

### 4.2 `MatchingService` — `src/modules/matching/matching.service.ts`

Pure scoring engine — no DI on entities, just functions over data:
- `scoreAll(intent, providers)` → `MatchResult[]`
- Each `MatchResult` has `{ providerId, matchScore (0–100), factors[] }`
- `factors[]` is the per-factor breakdown the reasoning panel renders.

### 4.3 `PricingService` — `src/modules/pricing/pricing.service.ts`

Pure pricing engine:
- `computeQuote(input)` → `PriceQuote { estimateTotal, currency, budgetCap, withinBudget, breakdown[], fairness }`
- Each `breakdown[]` row has `{ key, label, description, amount, kind }` where `kind` is `'base' | 'surcharge' | 'discount'`.

---

## 5. Data Model

5 tables exist today. Migrations are in `database/migrations/`.

| Table | Owner | Created in |
|---|---|---|
| `users` | UsersModule | `1778941723557-CreateUsersTable` |
| `service_requests` | RequestsModule | `1779100000000-CreateServiceRequestsTable` |
| `providers` | ProvidersModule | `1779100100000-CreateProvidersTable` |
| `service_requests` (cols added) | RequestsModule | `1779100200000-AddRankingColumnsToServiceRequests` |
| `service_requests` (cols added) | RequestsModule | `1779100300000-AddPricingQuoteToServiceRequests` |
| `bookings` | BookingsModule | `1779100400000-CreateBookingsTable` |

### Key columns

- **`service_requests`** stores the full pipeline output: `parsedIntent` (jsonb), `clarifications` (jsonb), `ranked_candidates` (jsonb), `ranking_summary` (text), `pricing_quote` (jsonb), `trace_id`.
- **`providers`** uses `text[]` arrays for `service_categories`, `specialization_tags`, `service_areas` — with GIN indexes on the first two for fast `ANY()` containment.
- **`bookings`** carries `providerSnapshot` and `customerSnapshot` (jsonb) so the booking row is stable even if the underlying records change later.

---

## 6. API Reference

All endpoints are namespaced under `/api/v1` and (except for auth) require a JWT in the `Authorization: Bearer <token>` header.

Swagger UI is available at `http://localhost:3000/api/v1/docs` when `NODE_ENV !== 'production'`.

### Auth (`/auth`)

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/auth/register` | `{ email, password, name, role }` | `{ token }` |
| POST | `/auth/login` | `{ email, password }` | `{ token }` |
| GET | `/auth/me` | — | `{ user }` |

`role` is `'customer'` or `'provider'`. Registering with `'provider'` auto-creates an empty provider profile shell.

### Users (`/users`)

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/users/me` | — | `{ user }` |
| PATCH | `/users/me` | `{ name? }` | `{ ok }` |

### Requests (`/requests`) — customer-only

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/requests` | `{ rawInput, language?, location? }` | `ready` or `needs_clarification` response |
| POST | `/requests/:uuid/clarify` | `{ answers: Record<string,string> }` | same shape as above |
| GET | `/requests/:uuid/candidates/:providerUuid/reasoning` | — | per-factor breakdown + narrative + runner-up comparison |

**Ready response shape:**
```json
{
  "requestId": "<uuid>",
  "traceId": "<uuid>",
  "status": "ready",
  "intent": { "service", "location", "when", "budget", "urgency", "confidence", "extractedFields[]", "glosses[]" },
  "candidates": [
    { "providerId", "displayName", "matchScore", "isBestMatch", "tag",
      "distance", "eta", "priceEstimate" }
  ],
  "ranking": { "factorCount", "latencyMs", "summary" },
  "pricing": {
    "providerId",
    "quote": { "estimateTotal", "currency", "budgetCap", "withinBudget", "breakdown[]", "fairness" },
    "explanation"
  }
}
```

**Needs-clarification response shape:**
```json
{
  "requestId": "<uuid>",
  "traceId": "<uuid>",
  "status": "needs_clarification",
  "partialIntent": { ... },
  "clarifications": [
    { "id", "prompt", "fieldTarget", "type": "choice"|"text", "options?": [...] }
  ]
}
```

### Bookings (`/bookings`)

| Method | Path | Role | Body | Returns |
|---|---|---|---|---|
| POST | `/bookings` | customer | `{ requestId, providerId, scheduledAt? }` | `{ booking, confirmationMessage, simulatedWhatsapp }` |
| GET | `/bookings` | both | — | `{ bookings[], summary }` (role-aware) |
| GET | `/bookings/:uuid` | both | — | `{ booking, statusTimeline, pricing, mapData }` |
| PATCH | `/bookings/:uuid/status` | provider | `{ status, note? }` | `{ booking }` |
| POST | `/bookings/:uuid/cancel` | both | `{ reason, cancelledBy, note? }` | `{ originalBooking, rescheduleAttempted: false }` |

State machine: `CONFIRMED → EN_ROUTE → IN_PROGRESS → COMPLETED`. Any non-terminal state can be cancelled.

---

## 7. Running Locally

### Prerequisites

- **Node 22+** — the repo's `nest build` and `tsc` use modern JS syntax that fails on Node 12. If your default `node` is older, switch via `nvm use 22` (or use `~/.nvm/versions/node/v22.X/bin/node` directly).
- **Postgres 14+** running locally (Docker is fine; the repo includes a `docker-compose.yml` if you want it).
- A **Gemini API key** — without it the pipeline will fail on the first Intent Agent call.

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.sample .env

# 3. Edit .env — fill in at minimum:
#    PG_HOST, PG_PORT, PG_USER, PG_PASSWORD, PG_DATABASE
#    JWT_SECRET=<any random string>
#    GEMINI_API_KEY=<your key from aistudio.google.com>

# 4. Run migrations (5 of them, in order)
PG_HOST=localhost npm run migrate:run

# 5. Seed the 30 demo providers
npm run seed
```

All 30 seeded providers share the password `provider123`. Their emails follow the pattern `<first.last>@quickfix.demo` (e.g. `ali.khan@quickfix.demo`).

### Start the server

```bash
npm run start:dev   # watch mode
# or
npm run start       # one-shot
```

The API is live at `http://localhost:3000/api/v1`. Swagger is at `http://localhost:3000/api/v1/docs`.

---

## 8. Testing the Pipeline End-to-End

Below is a copy-pasteable terminal session that drives the full happy path: register → request → reasoning → booking → status update → cancel.

```bash
BASE=http://localhost:3000/api/v1
```

### 8.1 Register a customer

```bash
curl -s -X POST $BASE/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "hassan@example.com",
    "password": "test1234",
    "name": "Hassan Iqbal",
    "role": "customer"
  }' | tee /tmp/auth.json

TOKEN=$(jq -r '.data.token' /tmp/auth.json)
echo "Token: $TOKEN"
```

### 8.2 Submit a Roman Urdu request

Mimics screen 02. The Intent Agent should auto-detect the language, gloss `kal subah`, and (with this fully-specified message) come back `ready` rather than `needs_clarification`.

```bash
curl -s -X POST $BASE/requests \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "rawInput": "AC bilkul kaam nahi kar raha, kal subah G-13 mein technician chahiye, budget zyada nahi hai.",
    "language": "auto",
    "location": { "sector": "G-13", "city": "Islamabad" }
  }' | tee /tmp/req.json | jq '.data | {status, requestId, candidates: [.candidates[] | {displayName, matchScore, isBestMatch}], pricing: .pricing.quote.estimateTotal}'

REQUEST_ID=$(jq -r '.data.requestId' /tmp/req.json)
BEST_PROVIDER=$(jq -r '.data.candidates[] | select(.isBestMatch) | .providerId' /tmp/req.json)
echo "Request: $REQUEST_ID"
echo "Best provider: $BEST_PROVIDER"
```

If you get `status: "needs_clarification"` instead, the response will include `clarifications[]`. To answer them:

```bash
curl -s -X POST $BASE/requests/$REQUEST_ID/clarify \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "answers": { "when-ambiguous": "tomorrow" } }' | jq '.data.status'
```

### 8.3 Look up "How I decided" for the best match

Mimics screen 06. This is the **only** call on the request path that uses Gemini for narrative.

```bash
curl -s $BASE/requests/$REQUEST_ID/candidates/$BEST_PROVIDER/reasoning \
  -H "Authorization: Bearer $TOKEN" | jq '.data | {matchScore, narrative, comparisonAgainst, factors: [.factors[] | {label, contribution, note}]}'
```

### 8.4 Confirm the booking

Mimics screen 08. Returns the human-readable `QF-####-XXX` code and the simulated WhatsApp payload.

```bash
curl -s -X POST $BASE/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{ \"requestId\": \"$REQUEST_ID\", \"providerId\": \"$BEST_PROVIDER\" }" | tee /tmp/booking.json | jq '.data | {bookingCode: .booking.id, scheduledAt: .booking.scheduledAt, confirmationMessage, whatsapp: .simulatedWhatsapp.body}'

BOOKING_UUID=$(jq -r '.data.booking.uuid' /tmp/booking.json)
echo "Booking uuid: $BOOKING_UUID"
```

### 8.5 Fetch the booking detail

Mimics screen 09 (en-route view) — comes with the status timeline, the persisted pricing quote, and the synthesized map data.

```bash
curl -s $BASE/bookings/$BOOKING_UUID \
  -H "Authorization: Bearer $TOKEN" | jq '.data | {status: .booking.status, scheduledAt: .booking.scheduledAt, timeline: [.statusTimeline[] | {key, done, current}], eta: .mapData.etaMinutes, distance: .mapData.distanceKm}'
```

### 8.6 Provider transitions the booking through to completion

Log in as the seeded provider (the best match from §8.2 — find their email by looking at the response or by guessing from the seed data).

```bash
PROVIDER_TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H 'Content-Type: application/json' \
  -d '{ "email": "ali.khan@quickfix.demo", "password": "provider123" }' | jq -r '.data.token')

# Provider says "I'm en route"
curl -s -X PATCH $BASE/bookings/$BOOKING_UUID/status \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "status": "en_route" }' | jq '.data.booking.status'

# Provider starts work
curl -s -X PATCH $BASE/bookings/$BOOKING_UUID/status \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "status": "in_progress" }' | jq '.data.booking.status'

# Provider marks complete
curl -s -X PATCH $BASE/bookings/$BOOKING_UUID/status \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "status": "completed" }' | jq '.data.booking.status'
```

The booking is now `COMPLETED` and shows up in the customer's `/bookings` summary.

### 8.7 Cancel a booking (alternate branch from §8.5)

If you want to exercise the cancel path instead of completion:

```bash
curl -s -X POST $BASE/bookings/$BOOKING_UUID/cancel \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ "cancelledBy": "customer", "reason": "changed_mind", "note": "Found a relative who can do it." }' | jq '.data | {status: .originalBooking.status, rescheduleAttempted}'
```

`rescheduleAttempted` will be `false` until the Reschedule Agent lands — see [§9](#9-whats-not-built-yet).

---

## 9. What's Not Built Yet

The build plan calls for 9 agents and a wider API surface; here is everything **referenced in docs but not yet in the code**, so nobody is surprised:

**Agents not yet built**
- **Reschedule Agent** — the hero. Hook on `POST /bookings/:uuid/cancel` exists; response carries `rescheduleAttempted: false` as a placeholder.
- **Feedback Agent**
- **Dispute Agent**
- **Follow-up Agent** — message generation in 3 languages, reminder ETA recalculation.

**Modules / endpoints not yet built**
- `MapsModule` — distance is approximated from sector adjacency.
- `SchedulingModule` — no real slot/availability table; reminders cron not wired.
- `NotificationsModule` — no inbox endpoint, simulated WhatsApp is returned inline only.
- `TraceModule` — `/trace/:id` and `/trace/export` not implemented; traces live only in logs and on the `service_requests.trace_id` column.
- `/demo/fast-forward` and `/demo/reset`.
- Provider workspace endpoints — inbox, schedule, insights, reviews.
- `/bookings/:uuid/accept` / `/decline` / `/complete` (with evidence upload).
- `/bookings/:uuid/feedback` and `/bookings/:uuid/dispute`.

**Stubs / placeholders to know about**
- 3 of the 8 matching factors (review recency, capacity, distance) are honest proxies — they each say so in their `note` field.
- The Pricing Agent hardcodes `MarketSignal.HEATWAVE` to drive the surge line for the demo.
- `customerCompletedBookings` is hardcoded to `0` in pricing (loyalty discount never triggers) — will read from `bookings` once a customer has completed history.
- Booking conflict detection is not enforced; the same provider could be double-booked.

---

## 10. Common Tasks

```bash
# Build (verify TS compiles)
npm run build

# Run a fresh migration after editing an entity
PG_HOST=localhost npm run migrate:generate -- database/migrations/<MigrationName>
PG_HOST=localhost npm run migrate:run

# Revert the most recent migration
PG_HOST=localhost npm run migrate:revert

# Re-seed (no-op if providers already exist)
npm run seed

# Drop the whole schema (destructive)
PG_HOST=localhost npm run schema:drop
```

---

## 11. Quick Reference — Module File Layout

If you only remember one thing about where code lives:

```
src/modules/
├── agents/
│   ├── interfaces/        ← Agent<I,O> contract + AgentRunContext
│   ├── services/          ← AgentOrchestratorService
│   ├── intent/            ← IntentAgentService + prompt + schema + types
│   ├── discovery/         ← DiscoveryAgentService (no Gemini)
│   ├── ranking/           ← RankingAgentService (rankAll + explainOne)
│   ├── pricing/           ← PricingAgentService (Gemini + fallback)
│   └── booking/           ← BookingAgentService (pure logic, ID gen)
├── authentication/
├── bookings/
├── gemini/                ← shared SDK wrapper
├── matching/              ← deterministic 8-factor scoring engine
│   └── factors/           ← 8 pure factor functions + weight table + sector-distance heuristic
├── pricing/               ← deterministic 6-component pricing engine
├── providers/
│   └── seeders/           ← 30-row dataset + idempotent seeder
├── requests/              ← entry point for the pipeline
└── users/

database/
├── data-source.ts         ← TypeORM datasource
├── seed.ts                ← standalone seed runner (npm run seed)
└── migrations/            ← 5 migrations
```
