# Agent Pipeline — QuickFix

This document describes the full multi-agent pipeline that powers the QuickFix service orchestration.

---

## Pipeline Overview

```
User Input (natural language / Roman Urdu)
  ↓
Orchestrator
  ↓
1. Intent Agent        → structured request + confidence score
  ↓ (if confidence < 0.7 → ask clarification)
2. Discovery Agent     → candidate providers from DB
  ↓
3. Ranking Agent       → top 3 with six-factor scores + reasoning
  ↓
4. Pricing Agent       → quote with cost breakdown
  ↓ (user confirms booking)
5. Booking Agent       → slot reservation + conflict detection
  ↓ (background)
6. Follow-up Agent     → schedules reminder notifications
  ↓ (on cancellation)
7. Reschedule Agent    → re-runs ranking, auto-books next-best provider
  ↓ (after job completion)
8. Feedback Agent      → updates provider reputation score
  ↓ (if dispute filed)
9. Dispute Agent       → resolution recommendation
```

---

## Agent Details

| # | Agent           | Model              | Trigger                              |
|---|-----------------|--------------------|--------------------------------------|
| 1 | Intent          | Gemini Flash       | Every user request                   |
| 2 | Discovery       | Gemini Flash       | After intent extraction              |
| 3 | Ranking         | Gemini Flash       | After discovery                      |
| 4 | Pricing         | Gemini Flash       | After ranking                        |
| 5 | Booking         | Deterministic      | User confirms                        |
| 6 | Follow-up       | Deterministic      | After booking (background cron)      |
| 7 | Reschedule      | Gemini Flash       | On provider cancellation             |
| 8 | Feedback        | Gemini Flash       | After job marked complete            |
| 9 | Dispute         | Gemini Pro         | If user files a dispute              |

---

## Key Design Decisions

- **Hot path** (Intent → Discovery → Ranking → Pricing): uses **Gemini Flash** for low latency
- **Off hot-path** (Dispute): uses **Gemini Pro** for higher reasoning quality
- **Clarification loop**: if Intent confidence < 0.7, Orchestrator halts and asks user to clarify via `/api/v1/requests/:id/clarify`
- **Agentic traces**: every agent step is persisted to `TraceModule` for the "How I decided" panel and hackathon submission export
- **Ranking factors**: 6-factor deterministic scoring (distance, rating, price, availability, specialization, response time)
- **Roman Urdu support**: Intent Agent prompt is engineered to handle Roman Urdu / mixed-language input natively

---

## Trace Export

Agent traces are available at:

- `GET /api/v1/trace/:id` — single request trace
- `GET /api/v1/trace/export` — all traces (used for hackathon submission)
