# API Contract — Full Reference

**This is the frozen API contract.** Frontend builds against this.
All routes are prefixed with `/api/v1`.
Every protected route requires `Authorization: Bearer <JWT>`.

---

## Standard Response Envelope

All responses are wrapped by `CustomResponseMiddleware`:

```json
{
  "data": <payload>,
  "message": "Human readable status",
  "success": true,
  "error": null
}
```

---

## 3.1 Auth `/auth` — Screens 01, 15

| Method | Endpoint         | Auth   | Description                                       |
|--------|------------------|--------|---------------------------------------------------|
| POST   | `/auth/register` | Public | Register. If `role=provider`, auto-creates provider row |
| POST   | `/auth/login`    | Public | Login, returns JWT                                |
| GET    | `/auth/me`       | Bearer | Current user                                      |

**Register body:**
```json
{ "email": "", "password": "", "name": "", "role": "customer|provider", "location": "" }
```

**`user` shape (returned by all auth endpoints):**
```json
{ "id": 1, "email": "", "name": "", "role": "customer|provider", "location": "", "createdAt": "" }
```

---

## 3.2 Service Requests `/requests` — Screens 02–07

| Method | Endpoint                  | Auth   | Description                                    |
|--------|---------------------------|--------|------------------------------------------------|
| POST   | `/requests`               | Bearer | Full agent pipeline (intent → pricing)         |
| POST   | `/requests/:id/clarify`   | Bearer | Resume after low-confidence clarification      |
| POST   | `/requests/:id/rerank`    | Bearer | Re-rank with different weighting strategy      |
| GET    | `/requests/:id`           | Bearer | Fetch a past request + result                  |

**`POST /requests` body:**
```json
{ "rawInput": "mera AC theek karo", "language": "auto", "location": { "lat": 0, "lng": 0 } }
```

**Success response (`status: 'ready'`) — Screens 03, 05:**
```json
{
  "requestId": "QF-2086-K3M",
  "traceId": "...",
  "status": "ready",
  "intent": {
    "service": { "category": "ac_repair", "label": "AC Repair", "severity": "medium" },
    "location": { "sector": "G-13", "city": "Islamabad", "lat": 33.65, "lng": 73.01 },
    "when": { "window": "tomorrow_morning", "start": "2026-05-18T09:00:00Z", "end": "2026-05-18T12:00:00Z" },
    "budget": { "max": 4000, "currency": "PKR", "priceSensitive": true },
    "urgency": "medium",
    "confidence": 0.89,
    "extractedFields": [
      { "key": "service", "label": "Service", "value": "AC Repair", "icon": "❄️", "tags": ["appliance"] }
    ],
    "glosses": [{ "ur": "kal", "en": "tomorrow" }]
  },
  "candidates": [
    {
      "providerId": 1, "name": "Ali AC Tech", "rating": 4.6, "onTimePercent": 0.96,
      "distanceKm": 2.1, "eta": "25 min", "priceEstimate": 3200,
      "matchScore": 92, "tag": "Best Match", "isBestMatch": true
    }
  ],
  "pricing": { "...see pricing shape below..." },
  "ranking": { "factorCount": 8, "latencyMs": 2300, "summary": "Scanned 12 providers near G-13..." }
}
```

**Low-confidence response (`status: 'needs_clarification'`) — Screen 04:**
```json
{
  "requestId": "...", "traceId": "...", "status": "needs_clarification",
  "partialIntent": {},
  "confidence": 0.62,
  "clarifications": [
    {
      "id": "q1", "prompt": "Which area are you in?", "fieldTarget": "location",
      "type": "choice",
      "options": [{ "value": "g13", "label": "G-13", "recommended": true }]
    }
  ],
  "trace": ["intent_agent → ambiguous(\"location\")", "policy: confidence < 0.70 → ask user"]
}
```

---

## 3.3 How-I-Decided `/requests/:id/reasoning` — Screen 06

| Method | Endpoint                                     | Auth   |
|--------|----------------------------------------------|--------|
| GET    | `/requests/:id/candidates/:providerId/reasoning` | Bearer |

