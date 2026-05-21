# Antigravity — Coding Rules for QuickFix API

These are the **non-negotiable rules** Antigravity must follow when working on this codebase.
Read this file before making any code changes.

---

## 1. Language & Types

- All code is **TypeScript strict mode** — never use `any`, use `unknown` if truly needed
- All API inputs must be typed via **DTO classes** with `class-validator` decorators
- All API outputs must be typed; never return raw TypeORM entities directly — use response DTOs or serialization

## 2. NestJS Patterns

- Follow **feature module** structure: each module has its own `module.ts`, `controller.ts`, `service.ts`, `dto/`, `entities/`
- Use `@Injectable()` services — no business logic in controllers
- Use `@UseGuards(JwtAuthGuard)` for all protected routes
- Use the `@Roles()` custom decorator + `RolesGuard` for role-based access
- Import shared utilities from `src/common/` — do not duplicate guards/filters/decorators

## 3. Database

- Use **TypeORM** for all DB interactions — no raw SQL unless absolutely necessary
- All schema changes must be done via **migrations** — never use `synchronize: true` in production
- Migration naming convention: `PascalCase` description, e.g. `AddProviderRatingColumn`

## 4. Logging

- **Never use `console.log`** — use NestJS `Logger` from `@nestjs/common` or inject Winston
- Use log levels correctly: `log()` for info, `warn()` for warnings, `error()` for errors

## 5. Error Handling

- All exceptions go through the global `AllExceptionsFilter` in `src/common/`
- Throw NestJS built-in exceptions (`NotFoundException`, `BadRequestException`, etc.) — not raw `Error`
- Use `@hapi/boom` where HTTP semantics need to be precise

## 6. Swagger / OpenAPI

- **Every endpoint** must have: `@ApiOperation({ summary: '...' })`, `@ApiResponse(...)`, and `@ApiBearerAuth()` if protected
- DTO properties must have `@ApiProperty()` decorators with descriptions and examples
- Swagger is only enabled in non-production environments (see `main.ts`)

## 7. Environment

- All config is accessed via NestJS `ConfigService` — never read `process.env` directly in services
- New env variables must be added to `.env.sample` with a comment explaining their purpose
- Sensitive secrets (API keys, passwords) must never be hardcoded

## 8. Testing

- Unit tests go in the same module directory as `*.spec.ts` files
- E2E tests go in the `test/` directory
- Always mock external dependencies (Gemini, Maps, DB) in unit tests

## 9. Formatting

- Run `npm run format` before committing
- Run `npm run lint` to check for linting issues
- Follow `.prettierrc` config — tabs: 4 spaces, single quotes, trailing commas

## 10. Git

- Commit messages: conventional commits format — `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`
- Never commit `.env` — it is gitignored
- Keep migrations and entity changes in the same commit
