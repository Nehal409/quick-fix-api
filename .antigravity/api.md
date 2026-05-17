# API Reference — QuickFix

Quick reference for all available endpoints. All routes are prefixed with `/api/v1`.

---

## Authentication

| Method | Endpoint           | Auth     | Description                        |
|--------|--------------------|----------|------------------------------------|
| POST   | `/auth/register`   | Public   | Register as customer or provider   |
| POST   | `/auth/login`      | Public   | Login, returns JWT                 |
| GET    | `/auth/me`         | Bearer   | Get current authenticated user     |

---

## Users

| Method | Endpoint       | Auth   | Description         |
|--------|----------------|--------|---------------------|
| GET    | `/users/me`    | Bearer | Get user profile    |
| PATCH  | `/users/me`    | Bearer | Update user profile |

---

## Service Requests (Agent Pipeline)

| Method | Endpoint                      | Auth   | Description                               |
|--------|-------------------------------|--------|-------------------------------------------|
| POST   | `/requests`                   | Bearer | Run full agent pipeline with user input   |
| POST   | `/requests/:id/clarify`       | Bearer | Resume pipeline after clarification       |

---

## Bookings

| Method | Endpoint                      | Auth   | Description                                   |
|--------|-------------------------------|--------|-----------------------------------------------|
| POST   | `/bookings`                   | Bearer | Confirm a booking from a priced request        |
| PATCH  | `/bookings/:id/status`        | Bearer | Update booking status                          |
| POST   | `/bookings/:id/cancel`        | Bearer | Cancel booking (triggers auto-reschedule)      |

---

## Notifications

| Method | Endpoint           | Auth   | Description                          |
|--------|--------------------|--------|--------------------------------------|
| GET    | `/notifications`   | Bearer | Poll in-app notifications            |

---

## Traces

| Method | Endpoint            | Auth   | Description                              |
|--------|---------------------|--------|------------------------------------------|
| GET    | `/trace/:id`        | Bearer | Get agent trace for a specific request   |
| GET    | `/trace/export`     | Bearer | Export all traces (hackathon submission) |

---

## Notes

- All protected routes require `Authorization: Bearer <JWT>` header
- Swagger UI available at `/api/v1/docs` in development mode
- Global API prefix: `/api/v1`
