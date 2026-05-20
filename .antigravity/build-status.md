# Build Plan — What's Done & What's Left

**Hackathon:** Google Antigravity Hackathon — Challenge 2
**Deadline:** May 20, 2026
**Team:** BE-1 (lead — agentic core) + BE-2 (infra & plumbing)

---

## Overall Progress

```
Auth + Users      ████████░░  Done ✅
Providers         ░░░░░░░░░░  TODO
Service Requests  ░░░░░░░░░░  TODO
Bookings          ░░░░░░░░░░  TODO
Scheduling        ░░░░░░░░░░  TODO
Notifications     ░░░░░░░░░░  TODO
Agents (all 9)    ░░░░░░░░░░  TODO  ← 25% of hackathon grade
Matching Engine   ░░░░░░░░░░  TODO  ← 25% of hackathon grade
Pricing Engine    ░░░░░░░░░░  TODO
Trace             ░░░░░░░░░░  TODO
Gemini Wrapper    ░░░░░░░░░░  TODO
Maps Wrapper      ░░░░░░░░░░  TODO
Demo Endpoints    ░░░░░░░░░░  TODO
Docker            ████████░░  Done ✅
```

---

## BE-1 Tasks — Agentic Core

| # | Task | Status |
|---|------|--------|
| 1 | `GeminiModule` — SDK wrapper, structured output, retry, token counting | 🔲 |
| 2 | `AgentsModule` scaffold — orchestrator + trace context | 🔲 |
| 3 | Intent Agent — NL parsing, confidence, clarification, Roman Urdu glosses | 🔲 |
| 4 | Discovery Agent — provider query by category + location | 🔲 |
| 5 | `MatchingModule` — **8-factor scoring engine** (deterministic) | 🔲 |
| 6 | Ranking Agent — wraps matching + Gemini reasoning + "why not X" narrative | 🔲 |
| 7 | `MatchingModule` baseline ranker (nearest-neighbor heuristic) | 🔲 |
| 8 | `PricingModule` — deterministic pricing formula | 🔲 |
| 9 | Pricing Agent — wraps pricing + Gemini explanation + fairness band | 🔲 |
| 10 | Booking Agent — slot reservation, `QF-####-XXX` ID generation | 🔲 |
| 11 | **Reschedule Agent** — hero demo; re-runs ranking on cancel, 5-step trace | 🔲 |
| 12 | Feedback Agent — rating ingestion, reputation recalculation, trending insight | 🔲 |
| 13 | Dispute Agent — reasoning + ranked resolution + confidence (Gemini Pro ok) | 🔲 |
| 14 | Follow-up Agent — reminder + WhatsApp message generation (3 languages) | 🔲 |
| 15 | `POST /requests`, `/clarify`, `/rerank`, `reasoning` endpoints | 🔲 |
| 16 | `/trace` endpoints + export script | 🔲 |

---

## BE-2 Tasks — Infrastructure & Plumbing

| # | Task | Status |
|---|------|--------|
| 1 | `DatabaseModule` — TypeORM DataSource, forRootAsync, migration runner | 🔲 |
| 2 | TypeORM entities for 11 remaining domain tables | 🔲 |
| 3 | `AuthModule` — register, login, JWT, role guards | ✅ |
| 4 | `UsersModule` — profile CRUD | ✅ |
| 5 | `ProvidersModule` — entity + 30-provider mock seeder + auto-create on register | 🔲 |
| 6 | `availability` entity + slot management | 🔲 |
| 7 | `SchedulingModule` — conflict detection, travel buffers, cron for reminders | 🔲 |
| 8 | `BookingsModule` — non-agent endpoints (POST, GET, accept/decline/status/complete) | 🔲 |
| 9 | `NotificationsModule` — polling, grouping, messages entity, WhatsApp simulation | 🔲 |
| 10 | `MapsModule` — Distance Matrix + Static Maps, aggressive caching | 🔲 |
| 11 | `/demo` endpoints — `fast-forward`, `reset` | 🔲 |
| 12 | Docker — docker-compose for Postgres + Nest | ✅ |
| 13 | Deployment — Cloud Run or ngrok fallback | 🔲 |

---

## Shared / Pairing Tasks

| Task | Notes |
|------|-------|
| Entity catalog (all 12 tables) | Freeze field names before writing any service |
| Cancel → Reschedule handoff | BE-2 owns cancel endpoint, BE-1 owns Reschedule Agent — must pair |
| API contract freeze | See `api.md` — agree shapes before writing controllers |

---

## Grading Breakdown (Hackathon Rubric)

| Area | Weight | Owner | Notes |
|------|--------|-------|-------|
| Agentic Reasoning | 25% | BE-1 | The 9 agents + orchestrator |
| Matching Engine | 25% | BE-1 | 8-factor scoring (see `agents.md`) |
| Code Quality | 20% | Both | TypeScript strict, patterns, tests |
| UI/UX Integration | 15% | Frontend | API contract from `api.md` |
| Deployment | 15% | BE-2 | Cloud Run preferred |

---

## Critical Path

```
Day 1 (May 15): ✅ Auth, Users, Docker, DB foundation
Day 2 (May 16): ProvidersModule + entities + GeminiModule + AgentsModule scaffold
Day 3 (May 17): Intent Agent + Discovery Agent + MatchingModule (8 factors)
Day 4 (May 18): Ranking Agent + PricingModule + Pricing Agent + POST /requests working end-to-end
Day 5 (May 19): BookingsModule + Reschedule Agent (hero demo) + all remaining agents + demo endpoints
Day 6 (May 20): Polish, deployment, trace export, demo video recording
```

---

## Synchronous Pipeline Note

`POST /requests` runs 4 sequential Gemini calls (≈ 4–8 seconds).

**Mitigation (frontend):** Staged loading text while single request is in-flight:
- 0s → "Understanding your request..."
- 2s → "Finding providers near you..."
- 4s → "Ranking by 8 factors..."

Keep all hot-path agents (Intent, Discovery, Ranking, Pricing) on **Gemini Flash**.
Dispute Agent is the only one that may use Gemini Pro (off hot path).

**Stretch goal:** SSE via `@Sse()` to push each agent result as it completes. Do not plan for it.
