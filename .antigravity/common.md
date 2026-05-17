# Common Layer — Shared Utilities Reference

Everything in `src/common/` is project-wide infrastructure. **Never duplicate these — always import from `src/common`.**

---

## Response Envelope

**File**: `src/common/middleware/response.ts`

`CustomResponseMiddleware` intercepts every `res.json()` call and wraps the payload in a standard shape:

```typescript
// What you return from a controller:
return { message: messages.USER.CREATED_SUCCESS, data: result };

// What the client actually receives:
{
  "data": { "token": "eyJ..." },
  "message": "User registered successfully",
  "success": true,
  "error": null
}
```

On error (status >= 400 or `error` field present):
```json
{
  "data": [],
  "message": "Invalid email or password",
  "success": false,
  "error": { ... }
}
```

The middleware is applied globally in `AppModule.configure()` for all routes.

---

## Error Filter

**File**: `src/common/filters/error.filter.ts`

`AllExceptionsFilter` is registered globally in `main.ts`. It catches **all** unhandled errors and normalises them into the response envelope.

- Handles `@hapi/boom` errors (mapped HTTP status + message)
- Handles NestJS `HttpException` subclasses
- Falls back to 500 for unknown errors
- Passes structured error to `res.json()` which the middleware then wraps

**Rule**: Never let exceptions bubble unhandled. Throw typed exceptions; the filter handles the rest.

---

## Messages Constants

**File**: `src/common/constants/messages.ts`

Centralised human-readable strings. **Always use these — never hardcode strings in controllers/services.**

```typescript
import { messages } from 'src/common';

// Usage in service:
throw badRequest(messages.USER.ALREADY_EXISTS);

// Usage in controller return:
return { message: messages.AUTH.LOGIN_SUCCESS, data: result };
```

| Namespace    | Key                    | Value                                        |
|--------------|------------------------|----------------------------------------------|
| (root)       | `DATA_FETCHED_SUCCESS` | `'Data fetched successfully'`                |
| (root)       | `RECORD_UPDATED_SUCCESS`| `'Record has been updated successfully'`    |
| (root)       | `RECORD_CREATED_SUCCESS`| `'Record has been created successfully'`    |
| (root)       | `RECORD_DELETED_SUCCESS`| `'Record has been deleted successfully'`    |
| `USER`       | `NOT_FOUND`            | `'User not found'`                           |
| `USER`       | `UPDATE`               | `'User has been updated successfully'`       |
| `USER`       | `ALREADY_EXISTS`       | `'A user with this email already exists'`    |
| `USER`       | `CREATED_SUCCESS`      | `'User registered successfully'`             |
| `AUTH`       | `INVALID_CREDENTIALS`  | `'Invalid email or password'`                |
| `AUTH`       | `INVALID_API_KEY`      | `'Invalid API key'`                          |
| `AUTH`       | `UNAUTHORIZED`         | `'Unauthorized'`                             |
| `AUTH`       | `LOGIN_SUCCESS`        | `'Login successful'`                         |
| `PROVIDER`   | `NOT_FOUND`            | `'Provider not found'`                       |
| `BOOKING`    | `NOT_FOUND`            | `'Booking not found'`                        |
| `BOOKING`    | `SLOT_UNAVAILABLE`     | `'The selected time slot is no longer available'` |
| `BOOKING`    | `CREATED_SUCCESS`      | `'Booking confirmed successfully'`           |
| `BOOKING`    | `CANCELLED_SUCCESS`    | `'Booking cancelled successfully'`           |
| `REQUEST`    | `NOT_FOUND`            | `'Service request not found'`                |
| `REQUEST`    | `NEEDS_CLARIFICATION`  | `'Additional information needed'`            |

**When adding a new module**, add its message namespace here. Do not scatter strings.

---

## Enums

**File**: `src/common/enums/roles.enum.ts`

```typescript
export enum Roles {
    CUSTOMER = 'customer',
    PROVIDER = 'provider',
}
```

**File**: `src/common/enums/log-modules.enum.ts`

```typescript
export enum LogModuleTypes {
    AUTH = 'AUTH',
    USERS = 'USERS',
    PROVIDERS = 'PROVIDERS',
    BOOKINGS = 'BOOKINGS',
    AGENTS = 'AGENTS',
    NOTIFICATIONS = 'NOTIFICATIONS',
    SCHEDULING = 'SCHEDULING',
}
```

Add a new entry here when adding a new module.

---

## Logger (Winston)

**File**: `src/common/utils/winston-logger.ts`

Do **not** use `console.log`. Inject the NestJS logger or use winston directly:

```typescript
// In a service or controller:
import { Logger } from '@nestjs/common';
import { LogModuleTypes } from 'src/common';

export class MyService {
    private readonly logger = new Logger(MyService.name);

    doSomething() {
        this.logger.log('Action taken', { module: LogModuleTypes.AUTH });
        this.logger.warn('Something odd');
        this.logger.error('Something broke', error.stack);
    }
}
```

Log output format:
```
2026-05-17T... [MyService - AUTH] info: 🚀 ~ Action taken
```

Logs rotate daily, kept 14 days, max 20MB per file in `logs/` directory.

---

## Guards

**File**: `src/modules/authentication/guards/jwt.guard.ts`

```typescript
// Protect a route with JWT:
@UseGuards(JwtAuthGuard)
@Get('me')
getMe(@Request() req: AuthenticatedRequest) {
    return req.user; // { userId: number, role: Roles }
}
```

**File**: `src/modules/authentication/guards/role.guard.ts`

```typescript
// Restrict to specific roles:
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(Roles.PROVIDER)
@Get('provider-only')
providerDashboard() { ... }
```

`RoleGuard` reads the `@Roles()` metadata set by the `@Roles()` decorator. If no `@Roles()` decorator is present, the guard passes through (public).

---

## API Descriptions (Swagger)

**File**: `src/common/constants/api-description.ts`

Stores `@ApiOperation({ description: ... })` strings. Import and use:

```typescript
import { descriptions } from 'src/common';

@ApiOperation({ description: descriptions.AUTH.REGISTER })
```

Add descriptions here when adding new endpoints, keep controllers clean.
