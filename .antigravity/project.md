# QuickFix API — Antigravity Project Context

> This file is read by **Antigravity** (Google DeepMind's AI coding assistant) to understand
> the project before making any changes. Keep it updated as the project evolves.

---

## Project Identity

| Field       | Value                                                    |
|-------------|----------------------------------------------------------|
| Name        | QuickFix API                                             |
| Version     | 0.1.0                                                    |
| Event       | Google Antigravity Hackathon — Challenge 2               |
| Description | AI Service Orchestrator for Pakistan's informal economy  |
| Domain      | AC technician / home service booking via natural language|

---

## Tech Stack

| Layer            | Technology                                      |
|------------------|-------------------------------------------------|
| Framework        | NestJS + TypeScript                             |
| Database         | PostgreSQL 16 via TypeORM                       |
| LLM              | Google Gemini Flash (hot path) / Pro (off path) |
| Maps             | Google Maps — Distance Matrix + Static Maps     |
| Auth             | JWT HS256 (email + password)                    |
| Containerization | Docker + docker-compose                         |
| Logger           | Winston + nest-winston + daily-rotate-file      |
| Validation       | class-validator + class-transformer             |
| Docs             | Swagger / OpenAPI (`/api/v1/docs`)              |

---

## Local Development

```bash
# 1. Install deps
npm install

# 2. Copy and fill env
cp .env.sample .env

# 3. Start DB only
docker compose up db -d

# 4. Run migrations
npm run migrate:run

# 5. Start dev server (watch mode)
npm run start:dev
```

API base: `http://localhost:3000/api/v1`  
Swagger UI: `http://localhost:3000/api/v1/docs`

---

## Environment Variables

See `.env.sample` for all required variables:

| Variable             | Purpose                          |
|----------------------|----------------------------------|
| `PORT`               | Server port (default 3000)       |
| `NODE_ENV`           | `development` / `production`     |
| `PG_HOST`            | PostgreSQL host                  |
| `PG_PORT`            | PostgreSQL port (default 5432)   |
| `PG_USER`            | PostgreSQL user                  |
| `PG_PASSWORD`        | PostgreSQL password              |
| `PG_DATABASE`        | PostgreSQL database name         |
| `JWT_SECRET`         | HS256 signing secret             |
| `JWT_EXPIRES_IN`     | Token TTL (e.g. `7d`, `24h`)    |
| `GEMINI_API_KEY`     | Google Gemini API key            |
| `GOOGLE_MAPS_API_KEY`| Google Maps API key              |

---

## Source Structure

```
src/
├── main.ts               # Bootstrap, Swagger, global prefix
├── app.module.ts         # Root module
├── common/               # Shared filters, guards, interceptors, decorators
└── modules/
    ├── authentication/   # JWT auth, register, login, role guards
    ├── users/            # User profile CRUD
    └── index.ts
```

> See `agents.md` for the full agent pipeline documentation.

---

## Migration Commands

```bash
# Generate migration from entity changes
PG_HOST=localhost npm run migrate:generate -- database/migrations/MigrationName

# Create empty migration
PG_HOST=localhost npm run migrate:create -- database/migrations/EmptyMigrationName

# Apply pending migrations
npm run migrate:run

# Revert last migration
npm run migrate:revert

# Drop schema (DESTRUCTIVE)
npm run schema:drop
```

---

## Coding Conventions

- **Language**: TypeScript strict mode
- **Formatting**: Prettier (`.prettierrc`)
- **Linting**: ESLint with TypeScript rules
- **Module pattern**: Feature modules with `module / controller / service / dto / entity` structure
- **DTOs**: Always use `class-validator` decorators; never accept raw `any`
- **Swagger**: Annotate every endpoint with `@ApiOperation`, `@ApiResponse`, and `@ApiBearerAuth` where applicable
- **Guards**: Use `@UseGuards(JwtAuthGuard)` + custom `@Roles()` decorator for protected routes
- **No `console.log`**: Use the injected `Logger` from `@nestjs/common` or Winston

---

## Key Files

| File                        | Purpose                                  |
|-----------------------------|------------------------------------------|
| `src/main.ts`               | App bootstrap, Swagger, CORS, prefix     |
| `src/app.module.ts`         | Root module composition                  |
| `database/data-source.ts`   | TypeORM DataSource for CLI migrations    |
| `docker-compose.yml`        | PostgreSQL + API services                |
| `Dockerfile`                | Multi-stage production image             |
| `.env.sample`               | Environment variable template            |
