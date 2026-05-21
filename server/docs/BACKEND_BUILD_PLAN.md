# Backend Build Plan — AI Service Orchestrator

**Hackathon:** Google Antigravity Hackathon — Challenge 2
**Scope:** Backend only
**Stack:** NestJS + TypeScript, PostgreSQL (TypeORM), Docker
**Team:** 2 backend developers — BE-1 (lead) + BE-2
**Working Days:** 5 (May 15 → May 20, 2026)
**Companion design:** 23-screen mobile prototype (`Quickfix Mobile.html` handoff) — 14 customer screens + 9 provider screens. The API contract below is shaped to feed those screens directly.

> This document is the backend source of truth. It defines the module structure, the complete API contract, and task ownership. The API contract section is what the frontend team builds against — freeze it before any controller is written.

---

## 1. Stack Decisions

| Decision | Value | Rationale |
|---|---|---|
| Framework | NestJS + TypeScript | DI structure maps cleanly onto agent architecture; thin controllers |
| Database | PostgreSQL | Relational, transactions, joins |
| ORM | TypeORM | Decorator-driven entities co-located with NestJS modules; CLI migrations under `database/migrations/` |
| Validation | class-validator + class-transformer | Standard NestJS DTO pipeline; replaces earlier Zod choice |
| Containerization | Docker + docker-compose | Postgres + Nest app, reproducible environment |
| LLM | Google Gemini (Flash on hot path, Pro off hot path only) | Speed on the synchronous pipeline |
| Agent pipeline response | Synchronous — one POST returns full result | Simpler; mitigated with staged frontend loading text |
| Auth | JWT HS256 (`@nestjs/jwt`) + `bcryptjs` | Standard, fast to implement; no passport strategy needed for the demo |
| Hosting | Google Cloud Run, ngrok as local fallback | Cloud Run if time allows |

---

## 2. Module Structure

Each is a NestJS module with its own controller, service(s), and DTOs.

| Module | Responsibility |
|---|---|
| `AuthModule` | Email/password registration and login, JWT issuance, role-based guards (`@Roles('customer')` / `@Roles('provider')`) |
| `UsersModule` | User profile CRUD. Thin — mostly read-only since profiles are seeded |
| `ProvidersModule` | Provider entity management, mock dataset seeder, availability queries. Owns `providers` and `availability` tables |
| `AgentsModule` | The heart. All 9 agent services + the orchestrator. Each agent is an injectable service. Orchestrator coordinates them and owns the trace context |
| `MatchingModule` | Deterministic 8-factor scoring engine + baseline ranker (see §4.1). Pure math, not LLM calls |
| `PricingModule` | Deterministic pricing formula. Math here; the Pricing Agent wraps it with LLM-generated explanation |
| `BookingsModule` | Booking lifecycle, status transitions, the cancellation endpoint that triggers rescheduling. Owns `bookings` table |
| `SchedulingModule` | Slot management, conflict detection, travel-time buffers, `scheduled_tasks` table and the cron job that fires reminders |
| `NotificationsModule` | `notifications` and `messages` tables, polling endpoints, message generation |
| `TraceModule` | Agent trace persistence, cost/latency aggregation, export endpoint for submission deliverables |
| `GeminiModule` | Shared, injectable wrapper around the Gemini SDK. Centralizes API key handling, retry logic, token counting, structured-output config |
| `MapsModule` | Shared wrapper around Google Maps APIs (Distance Matrix, Static Maps, Geocoding). Cached aggressively |
| `DatabaseModule` | TypeORM `DataSource` config, `TypeOrmModule.forRootAsync`, migration runner glue. Entities live next to the module that owns them (`src/modules/<x>/entities/`), migrations under `database/migrations/` |

**Key architectural seam:** `MatchingModule` and `PricingModule` are deterministic and live separately from `AgentsModule`. The Ranking Agent and Pricing Agent *use* these modules to compute results, then call Gemini only for the human-readable reasoning narrative. This keeps the math testable and fast, and the LLM does what it's good at — explanation.

