# Commands Reference — QuickFix API

This document provides a single source of truth for all commands used during development, database management, testing, and deployment of the QuickFix API.

---

## 1. Local Development Commands

These commands are used to install, configure, and start the application locally.

| Command | Description |
|---|---|
| `npm install` | Install all project dependencies defined in `package.json` |
| `cp .env.sample .env` | Create local environment configuration file from template |
| `npm run start` | Start the NestJS application in standard production-like mode |
| `npm run start:dev` | Start the application in **watch mode** (auto-reloads on file changes) |
| `npm run start:debug` | Start the application in debug mode with watch enabled |
| `npm run build` | Compile the TypeScript code into production-ready JavaScript in the `dist/` directory |

---

## 2. Docker & Environment Commands

QuickFix uses Docker for isolated database and application running.

| Command | Description |
|---|---|
| `docker compose up --build` | Build the NestJS API container and start both Postgres and the API server |
| `docker compose up db -d` | Start **only** the PostgreSQL database service in the background (detached mode) |
| `docker compose down` | Stop and remove all running project containers and networks |
| `docker compose logs -f` | Follow the logs of all running containers in real-time |

---

## 3. TypeORM Database & Migration Commands

All database changes must be executed using TypeORM CLI migrations. **Never use `synchronize: true` in production.**

> [!NOTE]
> For commands that connect to the database, prefixing with `PG_HOST=localhost` ensures the migration CLI connects to the local Docker database container from your host machine.

| Command | Description |
|---|---|
| `PG_HOST=localhost npm run migrate:generate -- database/migrations/MigrationName` | Automatically generates a new migration by comparing TypeORM entity classes against the current DB schema |
| `PG_HOST=localhost npm run migrate:create -- database/migrations/MigrationName` | Creates a new blank migration file for manual scripting (e.g. data seeding) |
| `PG_HOST=localhost npm run migrate:run` | Runs all pending database migrations |
| `PG_HOST=localhost npm run migrate:revert` | Reverts the very last executed migration |
| `PG_HOST=localhost npm run schema:drop` | **WARNING:** Drops all database tables. Destroys all schema and data |

---

## 4. Code Quality & Formatting Commands

Ensure these are run before commits and pull requests to adhere to strict code rules.

| Command | Description |
|---|---|
| `npm run lint` | Run ESLint to analyze static code, finding syntax/stylistic violations and auto-fixing where possible |
| `npm run format` | Run Prettier to format all TypeScript source files according to `.prettierrc` specifications |

---

## 5. Testing Commands

QuickFix includes both unit tests and End-to-End (E2E) integration tests.

| Command | Description |
|---|---|
| `npm run test` | Run all unit tests (`*.spec.ts`) |
| `npm run test:watch` | Run unit tests in watch/interactive mode |
| `npm run test:cov` | Run unit tests and generate a code coverage report |
| `npm run test:e2e` | Run End-to-End integration tests located in the `test/` directory |
| `npm run test:debug` | Debug unit tests utilizing node inspector |
