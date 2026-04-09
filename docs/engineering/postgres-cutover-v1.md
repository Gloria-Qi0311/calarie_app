# Postgres Cutover v1

## Purpose
This document is the practical checklist for switching the app from:
- local frontend + mock API

to:
- remote frontend + Postgres/Supabase-backed API

It is meant to be followed in order.

## What Must Already Exist
These parts are already in the repo:
- frontend remote adapter
- mock API server
- server repository split
- Postgres repository first pass
- Supabase/Postgres schema migration

Relevant files:
- [app-client.ts](/Users/antaresyuan/calorie-app/calarie_app/Caloriedecisionsupportapp/src/lib/app-client.ts)
- [remote-adapter.ts](/Users/antaresyuan/calorie-app/calarie_app/Caloriedecisionsupportapp/src/lib/api/remote-adapter.ts)
- [index.mjs](/Users/antaresyuan/calorie-app/calarie_app/server/index.mjs)
- [postgres-repository.mjs](/Users/antaresyuan/calorie-app/calarie_app/server/lib/postgres-repository.mjs)
- [20260327_000001_init.sql](/Users/antaresyuan/calorie-app/calarie_app/supabase/migrations/20260327_000001_init.sql)

## Step 1. Create Supabase Project
Create a Supabase project and collect:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

You will also need:
- a real `auth.users.id` for one test user

We currently pass that test user in as:
- `CALORIE_APP_USER_ID`

## Step 2. Apply Migration
Apply:
- [20260327_000001_init.sql](/Users/antaresyuan/calorie-app/calarie_app/supabase/migrations/20260327_000001_init.sql)

Goal:
- all core tables exist
- RLS exists
- indexes and triggers exist

## Step 3. Seed One Test User
You need one real test user in Supabase Auth.

Then make sure there is a matching row in:
- `public.profiles`

The fastest path is:
```bash
npm run api:bootstrap:postgres
```

Optional bootstrap env values:
```bash
CALORIE_APP_BOOTSTRAP_NAME=Ava
CALORIE_APP_BOOTSTRAP_AGE=28
CALORIE_APP_BOOTSTRAP_SEX=female
CALORIE_APP_BOOTSTRAP_CURRENT_WEIGHT_KG=68
CALORIE_APP_BOOTSTRAP_GOAL_WEIGHT_KG=62
CALORIE_APP_BOOTSTRAP_TIMEZONE=America/Los_Angeles
```

The bootstrap script will upsert one profile row for:
- `CALORIE_APP_USER_ID`

At minimum that row should include:
- `user_id`
- `name`
- `timezone`
- enough setup fields to derive or store a target

## Step 4. Configure Server Env
Copy:
- [.env.server.example](/Users/antaresyuan/calorie-app/calarie_app/.env.server.example)

Set:
```bash
PORT=8787
CALORIE_APP_REPOSITORY=postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CALORIE_APP_USER_ID=your-test-auth-user-id
# Optional for local integration before auth/session is fully wired:
CALORIE_APP_ALLOW_USER_OVERRIDE=1
# Optional dev-only bearer parsing for Authorization: Bearer dev-user:<id>
# CALORIE_APP_ENABLE_DEV_BEARER_AUTH=1
```

## Step 5. Run Preflight
Run:
```bash
npm run api:preflight:postgres
```

Expected result:
- repository = `postgres`
- all required flags show `true`
- preflight ends with `Preflight: ready`

If not, fix env before moving on.

For a real connectivity check after env is set:
```bash
npm run api:preflight:postgres:live
```

Expected result:
- live probe returns `ok: true`
- status is successful against Supabase REST
- preflight still ends with `Preflight: ready`

For a stricter cutover check:
```bash
npm run api:preflight:postgres:deep
```

Expected result:
- live probe returns `ok: true`
- required tables are individually marked `ok: true`
- `profile_row_for_configured_user` is `ok: true`

If the deep check fails only on `profile_row_for_configured_user`, run:
```bash
npm run api:bootstrap:postgres
```

## Step 6. Start API In Postgres Mode
Run:
```bash
npm run api:dev:postgres
```

Then check:
```bash
curl -s http://127.0.0.1:8787/api/health
```

Expected:
- `repository: "postgres"`
- `mode: "postgres-server"`

## Step 7. Check Core Endpoints
Verify:
- `GET /api/profile`
- `GET /api/today`
- `GET /api/history?days=7`
- `GET /api/summary/diagnostics`

These are the first endpoints that must work before doing richer UI validation.

If needed, you can manually force summary regeneration with:
```bash
npm run api:recompute:postgres
```

If you want quick demo data for Today / History / Quick Log after the profile exists, run:
```bash
npm run api:seed:postgres
```

Or do the full setup in one step:
```bash
npm run api:prepare:postgres
```

And for a one-command server + smoke validation after env is ready:
```bash
npm run api:validate:postgres
```

## Step 8. Switch Frontend To Remote Mode
Copy:
- [Caloriedecisionsupportapp/.env.remote.example](/Users/antaresyuan/calorie-app/calarie_app/Caloriedecisionsupportapp/.env.remote.example)

Set:
```bash
VITE_APP_DATA_MODE=remote
VITE_API_BASE_URL=http://127.0.0.1:8787/api
# Optional request-scoped test user:
# VITE_APP_REMOTE_USER_ID=your-test-auth-user-id
# Optional dev bearer token if CALORIE_APP_ENABLE_DEV_BEARER_AUTH=1 on the server:
# VITE_APP_REMOTE_BEARER_TOKEN=dev-user:your-test-auth-user-id
```

Run:
```bash
npm run app:dev:remote
```

or for build-only validation:
```bash
npm run app:build:remote
```

## Step 9. Product Validation Pass
Once remote mode is on, verify these flows:
- welcome -> auth -> setup
- Today loads real remote data
- History loads remote summaries
- Settings saves profile changes remotely
- Quick log creates intake remotely
- Exercise log creates exercise remotely
- edit / delete / undo still work

## Current Known Gaps
These are still expected after first cutover:
- Postgres mode can now work with a configured default user, request header override, or dev bearer override, but it is still not true Supabase session ownership
- server auth/session ownership is not fully wired yet
- `daily_summaries` is now recomputed and upserted on write paths, but Today/History still allow service-layer fallback derivation when cache rows are missing
- undo dismissal is still lighter than a full persisted undo state machine

## Definition Of Success
We can call the first database cutover successful when:
- server preflight is green
- API runs in `postgres` mode
- frontend runs in `remote` mode
- Today / History / Settings / Quick Log work without local storage as source of truth

## Current Summary Ownership
Right now the backend has a hybrid-but-tightening summary model:
- write paths recompute and upsert `daily_summaries`
- Postgres reads also check whether any entry dates are missing summary rows and backfill them
- Today / History prefer `daily_summaries` rows first
- service-layer derivation still exists as a safety fallback, but it is no longer the primary path