### 2.1 Domain Tables (12)

The schema spans 12 tables — entities are colocated with their owning module.

| Table | Owner module | Notes |
|---|---|---|
| `users` | UsersModule | `role` enum on the user row (`customer` \| `provider`); no join table. **Done — first migration shipped.** |
| `providers` | ProvidersModule | 1-1 with a `provider`-role user. Auto-created at registration when `role=provider`. Holds rating, on-time %, cancel rate, specialization tags, service area. |
| `availability` | ProvidersModule | Per-provider time-slot windows. Drives the "available tomorrow morning" matching factor. |
| `service_requests` | RequestsModule | One row per `POST /requests`. Stores raw input, parsed intent JSON, confidence, language, candidates snapshot. |
| `bookings` | BookingsModule | The booking lifecycle row. Has `status` enum (see §3.8). Links the original request + chosen provider + slot. |
| `messages` | NotificationsModule | Chat + simulated-WhatsApp messages, scoped to a booking. Drives the "Simulated WhatsApp" card on screens 08 and 14. |
| `notifications` | NotificationsModule | Inbox feed grouped by recency (now / today / earlier). Carries `type`, `tone`, `cta`. |
| `agent_traces` | TraceModule | One row per agent invocation. Stores model, latency, token counts, the tool-call list, raw input/output. Surfaced on screens 06, 10, 23. |
| `feedback` | BookingsModule | Customer rating + structured tags + optional note per completed booking. |
| `disputes` | BookingsModule | Dispute claims + resolution decision + agent recommendation snapshot. |
| `scheduled_tasks` | SchedulingModule | Cron-fired reminders + follow-ups. The `/demo/fast-forward` endpoint walks this table. |
| `seed_history` | (root infra) | Idempotency record for the seeder so re-seeding doesn't double up. |

---

## 3. Complete API Surface

This is the contract. The frontend team builds against this. Freeze request/response shapes before writing any controller.

Every endpoint is namespaced under `/api/v1`. Every response shape below is reverse-engineered from the 23-screen mobile design (`Quickfix Mobile.html`) — the screen number that consumes each endpoint is called out in the **Drives** column so frontend and backend stay in lockstep.

### 3.1 Auth (`/auth`) — Drives screens 01, 15

| Method | Endpoint | Purpose | Body / Returns |
|---|---|---|---|
| POST | `/auth/register` | Create account. If `role=provider`, a provider row is auto-created. | `{email, password, name, role, location}` → `{token, user}` |
| POST | `/auth/login` | Login | `{email, password}` → `{token, user}` |
| GET | `/auth/me` | Current user | → `{user}` |

`user` shape: `{id, email, name, role: 'customer'|'provider', location, createdAt}`. **Status:** complete — first TypeORM migration shipped.

### 3.2 Service Requests — The Agent Pipeline (`/requests`) — Drives screens 02–07

| Method | Endpoint | Purpose | Body / Returns |
|---|---|---|---|
| POST | `/requests` | **Main pipeline.** Runs intent → discovery → ranking → pricing in one call. | `{rawInput, language?: 'en'|'ur'|'roman_ur'|'auto', location?}` → see shape below |
| POST | `/requests/:id/clarify` | Resume after low-confidence clarification | `{answers: Record<string, string>}` → same shape as above |
| POST | `/requests/:id/rerank` | Re-rank candidates with a different weighting | `{strategy: 'price'|'distance'|'rating'|'balanced'}` → updated `candidates[]` |
| GET  | `/requests/:id` | Fetch a past request + its result | → full request object |