**Response:**
```json
{
  "providerId": 1, "matchScore": 92,
  "narrative": "Ali is not the closest — I picked him because...",
  "factors": [
    { "label": "Specialization match", "weight": 0.22, "contribution": "+18", "note": "\"inverter AC\" in reviews × 7" },
    { "label": "On-time score",        "weight": 0.18, "contribution": "+14", "note": "96% on-time, rolling 30 jobs" },
    { "label": "Distance",             "weight": 0.16, "contribution": "+10", "note": "2.1 km from customer" },
    { "label": "Cancellation rate",    "weight": 0.12, "contribution": "+9",  "note": "1.2% cancel rate" },
    { "label": "Review recency",       "weight": 0.10, "contribution": "+8",  "note": "4 reviews in last 14 days" },
    { "label": "Capacity in window",   "weight": 0.10, "contribution": "+8",  "note": "Free 9 AM–12 PM tomorrow" },
    { "label": "Budget fit",           "weight": 0.07, "contribution": "+5",  "note": "Rs. 3200 under Rs. 4000 cap" },
    { "label": "Price per visit",      "weight": 0.05, "contribution": "+3",  "note": "Near peer median" }
  ],
  "comparisonAgainst": { "providerId": 2, "narrative": "Bilal is closer (2.3 km) but lower on-time...", "scoreDelta": -8 },
  "trace": { "agent": "ranking_agent", "version": "v2", "weights": {}, "latencyMs": 1400, "tokens": 1200, "model": "gemini-flash" }
}
```

---

## 3.4 Pricing Shape (inline with `/requests` and `/bookings`)

```json
{
  "estimateTotal": 3200, "currency": "PKR",
  "budgetCap": 4000, "withinBudget": true,
  "breakdown": [
    { "key": "visit_fee",        "label": "Visit fee",           "description": "Diagnostic + first 30 min", "amount": 1500, "kind": "base" },
    { "key": "travel",           "label": "Travel cost",         "description": "2.7 km × Rs. 50/km",        "amount":  135, "kind": "base" },
    { "key": "complexity",       "label": "Service complexity",  "description": "Inverter unit · intermediate","amount": 1200, "kind": "base" },
    { "key": "urgency",          "label": "Urgency adjustment",  "description": "Next-morning · ×1.10",       "amount":  285, "kind": "surcharge" },
    { "key": "loyalty_discount", "label": "Loyalty discount",    "description": "Returning customer · −2%",   "amount":  -60, "kind": "discount" },
    { "key": "demand_surge",     "label": "Demand surge",        "description": "Heatwave alert · Islamabad", "amount":  140, "kind": "surcharge", "signal": "heatwave" }
  ],
  "fairness": { "marketLow": 2800, "marketHigh": 3700, "yourPrice": 3200, "providerKeeps": 2560, "platformFee": 640 },
  "explanation": "Under your Rs. 4,000 cap. Final amount fixed after diagnostic."
}
```

---

## 3.5 Bookings `/bookings` — Screens 08, 09, 13, 18

| Method | Endpoint                        | Auth   | Description                                   |
|--------|---------------------------------|--------|-----------------------------------------------|
| POST   | `/bookings`                     | Bearer | Confirm booking from ranked candidate         |
| GET    | `/bookings`                     | Bearer | List for current user (role-aware)            |
| GET    | `/bookings/:id`                 | Bearer | Single booking + timeline + trace + map       |
| PATCH  | `/bookings/:id/status`          | Bearer | Provider status update                        |
| POST   | `/bookings/:id/cancel`          | Bearer | Cancel — triggers auto-reschedule             |
| POST   | `/bookings/:id/accept`          | Bearer | Provider accepts                              |
| POST   | `/bookings/:id/decline`         | Bearer | Provider declines                             |
| POST   | `/bookings/:id/complete`        | Bearer | Provider marks complete with evidence         |

**`booking` shape:**
```json
{
  "id": "QF-2086-K3M", "status": "confirmed",
  "providerId": 1, "providerSnapshot": {},
  "customerId": 5, "customerSnapshot": {},
  "requestId": "...", "scheduledAt": "2026-05-19T09:00:00Z",
  "address": "House 12, G-13/1, Islamabad",
  "service": "AC Repair", "quotedTotal": 3200, "finalTotal": null,
  "paymentMethod": "cash", "createdAt": "..."
}
```

**`statusTimeline[]` (screen 09):**
```json
[
  { "key": "booking_confirmed", "label": "Booking Confirmed", "timestamp": "...", "done": true },
  { "key": "reminder_sent",     "label": "Reminder Sent",     "timestamp": "...", "done": true },
  { "key": "en_route",          "label": "Technician En Route","timestamp": "...", "current": true },
  { "key": "in_progress",       "label": "In Progress",        "timestamp": null,  "done": false },
  { "key": "completed",         "label": "Completed",          "timestamp": null,  "done": false }
]
```

