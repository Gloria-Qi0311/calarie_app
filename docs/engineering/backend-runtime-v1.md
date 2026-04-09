# Backend Runtime v1

## Purpose
This doc explains the current backend runtime structure in the repo.

The app is not fully backend-complete yet, but the server is now organized so we can swap data backends without rewriting API routes.

## Current Runtime Layers

### 1. HTTP Layer
File:
- [server/index.mjs](/Users/antaresyuan/calorie-app/calarie_app/server/index.mjs)

Responsibilities:
- receive requests
- match routes
- parse bodies
- return JSON / 204 responses

This layer should stay thin.

### 2. App Service Layer
File:
- [app-service.mjs](/Users/antaresyuan/calorie-app/calarie_app/server/lib/app-service.mjs)

Responsibilities:
- shape API responses
- coordinate repository reads/writes
- keep route handlers simple

This is where endpoint-level product logic belongs.

### 3. Repository Layer
Files:
- [repository.mjs](/Users/antaresyuan/calorie-app/calarie_app/server/lib/repository.mjs)
- [mock-repository.mjs](/Users/antaresyuan/calorie-app/calarie_app/server/lib/mock-repository.mjs)
- [postgres-repository.mjs](/Users/antaresyuan/calorie-app/calarie_app/server/lib/postgres-repository.mjs)

Responsibilities:
- decide which storage backend is active
- isolate persistence concerns
- make future Postgres integration replaceable

Current modes:
- `mock`
- `postgres`

### 4. Shared Server Domain Logic
File:
- [domain.mjs](/Users/antaresyuan/calorie-app/calarie_app/server/lib/domain.mjs)

Responsibilities:
- calorie target estimation
- summary building
- companion progress derivation
- pattern shortcut derivation
- recommendation selection

## Current State
- `mock` mode is implemented and works
- `postgres` mode now has a first Supabase REST-backed implementation path
- the DB schema and migration exist
- `daily_summaries` is now recomputed in mock mode and on Postgres write paths
- Today and History now prefer cached summaries, and Postgres mode will backfill missing summary rows for existing entry dates before returning data
- meal pattern shortcuts are now maintained in mock mode and are being moved toward persisted Postgres ownership
- current Today / History / event date handling now prefers the profile timezone instead of server-local time
- Postgres mode still needs real environment configuration and live verification against a real Supabase project
- undo clearing is still UI-only in Postgres mode, while restore is implemented via soft-delete reversal

## Environment Variables
- `PORT`
- `CALORIE_APP_REPOSITORY=mock|postgres`
- `CALORIE_APP_ALLOW_USER_OVERRIDE=1`
- `CALORIE_APP_ENABLE_DEV_BEARER_AUTH=1`
- `CALORIE_APP_DATA_FILE=/path/to/mock-db.json`
- `CALORIE_APP_DATABASE_URL=postgres://...`
- `SUPABASE_DB_URL=postgres://...`
- `SUPABASE_URL=https://your-project.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `CALORIE_APP_USER_ID=...`
- `CALORIE_APP_TARGET_USER_ID=...`
- `CALORIE_APP_SMOKE_USER_ID=...`
- `CALORIE_APP_SMOKE_BEARER_TOKEN=dev-user:...`

Server env example:
- [.env.server.example](/Users/antaresyuan/calorie-app/calarie_app/.env.server.example)

Useful commands:
- `npm run api:dev`
- `npm run api:dev:mock`
- `npm run api:dev:postgres`
- `npm run api:preflight`
- `npm run api:preflight:postgres`
- `npm run api:preflight:postgres:live`
- `npm run api:preflight:postgres:deep`
- `npm run api:bootstrap:postgres`
- `npm run api:seed`
- `npm run api:seed:postgres`
- `npm run api:prepare`
- `npm run api:prepare:postgres`
- `npm run api:validate`
- `npm run api:validate:postgres`
- `npm run api:recompute`
- `npm run api:recompute:postgres`
- `npm run api:recompute:patterns`
- `npm run api:recompute:patterns:postgres`
- `npm run api:smoke`
- `npm run app:dev:remote`
- `npm run app:build:remote`

Cutover checklist:
- [postgres-cutover-v1.md](/Users/antaresyuan/calorie-app/calarie_app/docs/engineering/postgres-cutover-v1.md)

## Recommended Next Step
Validate Postgres mode against a real Supabase project and then tighten:
- timezone-at-log writes using profile timezone
- undo dismissal semantics in backend state
- richer `daily_summaries` read/write ownership so service fallback becomes unnecessary
- Supabase-backed auth/session ownership instead of the current development-only user resolution helpers

## Diagnostics
The API now includes:
- `X-Request-Id` on responses
- per-request structured logs
- health diagnostics via `GET /api/health`
- session/user-source diagnostics via `GET /api/session`
- summary coverage via `GET /api/summary/diagnostics`
- manual summary recompute via `POST /api/summary/recompute`
- quick logging data via `GET /api/logging/quick`
- pattern coverage via `GET /api/patterns/diagnostics`
- manual pattern recompute via `POST /api/patterns/recompute`
- a smoke script for core endpoints
- live repository probing for Postgres/Supabase preflight
- deep probing for required tables and configured profile presence
- a bootstrap helper for creating the configured test profile row in Postgres mode
- preflight hints that point to either migration or bootstrap next actions

Summary diagnostics now report:
- `missingDates`
- `extraDates`
- `staleTargetDates`

This makes it easier to tell whether summary rows exist but were generated against an older calorie target.
Current recompute behavior also removes extra summary rows for dates that no longer have any intake or exercise entries.

Quick logging behavior now prefers repository-owned `patternShortcuts` when available, and only falls back to deriving them from entries if needed.
Pattern diagnostics now report:
- `missingKeys`
- `extraKeys`
- `staleKeys`

This makes it easier to tell whether persisted shortcuts are missing, stale, or no longer supported by current intake history.

## One-Step Demo Preparation
For local/mock mode and for future Postgres cutover, the repo now supports a one-step preparation flow:
- `npm run api:prepare`
- `npm run api:prepare:postgres`

This command will:
- create/update the demo profile if needed
- seed sample meals and exercises if none exist
- recompute daily summaries
- recompute pattern shortcuts

For an end-to-end local verification pass, use:
- `npm run api:validate`
- `npm run api:validate:postgres`

This will:
- start the API server
- wait for health
- run the smoke endpoint set
- stop the server automatically

## Request-Scoped Test Users
The backend now supports request-scoped test users through:
- `X-Calorie-App-User-Id`
- `Authorization: Bearer dev-user:<user-id>` when `CALORIE_APP_ENABLE_DEV_BEARER_AUTH=1`

This is meant for local/remote integration before full auth wiring is complete.

Current behavior:
- mock mode uses a separate JSON file per effective user id
- postgres mode uses the effective user id as the repository user anchor
- `GET /api/session` and `GET /api/health` report `effectiveUserId`
- `GET /api/session` and `GET /api/health` also report `auth.source`, `allowUserOverride`, and `devBearerEnabled`
- scripts can target a specific user through `CALORIE_APP_TARGET_USER_ID`
- the smoke script supports `CALORIE_APP_SMOKE_USER_ID`
- the smoke and validate scripts also support `CALORIE_APP_SMOKE_BEARER_TOKEN`
- the remote frontend adapter supports `VITE_APP_REMOTE_USER_ID`
- the remote frontend adapter also supports `VITE_APP_REMOTE_BEARER_TOKEN`