**`POST /requests` response (success — drives screens 03, 05):**
```
{
  requestId, traceId, status: 'ready'|'needs_clarification',
  intent: {
    service: { category, label, severity: 'low'|'medium'|'high' },
    location: { sector, city, lat?, lng? },
    when: { window: 'tomorrow_morning', start, end },
    budget: { max, currency: 'PKR', priceSensitive: bool },
    urgency: 'low'|'medium'|'high',
    confidence: 0.89,
    extractedFields: [ { key, label, value, icon, tags?: string[], bilingual?: { ur, en } } ],
    glosses: [ { ur, en } ]      // for inline annotations e.g. "kal = tomorrow"
  },
  candidates: [ { ...provider summary, matchScore, distance, eta, priceEstimate, tag, isBestMatch } ],
  pricing: { ...see §3.4 },
  ranking: { factorCount: 8, latencyMs: 2300, summary: "Scanned 12 providers near G-13..." }
}
```

**`POST /requests` response (low confidence — drives screen 04):**
```
{
  requestId, traceId, status: 'needs_clarification',
  partialIntent: { ... what we got so far },
  confidence: 0.62,
  clarifications: [
    { id, prompt, fieldTarget, type: 'choice'|'text',
      options?: [{ value, label, recommended?: bool }] }
  ],
  trace: ['intent_agent → ambiguous("kal", "location")', 'policy: confidence < 0.70 → ask user']
}
```

The pipeline is synchronous. If intent confidence < 0.7, it returns early with `status: 'needs_clarification'`. The frontend shows the clarify card; user answers; `/clarify` resumes the pipeline and returns the same `status: 'ready'` shape.

### 3.3 How-I-Decided (`/requests/:id/reasoning`) — Drives screen 06

| Method | Endpoint | Purpose | Body / Returns |
|---|---|---|---|
| GET | `/requests/:id/candidates/:providerId/reasoning` | Full factor breakdown + comparison narrative for one candidate | → shape below |

```
{
  providerId, matchScore: 92,
  narrative: "Ali is not the closest provider — Bilal is. I picked Ali because ...",
  factors: [
    { label, weight: 0.95, contribution: '+18', note: '"inverter AC" in reviews × 7' },
    ...8 entries total
  ],
  comparisonAgainst: { providerId, narrative: "Bilal is closer (2.3 km) but ...", scoreDelta: -8 },
  trace: { agent: 'ranking_agent', version: 'v2', weights: {...}, latencyMs: 1400, tokens: 1200, model: 'gemini-flash' }
}
```

### 3.4 Pricing (returned inline with `/requests` and `/bookings`) — Drives screen 07

The Pricing Agent's response shape is shared between the quote step and the booking record:

```
pricing: {
  estimateTotal: 3200, currency: 'PKR',
  budgetCap: 4000, withinBudget: true,
  breakdown: [
    { key: 'visit_fee',        label: 'Visit fee',            description: 'Diagnostic + first 30 min', amount: 1500, kind: 'base' },
    { key: 'travel',           label: 'Travel cost',          description: '2.7 km × Rs. 50/km',         amount:  135, kind: 'base' },
    { key: 'complexity',       label: 'Service complexity',   description: 'Inverter unit · intermediate', amount: 1200, kind: 'base' },
    { key: 'urgency',          label: 'Urgency adjustment',   description: 'Next-morning slot · ×1.10',  amount:  285, kind: 'surcharge' },
    { key: 'loyalty_discount', label: 'Loyalty discount',     description: 'Returning customer · −2%',   amount:  -60, kind: 'discount' },
    { key: 'demand_surge',     label: 'Demand surge',         description: 'Heatwave alert · Islamabad', amount:  140, kind: 'surcharge', signal: 'heatwave' }
  ],
  fairness: { marketLow: 2800, marketHigh: 3700, yourPrice: 3200, providerKeeps: 2560, platformFee: 640 },
  explanation: "Under your Rs. 4,000 cap. Final amount fixed after diagnostic."
}
```

### 3.5 Bookings (`/bookings`) — Drives screens 08, 09, 13, 18

