# Docker & Deployment — QuickFix API

---

## docker-compose Services

```yaml
services:
  db:        # PostgreSQL 16 — local dev database
  api:       # NestJS application
```

### Start everything

```bash
docker compose up --build
```

This:
1. Builds the NestJS image from `Dockerfile`
2. Starts PostgreSQL
3. Runs migrations via `entrypoint.sh`
4. Starts the API server

### Start only the database (for local dev)

```bash
docker compose up db -d
```

Then run the API locally:
```bash
npm run start:dev
```

---

## Dockerfile

Multi-stage build:

1. **Build stage**: installs all deps, compiles TypeScript → `dist/`
2. **Production stage**: copies only `dist/` + production `node_modules`, runs as non-root user

---

## entrypoint.sh

Runs on container start:
1. Waits for PostgreSQL to be ready
2. Runs `npm run migrate:run`
3. Starts the API (`npm run start:prod`)

---

## Environment Files

| File           | Purpose                                  |
|----------------|------------------------------------------|
| `.env`         | Local dev secrets (gitignored)           |
| `.env.sample`  | Template — commit this, not `.env`       |
| `.dockerignore`| Excludes `node_modules`, `.env`, etc.    |

---

## Ports

| Service    | Internal Port | Host Port |
|------------|---------------|-----------|
| API        | 3000          | 3000      |
| PostgreSQL | 5432          | 5432      |

---

## Production Checklist

- [ ] Set `NODE_ENV=production` (disables Swagger)
- [ ] Set strong `JWT_SECRET`
- [ ] Set `PG_HOST` to the actual DB host (not `localhost`)
- [ ] Ensure all migrations have run
- [ ] Logs directory is persisted via volume mount
