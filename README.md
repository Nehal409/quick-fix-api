# QuickFix API

AI Service Orchestrator for Informal Economy — Backend API
**Google Antigravity Hackathon — Challenge 2**

---

## Overview

QuickFix automates the end-to-end service request lifecycle for Pakistan's informal service economy (AC technicians). Natural language input flows through a multi-agent pipeline: intent extraction → provider discovery → ranking → pricing → booking → follow-up → feedback → dispute handling.

Key differentiators:
- Roman Urdu / Urdu first-class support
- Visible agentic reasoning ("How I decided" panel) via agent traces
- Auto-rescheduling on provider cancellation (hero demo moment)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS + TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| LLM | Google Gemini (Flash on hot path, Pro off hot path) |
| Maps | Google Maps — Distance Matrix + Static Maps |
| Auth | JWT (email + password, HS256) |
| Containerization | Docker + docker-compose |

---

## Getting Started

### Prerequisites

- Node.js 22+
- Docker & Docker Compose

### Install

```bash
npm install
```

### Configure Environment

```bash
cp .env.sample .env
# Edit .env with your values
```

Required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs (change in production) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key |

---

## Running the App

### With Docker Compose (recommended)

```bash
docker compose up --build
```

This starts PostgreSQL + the API. Runs migrations and seed on startup.

### Local Development

```bash
# Start PostgreSQL only
docker compose up db -d

# Run migrations
npm run migrate:create

# Seed database
npm run seed

# Start in watch mode
npm run start:dev
```

API is available at `http://localhost:3000/api/v1`
Swagger docs at `http://localhost:3000/api/v1/docs`

---

## Prisma

```bash
# Generate Prisma client
npm run prisma:generate

# Create a new migration
npm run migrate:create

# Deploy migrations (production)
npm run migrate:deploy

# Seed the database
npm run seed
```

---

## Module Structure

| Module | Responsibility |
|---|---|
| `AuthModule` | Email/password registration and login, JWT issuance, role guards |
| `UsersModule` | User profile read/update |
| `ProvidersModule` | Provider entity, 30-provider mock seeder, availability queries |
| `AgentsModule` | All 9 agent services + orchestrator |
| `MatchingModule` | Six-factor deterministic scoring engine |
| `PricingModule` | Deterministic pricing formula |
| `BookingsModule` | Booking lifecycle and status transitions |
| `SchedulingModule` | Slot management, conflict detection, reminder cron |
| `NotificationsModule` | In-app polling notifications and messages |
| `TraceModule` | Agent trace persistence and export |
| `GeminiModule` | Shared Gemini SDK wrapper |
| `MapsModule` | Google Maps Distance Matrix + Static Maps wrapper |

---

## API Surface

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register (customer or provider) |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Current user |
| GET | `/api/v1/users/me` | User profile |
| PATCH | `/api/v1/users/me` | Update profile |
| POST | `/api/v1/requests` | Run full agent pipeline |
| POST | `/api/v1/requests/:id/clarify` | Resume after clarification |
| POST | `/api/v1/bookings` | Confirm booking |
| PATCH | `/api/v1/bookings/:id/status` | Update booking status |
| POST | `/api/v1/bookings/:id/cancel` | Cancel (triggers auto-reschedule) |
| GET | `/api/v1/notifications` | Poll notifications |
| GET | `/api/v1/trace/:id` | Get agent trace |
| GET | `/api/v1/trace/export` | Export all traces (submission) |

---

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

---

## Agent Pipeline

```
User Input
  ↓
Orchestrator
  ↓
1. Intent Agent       → structured request + confidence score
  ↓ (if confidence < 0.7 → clarify)
2. Discovery Agent    → candidate providers
  ↓
3. Ranking Agent      → top 3 with six-factor scores + reasoning
  ↓
4. Pricing Agent      → quote with breakdown
  ↓ (user confirms)
5. Booking Agent      → slot reservation + conflict check
  ↓ (background)
6. Follow-up Agent    → schedules reminders
  ↓ (on cancellation)
7. Reschedule Agent   → re-runs ranking, auto-books next-best
  ↓ (after completion)
8. Feedback Agent     → updates provider reputation
  ↓ (if dispute filed)
9. Dispute Agent      → resolution recommendation
```

Hot-path agents (Gemini Flash): Intent, Discovery, Ranking, Pricing.
Off hot-path (may use Gemini Pro): Dispute Agent.