| Method | Endpoint | Purpose | Body / Returns |
|---|---|---|---|
| POST | `/bookings` | Confirm a booking from a ranked candidate | `{requestId, providerId, slotId}` → `{booking, confirmationMessage, simulatedWhatsapp}` |
| GET  | `/bookings` | List for current user (role-aware) | `?status=&from=&to=` → `{bookings[], summary: {bookingsThisYear, totalSpent, savingsVsMarket}}` |
| GET  | `/bookings/:id` | Single booking with full detail + trace | → `{booking, statusTimeline[], agentTrace, eta, mapData}` |
| PATCH | `/bookings/:id/status` | Provider status update (`en_route`, `in_progress`, `completed`) | `{status, note?}` → `{booking}` |
| POST | `/bookings/:id/cancel` | **Cancellation — triggers auto-reschedule** | `{reason, note?, cancelledBy: 'customer'|'provider'}` → see §3.6 |
| POST | `/bookings/:id/accept` | Provider accepts an inbox request | → `{booking}` |
| POST | `/bookings/:id/decline` | Provider declines | `{reason}` → `{booking}` |
| POST | `/bookings/:id/complete` | Provider marks job complete with evidence | `{finalAmount, partsCost?, photoUrls[], checklist[]}` → `{booking, autoApproved: bool}` |

**`booking` shape** (drives screens 08 + 13): `{id: 'QF-2086-K3M', status, providerId, providerSnapshot, customerId, customerSnapshot, requestId, scheduledAt, address, service, quotedTotal, finalTotal?, paymentMethod, createdAt}`.

**`statusTimeline[]`** (drives screen 09): array of `{key, label, timestamp, sub?, agentTrace?, current?: bool, done?: bool}` covering `booking_confirmed → reminder_sent → en_route → in_progress → completed`.

**`mapData`** (drives screen 09): `{origin: {lat,lng}, destination: {lat,lng}, polyline?, etaMinutes, trafficFactor, staticMapUrl}`. Static map URL hits `MapsModule`.

### 3.6 Reschedule (`POST /bookings/:id/cancel` returns) — Drives screens 10, 21

Cancellation is the hero stress test. It synchronously runs the Reschedule Agent and returns both the dead booking and the new one:

```
{
  originalBooking: { ...with status: 'cancelled_by_provider', cancelReason },
  newBooking:      { ...full booking shape, sameSlot: true, priceDelta: 'same'|'higher'|'lower' },
  rescheduleTrace: {
    elapsedMs: 3200, toolCalls: 4, llmCalls: 1, model: 'gemini-flash',
    steps: [
      { ok: true, label: 'observed: provider_cancel(ali, reason="emergency")' },
      { ok: true, label: 'excluded ali from candidate pool' },
      { ok: true, label: 're-ranked 7 providers · top: bilal (84)' },
      { ok: true, label: 'checked bilal.availability(10:00 AM) → free' },
      { ok: true, label: 'auto-booked · sent confirmation' }
    ]
  },
  reliabilityImpact: { providerId, deltaScore: 0, reason: 'family_emergency · no penalty' },
  customerOverride: { allow: true, endpoint: '/bookings/:newId/reschedule/reject' }
}
```

| Method | Endpoint | Purpose | Body / Returns |
|---|---|---|---|
| POST | `/bookings/:id/reschedule/reject` | Customer rejects auto-rescheduled booking, falls back to ranking | → `{candidates[]}` |

### 3.7 Feedback & Disputes — Drives screens 11, 12, 23

| Method | Endpoint | Purpose | Body / Returns |
|---|---|---|---|
| POST | `/bookings/:id/feedback` | Customer submits rating | `{rating: 1..5, tags: string[], note?}` → `{updatedProviderRating, ratingDelta}` |
| POST | `/bookings/:id/dispute` | Customer files dispute | `{reason: DisputeReason, description, evidenceUrls?}` → `{dispute, agentSuggestion}` |
| GET  | `/disputes/:id` | Dispute detail + agent recommendation | → `{dispute, claim, agentRecommendation}` |
| POST | `/disputes/:id/respond` | Provider responds | `{action: 'free_rework'|'partial_refund'|'escalate', note?}` → `{dispute}` |

