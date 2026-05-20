# Architecture — QuickFix API

A deep-dive into how the codebase is structured and how all the pieces connect.

---

## Directory Tree

```
quick-fix-api/
├── .antigravity/          ← Antigravity AI context files (this folder)
├── .github/               ← CI/CD workflows
├── config/
│   └── index.ts           ← Typed config factory (reads from env via ConfigService)
├── database/
│   ├── data-source.ts     ← TypeORM DataSource (used by CLI for migrations)
│   └── migrations/        ← All schema migrations (timestamped)
├── docs/
│   ├── BACKEND_BUILD_PLAN.md
│   └── AI Service Orchestrator for Informal Economy-Scope Of Work.pdf
├── src/
│   ├── main.ts            ← Bootstrap: NestFactory, Swagger, CORS, global prefix
│   ├── app.module.ts      ← Root module: imports all feature modules
│   ├── common/            ← Shared utilities (not business logic)
│   │   ├── constants/
│   │   │   ├── messages.ts          ← Centralised response messages
│   │   │   └── api-description.ts   ← Swagger @ApiOperation descriptions
│   │   ├── enums/
│   │   │   ├── roles.enum.ts        ← Roles enum (CUSTOMER | PROVIDER)
│   │   │   └── log-modules.enum.ts  ← LogModuleTypes enum for structured logging
│   │   ├── filters/
│   │   │   └── error.filter.ts      ← Global AllExceptionsFilter
│   │   ├── middleware/
│   │   │   └── response.ts          ← CustomResponseMiddleware (wraps all res bodies)
│   │   └── utils/
│   │       └── winston-logger.ts    ← Winston logger instance (console + daily rotate)
│   └── modules/
│       ├── authentication/          ← Auth feature module
│       └── users/                   ← Users feature module
├── Dockerfile
├── docker-compose.yml
└── .env.sample
```

---

## Request Lifecycle

```
HTTP Request
  ↓
CustomResponseMiddleware        (wraps res.json → standardised envelope)
  ↓
JwtAuthGuard (passport-jwt)     (validates Bearer token, populates req.user)
  ↓
RoleGuard                       (checks @Roles() decorator against req.user.role)
  ↓
ValidationPipe (global)         (validates & transforms DTOs via class-validator)
  ↓
Controller Method
  ↓
Service Method                  (all business logic lives here)
  ↓
Repository / TypeORM
  ↓
PostgreSQL
  ↓
Response
  ↓
AllExceptionsFilter             (catches any unhandled error → formats error envelope)
```

---

## Response Envelope

**Every** API response is wrapped by `CustomResponseMiddleware`:

```json
{
  "data": <payload or []>,
  "message": "Human readable status message",
  "success": true,
  "error": null
}
```

Error responses follow the same shape with `success: false` and `error` populated.

---

## Config System

Config is loaded once at bootstrap via `ConfigModule.forRoot({ load: [configuration] })`.

Access config in services:

```typescript
constructor(private readonly config: ConfigService) {}

// Usage
const secret = this.config.get<string>('jwt.secret');
const mapsKey = this.config.get<string>('googleMaps.apiKey');
const geminiKey = this.config.get<string>('gemini.apiKey');
```

Available config keys:

| Key                  | Source env var        |
|----------------------|-----------------------|
| `port`               | `PORT`                |
| `jwt.secret`         | `JWT_SECRET`          |
| `jwt.expiresIn`      | `JWT_EXPIRES_IN`      |
| `googleMaps.apiKey`  | `GOOGLE_MAPS_API_KEY` |
| `gemini.apiKey`      | `GEMINI_API_KEY`      |

---

## Authentication Flow

```
POST /api/v1/auth/register
  → RegisterDto (email, password, name, role)
  → bcrypt.hash(password, 12)
  → UsersRepository.create()
  → JwtService.sign({ userId, role })
  → { token: "eyJ..." }

POST /api/v1/auth/login
  → LoginDto (email, password)
  → UsersRepository.findByEmailWithPassword()
  → bcrypt.compare()
  → JwtService.sign({ userId, role })
  → { token: "eyJ..." }
```

JWT payload shape (`JwtPayload`):
```typescript
{ userId: number; role: Roles }
```

---

## Module Composition (app.module.ts)

```typescript
@Module({
  providers: [GlobalValidationPipe],
  imports: [
    ConfigModule (global),
    TypeOrmModule (dataSourceOptions),
    WinstonModule (winstonLogger instance),
    AuthenticationModule,
    UsersModule,
    // future: ProvidersModule, AgentsModule, BookingsModule, ...
  ]
})
export class AppModule {
  // CustomResponseMiddleware applied to ALL routes
}
```

---

## Database Schema (current)

### `users` table

| Column          | Type      | Notes                        |
|-----------------|-----------|------------------------------|
| `id`            | int (PK)  | Auto-increment               |
| `uuid`          | uuid      | Auto-generated, unique       |
| `email`         | varchar   | Unique                       |
| `password_hash` | varchar   | `select: false` — excluded by default |
| `name`          | varchar   |                              |
| `role`          | enum      | `customer` \| `provider`     |
| `created_at`    | timestamp | Auto-managed by TypeORM      |
| `updated_at`    | timestamp | Auto-managed by TypeORM      |

Migration: `1778941723557-CreateUsersTable`

---

## Logging

The `winstonLogger` outputs:

- **Console**: colorized, emoji-prefixed, human-readable
- **File**: daily rotating JSON logs in `logs/` directory (14-day retention, 20MB max)

Log format on console:
```
<ISO timestamp> [<context> - <module>] <level>: 🚀 ~ <message> | Data: {...}
```

Log format when calling:
```typescript
this.logger.log('message', { module: LogModuleTypes.AUTH, data: payload });
```
