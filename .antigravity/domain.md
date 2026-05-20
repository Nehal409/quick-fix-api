# Domain — Entities, Enums & Schema

Full database schema for the QuickFix platform. **12 domain tables** across all modules.
Entities are co-located with their owning module under `src/modules/<x>/entities/`.
All migrations live under `database/migrations/`.

---

## Entity Ownership Map

| Table              | Owner Module        | Status          |
|--------------------|---------------------|-----------------|
| `users`            | UsersModule         | ✅ Done (migration shipped) |
| `providers`        | ProvidersModule     | 🔲 TODO         |
| `availability`     | ProvidersModule     | 🔲 TODO         |
| `service_requests` | RequestsModule      | 🔲 TODO         |
| `bookings`         | BookingsModule      | 🔲 TODO         |
| `messages`         | NotificationsModule | 🔲 TODO         |
| `notifications`    | NotificationsModule | 🔲 TODO         |
| `agent_traces`     | TraceModule         | 🔲 TODO         |
| `feedback`         | BookingsModule      | 🔲 TODO         |
| `disputes`         | BookingsModule      | 🔲 TODO         |
| `scheduled_tasks`  | SchedulingModule    | 🔲 TODO         |
| `seed_history`     | (root infra)        | 🔲 TODO         |

---

## `users` Table ✅

```typescript
@Entity('users')
export class User {
    id: number;            // PK, auto-increment
    uuid: string;          // auto UUID, unique
    email: string;         // unique
    passwordHash: string;  // select: false (excluded by default)
    name: string;
    role: Roles;           // enum: 'customer' | 'provider'
    createdAt: Date;
    updatedAt: Date;
}
```

---

## `providers` Table

```
id, uuid
userId (FK → users.id, 1-1)
name, phone, location (text)
serviceCategories (text[] or JSON tags)
specializationTags (text[])
rating (decimal, 0-5)
onTimePercent (decimal, rolling 30 jobs)
cancelRate (decimal, penalty-weighted)
totalJobs (int)
serviceAreaKm (int, radius)
isAvailable (bool)
createdAt, updatedAt
```

> Auto-created when a user registers with `role=provider`.

---

## `availability` Table

```
id
providerId (FK → providers.id)
dayOfWeek (0-6) OR specificDate (date)
startTime (time)
endTime (time)
isBooked (bool)
bookingId (FK → bookings.id, nullable)
createdAt, updatedAt
```

---

## `service_requests` Table

```
id (internal)
publicId (QF-####-XXX format, unique)
customerId (FK → users.id)
rawInput (text — original user message)
language (enum: en | ur | roman_ur | auto)
parsedIntent (jsonb — structured intent object)
confidence (decimal 0-1)
status (enum: processing | ready | needs_clarification | completed)
candidatesSnapshot (jsonb — top candidates at request time)
traceId (FK → agent_traces.id)
location (text/jsonb)
createdAt, updatedAt
```

---

## `bookings` Table

```
id (internal)
publicId (QF-####-XXX, unique)
requestId (FK → service_requests.id)
customerId (FK → users.id)
providerId (FK → providers.id)
slotId (FK → availability.id)
status (enum — see BookingStatus)
scheduledAt (timestamp)
address (text)
service (text)
quotedTotal (decimal)
finalTotal (decimal, nullable — set on complete)
paymentMethod (text)
cancelReason (enum, nullable)
cancelledBy ('customer' | 'provider', nullable)
cancelNote (text, nullable)
createdAt, updatedAt
```

---

## `messages` Table

```
id
bookingId (FK → bookings.id)
senderType ('customer' | 'provider' | 'system' | 'agent')
content (text)
isSimulatedWhatsapp (bool)
createdAt
```

---

## `notifications` Table

```
id
userId (FK → users.id)
type (enum: NotificationType)
tone (enum: NotificationTone)
icon (text)
title (text)
body (text)
read (bool, default false)
cta (text, nullable)
ctaTarget (text, nullable)
bookingId (FK, nullable)
createdAt
```

---

## `agent_traces` Table

```
id
requestId (FK → service_requests.id, nullable)
agent (text — agent name e.g. 'intent_agent')
model (text — e.g. 'gemini-flash')
latencyMs (int)
inputTokens (int)
outputTokens (int)
totalTokens (int)
toolCalls (jsonb — array of tool call records)
rawInput (jsonb)
rawOutput (jsonb)
createdAt
```

---

## `feedback` Table

```
id
bookingId (FK → bookings.id, unique — one per booking)
customerId (FK → users.id)
providerId (FK → providers.id)
rating (int 1-5)
tags (text[] — closed set vocabulary)
note (text, nullable)
createdAt
```

**Feedback tag vocabulary (closed set):**
`on_time`, `tidy`, `explained_well`, `fair_price`, `skilled`, `friendly`, `late`, `messy`, `unclear`

---

## `disputes` Table

```
id
bookingId (FK → bookings.id)
customerId (FK → users.id)
providerId (FK → providers.id)
reason (enum: DisputeReason)
description (text)
evidenceUrls (text[], nullable)
status (enum: open | resolved | escalated)
resolution (enum: DisputeResolution, nullable)
agentRecommendation (jsonb)
providerResponse (jsonb, nullable)
createdAt, updatedAt
```

---

## `scheduled_tasks` Table

```
id
type (text — e.g. 'reminder', 'follow_up')
bookingId (FK → bookings.id)
scheduledAt (timestamp)
firedAt (timestamp, nullable)
payload (jsonb)
status (enum: pending | fired | failed)
createdAt
```

---

## `seed_history` Table

```
id
seederName (text, unique)
ranAt (timestamp)
```

Prevents double-seeding when the seeder is replayed.

---

## All Domain Enums

### `BookingStatus`
```typescript
enum BookingStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    EN_ROUTE = 'en_route',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED_BY_CUSTOMER = 'cancelled_by_customer',
    CANCELLED_BY_PROVIDER = 'cancelled_by_provider',
    RESCHEDULED = 'rescheduled',
    DISPUTED = 'disputed',
}
```

### `CancelReason` — Provider
```typescript
// family_emergency (no penalty), vehicle_breakdown (light), sick_with_proof (none),
// double_booked (impact), unresponsive_customer (investigated), other
```

### `CancelReason` — Customer
```typescript
// changed_mind, found_alternative, wrong_time, other
```

### `DisputeReason`
```typescript
// incomplete, overcharge, damage, noshow, quality, other
```

### `DisputeResolution`
```typescript
// warranty_rework, partial_refund, full_refund, new_tech_assigned, dismissed, escalated
```

### `Language`
```typescript
enum Language { EN = 'en', UR = 'ur', ROMAN_UR = 'roman_ur', AUTO = 'auto' }
```

### `NotificationType`
```typescript
// agent, wa (simulated WhatsApp), price, dispute, rep (rate-your-job), reminder
```

### `NotificationTone`
```typescript
// accent, success, warn, neutral
```