**`agentSuggestion` / `agentRecommendation` shape** (drives screens 12, 23):
```
{
  confidence: 0.84,
  primary: { action: 'free_rework', label: 'Free rework visit by you', tone: 'success' },
  alternatives: [
    { action: 'partial_refund', label: 'Partial refund · Rs. 500', tone: 'neutral' },
    { action: 'reassign',       label: 'Reassign to another tech',  tone: 'neutral' }
  ],
  rationale: "Looks like a warranty rework. Cooling lasted < 4 hours which falls inside the 7-day workmanship window.",
  trace: ['dispute_agent → similar_cases(rework_within_24h, n=14)', 'policy: workmanship_window=7d · no_payout_hold']
}
```

**Feedback tags vocabulary** (closed set): `on_time`, `tidy`, `explained_well`, `fair_price`, `skilled`, `friendly`, `late`, `messy`, `unclear`.

### 3.8 Domain Enums (single source of truth)

| Enum | Values |
|---|---|
| `BookingStatus` | `pending`, `confirmed`, `en_route`, `in_progress`, `completed`, `cancelled_by_customer`, `cancelled_by_provider`, `rescheduled`, `disputed` |
| `CancelReason` (provider) | `family_emergency` (no penalty), `vehicle_breakdown` (light), `sick_with_proof` (no), `double_booked` (impact), `unresponsive_customer` (investigated), `other` |
| `CancelReason` (customer) | `changed_mind`, `found_alternative`, `wrong_time`, `other` |
| `DisputeReason` | `incomplete`, `overcharge`, `damage`, `noshow`, `quality`, `other` |
| `DisputeResolution` | `warranty_rework`, `partial_refund`, `full_refund`, `new_tech_assigned`, `dismissed`, `escalated` |
| `Language` | `en`, `ur`, `roman_ur`, `auto` |
| `NotificationType` | `agent`, `wa` (simulated WhatsApp), `price`, `dispute`, `rep` (rate-your-job), `reminder` |
| `NotificationTone` | `accent`, `success`, `warn`, `neutral` |

### 3.9 Providers (`/providers`) — Drives screens 16, 17, 20, 22

| Method | Endpoint | Purpose | Body / Returns |
|---|---|---|---|
| GET | `/providers/:id` | Provider detail (customer view) | → `{provider}` |
| GET | `/providers/me/inbox` | Incoming requests (polled) — drives screen 16 | → `{requests[], surgeBanner?}` |
| GET | `/providers/me/schedule` | Day schedule + AI-suggested open slots — drives screen 17 | `?date=` → `{events[], aiSuggestions[], travelBuffers[], dayStrip[]}` |
| GET | `/providers/me/insights` | Earnings + workload + busy-hours forecast — drives screen 20 | → see shape below |
| GET | `/providers/me/reviews` | Reviews list with filter chips + agent insight — drives screen 22 | `?filter=` → `{summary, distribution[], reviews[], agentInsight}` |
| POST | `/providers/me/reviews/:reviewId/reply` | Reply to a review | `{text}` → `{review}` |

**`requests[]` row** (screen 16): `{requestId, customer: {name, initial}, area, distanceKm, scheduledAt, service, matchScore, payout, tags: ['urgent'|'within_24h'|'routine'|'complex'|'high_value'], expiresAt}`. Top row gets `urgent: true` + a countdown timer.

**Schedule response** (screen 17): events `{start, end, label, sub, status, bookingId?, color}`; aiSuggestions `{slot, expectedDemand, confidence}`; travelBuffers `{fromBookingId, toBookingId, minutes}`.

**Insights response** (screen 20):
```
{
  weekEarnings: 21840, projection: 32000, deltaVsLastWeek: 0.18,
  weekBars:  [ { day: 'Mon', earnings, jobs, today?, future? } ],
  todayJobs: { done: 4, planned: 5 },
  onTimePercent: 0.96, rating: 4.6, cancelRate: 0.012,
  busyHoursForecast: [ { hour: '8', density: 0.2 }, ... ],
  agentSuggestion: "Open 4–6 PM slot tomorrow — agent expects +3 requests"
}
```