**`mapData` (screen 09):**
```json
{ "origin": {"lat":33.67,"lng":73.01}, "destination": {"lat":33.65,"lng":73.00}, "etaMinutes": 22, "trafficFactor": 1.1, "staticMapUrl": "https://maps.googleapis.com/..." }
```

---

## 3.6 Reschedule — Screen 10, 21

`POST /bookings/:id/cancel` body: `{ "reason": "family_emergency", "note": "...", "cancelledBy": "provider" }`

**Response:**
```json
{
  "originalBooking": { "...status: cancelled_by_provider..." },
  "newBooking": { "...full booking shape...", "sameSlot": true, "priceDelta": "same" },
  "rescheduleTrace": {
    "elapsedMs": 3200, "toolCalls": 4, "llmCalls": 1, "model": "gemini-flash",
    "steps": [
      { "ok": true, "label": "observed: provider_cancel(ali, reason=\"emergency\")" },
      { "ok": true, "label": "excluded ali from candidate pool" },
      { "ok": true, "label": "re-ranked 7 providers · top: bilal (84)" },
      { "ok": true, "label": "checked bilal.availability(10:00 AM) → free" },
      { "ok": true, "label": "auto-booked · sent confirmation" }
    ]
  },
  "reliabilityImpact": { "providerId": 1, "deltaScore": 0, "reason": "family_emergency · no penalty" },
  "customerOverride": { "allow": true, "endpoint": "/bookings/:newId/reschedule/reject" }
}
```

| Method | Endpoint                           | Description                                      |
|--------|------------------------------------|--------------------------------------------------|
| POST   | `/bookings/:id/reschedule/reject`  | Customer rejects auto-rescheduled, falls to ranking |

---

## 3.7 Feedback & Disputes — Screens 11, 12, 23

| Method | Endpoint                       | Auth   | Description                    |
|--------|--------------------------------|--------|--------------------------------|
| POST   | `/bookings/:id/feedback`       | Bearer | Submit rating                  |
| POST   | `/bookings/:id/dispute`        | Bearer | File dispute                   |
| GET    | `/disputes/:id`                | Bearer | Dispute detail + recommendation |
| POST   | `/disputes/:id/respond`        | Bearer | Provider responds to dispute   |

---

## 3.9 Providers `/providers` — Screens 16, 17, 20, 22

| Method | Endpoint                          | Auth   | Description                             |
|--------|-----------------------------------|--------|-----------------------------------------|
| GET    | `/providers/:id`                  | Bearer | Provider detail (customer view)         |
| GET    | `/providers/me/inbox`             | Bearer | Incoming requests (polled)              |
| GET    | `/providers/me/schedule`          | Bearer | Day schedule + AI-suggested slots       |
| GET    | `/providers/me/insights`          | Bearer | Earnings + workload + forecast          |
| GET    | `/providers/me/reviews`           | Bearer | Reviews + filter chips + agent insight  |
| POST   | `/providers/me/reviews/:id/reply` | Bearer | Reply to a review                       |

---

## 3.10 Notifications `/notifications` — Screen 14

| Method | Endpoint                         | Auth   | Description                  |
|--------|----------------------------------|--------|------------------------------|
| GET    | `/notifications`                 | Bearer | Poll (use `?since=` timestamp)|
| POST   | `/notifications/:id/read`        | Bearer | Mark as read                 |
| GET    | `/bookings/:id/messages`         | Bearer | Chat messages for a booking  |

**Response shape:** `{ "groups": [{ "title": "now|today|earlier", "items": [...] }], "unreadCount": 3 }`
Poll interval: **15 seconds**.

---

## 3.11 Demo & Trace Utilities

| Method | Endpoint             | Auth   | Description                              |
|--------|----------------------|--------|------------------------------------------|
| POST   | `/demo/fast-forward` | Bearer | Advance simulated time, fire cron tasks  |
| POST   | `/demo/reset`        | Bearer | Reset DB to seeded demo state            |
| GET    | `/trace/:id`         | Bearer | Full agent trace                         |
| GET    | `/trace/export`      | Bearer | Export all traces as JSON (submission)   |