### 3.10 Notifications (`/notifications`) — Drives screen 14

| Method | Endpoint | Purpose | Body / Returns |
|---|---|---|---|
| GET | `/notifications` | Poll for notifications | `?since=` → `{groups: [{title: 'now'|'today'|'earlier', items[]}], unreadCount}` |
| POST | `/notifications/:id/read` | Mark read | → `{ok}` |
| GET | `/bookings/:id/messages` | Chat/system messages for a booking | → `{messages[]}` |

`notification` shape: `{id, type: NotificationType, tone: NotificationTone, icon, title, body, timestamp, read, cta?, ctaTarget?}`.

### 3.11 Demo & Trace Utilities (`/demo`, `/trace`)

| Method | Endpoint | Purpose | Body / Returns |
|---|---|---|---|
| POST | `/demo/fast-forward` | Advance simulated time, fire due scheduled tasks | `{minutes}` → `{firedTasks[]}` |
| POST | `/demo/reset` | Reset DB to seeded demo state | → `{ok}` |
| GET  | `/trace/:id` | Full agent trace for a request | → `{trace}` |
| GET  | `/trace/export` | Export all traces as JSON (submission deliverable) | → file download |

The `/demo` endpoints are not real product features — they exist purely to make the demo video controllable. They are worth building; they save time on recording day.

---

## 4. The 9 Agents

All agents live in `AgentsModule` as injectable services, coordinated by the orchestrator.

| # | Agent | Type | Role |
|---|---|---|---|
| 1 | Intent Agent | LLM | NL → structured request JSON, confidence score, clarification detection, Roman Urdu glosses (`kal` → `tomorrow`) for inline UI annotation |
| 2 | Discovery Agent | LLM-assisted | Query providers by category + location, filter by specialization |
| 3 | Ranking Agent | Hybrid | Uses `MatchingModule` for **8-factor** scoring, Gemini for reasoning narrative + "why not X" comparison |
| 4 | Pricing Agent | Hybrid | Uses `PricingModule` for the formula, Gemini for the explanation. Returns full breakdown + fairness band |
| 5 | Booking Agent | Logic | Slot reservation, conflict prevention, idempotent booking-ID generation (`QF-####-XXX`) |
| 6 | Follow-up Agent | LLM | Reminder + message generation in 3 languages; ETA recalculation on traffic |
| 7 | Feedback Agent | Logic + LLM | Rating ingestion, tag aggregation, reputation recalculation; emits "trending theme" insight for provider screen 22 |
| 8 | Dispute Agent | LLM | Dispute reasoning, resolution recommendation with confidence (may use Gemini Pro — off hot path) |
| 9 | Reschedule Agent | Hybrid | Triggered on cancellation; re-runs ranking excluding cancelled provider, auto-books next-best, returns step trace + elapsed time |

**Hot path agents** (must use Gemini Flash for speed): Intent, Discovery, Ranking, Pricing. These run inside the synchronous `POST /requests`.

**Off hot path agents** (may use Gemini Pro): Dispute Agent in particular benefits from stronger reasoning and does not block a user-facing spinner.

### 4.1 The 8 Matching Factors (drives screen 06 "How I decided")

The design surfaces eight weighted factors with a numeric contribution per provider. `MatchingModule` is the authoritative implementation; the Ranking Agent just narrates.

| # | Factor | Default weight | Source signal |
|---|---|---|---|
| 1 | Specialization match | 0.22 | Tags + last-30-jobs category histogram |
| 2 | On-time score | 0.18 | `provider.on_time_percent` (rolling 30 jobs) |
| 3 | Distance / travel time | 0.16 | `MapsModule` Distance Matrix |
| 4 | Cancellation rate | 0.12 | `provider.cancel_rate` (penalty-weighted) |
| 5 | Review recency (last 14d) | 0.10 | Count + avg of reviews in window |
| 6 | Capacity in requested window | 0.10 | `availability` table free slots |
| 7 | Budget fit | 0.07 | Quote ≤ budget cap |
| 8 | Price per visit | 0.05 | Negative weight if above peer median |

The Ranking Agent must return per-factor `contribution: '+18'|'-2'` strings (UI renders the sign), per-factor `weight: 0..1` (rendered as a bar), and a short `note` string with the underlying evidence. Weights are tunable via a single config object — surface that in code.

### 4.2 Pricing Formula (drives screen 07 "Quote")

`PricingModule.computeQuote(intent, provider, marketContext)` returns the breakdown shape spec'd in §3.4. The six components are deterministic:

| Key | Formula |
|---|---|
| `visit_fee` | Flat per service category (e.g. AC repair: Rs. 1,500) |
| `travel` | `distanceKm × Rs. 50/km` |
| `complexity` | Service sub-type table (inverter intermediate: Rs. 1,200) |
| `urgency` | `base × urgencyMultiplier` (next-morning ×1.10, same-day ×1.25) |
| `loyalty_discount` | Negative; `−2%` after 3 completed bookings; `−5%` after 10 |
| `demand_surge` | `base × surgeMultiplier` driven by `marketContext.signal` (e.g. `heatwave`) |

**Fairness band**: `marketLow / marketHigh` come from peer-provider averages for the same service category in the same city. `providerKeeps = total × 0.80`, `platformFee = total × 0.20`. The UI renders a band and a vertical tick — surface `yourPrice` so it can position the tick.

### 4.3 Reschedule Agent Trace Contract (drives screen 10)

The Reschedule Agent must return its trace as a typed step list — the UI renders each as a green-checkmark line in a dark mono card. Five canonical steps:

1. `observed: provider_cancel(<id>, reason=<reason>)`
2. `excluded <id> from candidate pool`
3. `re-ranked <n> providers · top: <id> (<score>)`
4. `checked <id>.availability(<slot>) → free|busy`
5. `auto-booked · sent confirmation` OR `no_replacement_found · escalating to user`

Plus aggregate metadata: `elapsedMs`, `toolCalls`, `llmCalls`, `model`.

---

## 5. Task Breakdown by Owner

Two backend developers. The split follows a clean seam: BE-1 takes the agentic core plus matching/pricing (the rubric-critical, intellectually hard work — 25% Antigravity + 20% Agentic Reasoning). BE-2 takes the CRUD, infrastructure, and simulation plumbing (broad but more mechanical).

✅ = already shipped to `master`.

### 5.1 BE-1 (Lead) — Agentic Core

1. `GeminiModule` — SDK wrapper, structured output config, retry logic, token counting
2. `AgentsModule` scaffold — orchestrator service + trace context
3. Intent Agent — NL parsing, confidence scoring, clarification detection, Roman Urdu glosses
4. Discovery Agent — provider querying by category + location
5. `MatchingModule` — **8-factor** scoring engine (deterministic, see §4.1)
6. Ranking Agent — wraps matching engine + Gemini reasoning narrative + "why not X" comparison
7. `MatchingModule` baseline ranker — nearest-neighbor heuristic for comparison
8. `PricingModule` — pricing formula (deterministic, see §4.2)
9. Pricing Agent — wraps pricing + Gemini explanation + fairness band
10. Booking Agent — slot reservation, `QF-####-XXX` ID generation
11. Reschedule Agent — the hero; re-runs ranking on cancellation, returns 5-step trace
12. Feedback Agent — rating ingestion, reputation recalculation, trending-theme insight
13. Dispute Agent — dispute reasoning + ranked resolution recommendations + confidence
14. Follow-up Agent — reminder + message generation + simulated-WhatsApp payloads
15. `POST /requests`, `/requests/:id/clarify`, `/requests/:id/rerank`, `/requests/:id/.../reasoning` endpoints
16. `/trace` endpoints + export script

### 5.2 BE-2 — Infrastructure & Plumbing

1. `DatabaseModule` — TypeORM `DataSource`, `TypeOrmModule.forRootAsync`, migration runner
2. TypeORM entities for the remaining 11 domain tables (users entity ✅) — pair with BE-1
3. `AuthModule` — register, login, JWT (HS256), role guards ✅
4. `UsersModule` — profile CRUD ✅
5. `ProvidersModule` — entity + the 30-provider mock dataset seeder + auto-create on register
6. `availability` entity + slot management
7. `SchedulingModule` — conflict detection, travel buffers, cron for reminders
8. `BookingsModule` — non-agent endpoints (`POST /bookings`, `GET /bookings`, accept/decline/status/complete)
9. `NotificationsModule` — polling, grouping (now/today/earlier), `messages` entity, simulated-WhatsApp persistence
10. `MapsModule` — Distance Matrix + Static Maps wrapper, aggressive caching
11. `/demo` endpoints — fast-forward (advance `scheduled_tasks`), reset (seeder replay)
12. Docker setup — `docker-compose` for Postgres + the Nest app
13. Deployment — Cloud Run or the ngrok fallback

### 5.3 Shared / Pairing Tasks

To avoid integration problems, these are done together:

- **Entity catalog (§2.1)** — both. The schema is the contract between the two halves; freeze field names alongside DTO field names.
- **The `cancel` → reschedule integration** — BE-2 owns the booking cancellation endpoint, BE-1 owns the Reschedule Agent. Pair on the handoff so the response in §3.6 is returned atomically.
- **API contract freeze** — agree the exact request/response shapes in §3 so the frontend team is not blocked.

---

## 6. Synchronous Pipeline Mitigation

The synchronous `POST /requests` is the right call for simplicity, but the full pipeline is 3-4 sequential Gemini calls — roughly 4-8 seconds. A silent spinner that long looks broken in a demo video.

**Mitigation (zero backend work):** The frontend shows staged loading text on a timer while the single request is in flight — "Understanding your request..." at 0s, "Finding providers near you..." at 2s, "Ranking by 8 factors..." at 4s. It is a cosmetic illusion synced to expected backend timing, but it makes the wait feel agentic instead of broken.

**Stretch upgrade:** NestJS `@Sse()` upgrades this to genuine server-sent events that push each agent's result as it completes. Do not plan for it — treat it as a stretch if everything else is green.

**Model discipline:** Keep every hot-path agent (Intent, Discovery, Ranking, Pricing) on Gemini Flash. Pro on four sequential calls turns 8 seconds into 20. Reserve Pro, if used at all, for the Dispute Agent which runs off the hot path.

---

## 7. Open Items / Next Steps

Three areas to detail next, in priority order:

1. **TypeORM entity catalog** — field-level definitions for the 11 remaining entities (§2.1). Drives every other module.
2. **Orchestrator + agent service pattern** — the NestJS code structure for how agents, the orchestrator, and the trace context fit together.
3. **8-factor matching engine** — the scoring implementation (§4.1). 25% of the grade.

---

## 8. API Contract Freeze Checklist

Confirm with the frontend team before any controller is written:

- [ ] `POST /requests` request and response shape agreed (both `ready` and `needs_clarification`)
- [ ] `/requests/:id/clarify` answer shape agreed
- [ ] `GET /requests/:id/candidates/:providerId/reasoning` 8-factor + comparison shape agreed
- [ ] `POST /bookings/:id/cancel` response shape (originalBooking + newBooking + rescheduleTrace) agreed
- [ ] `GET /bookings/:id` `statusTimeline[]` keys + `mapData` shape agreed
- [ ] `POST /bookings/:id/feedback` tag vocabulary (§3.7) agreed
- [ ] Notification polling shape + groups (`now`/`today`/`earlier`) + interval (15s) agreed
- [ ] Provider inbox polling shape + `urgent`/countdown contract agreed
- [ ] Provider schedule shape (events + aiSuggestions + travelBuffers) agreed
- [ ] Domain enums in §3.8 frozen (BookingStatus, CancelReason, DisputeReason, DisputeResolution, NotificationType)
- [ ] Auth token format and header convention agreed
- [ ] Error response shape standardized across all endpoints
