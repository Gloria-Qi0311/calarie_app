# Schema v1

## Purpose
This document defines the first real database shape for the companion-led calorie balance tracker.

The current product still runs on local storage and a mock API server, but the next backend step should target a Postgres database, ideally via Supabase.

This schema is designed to support:
- auth-backed users
- progressive setup
- food and exercise logging
- undo via soft delete
- daily summary recompute
- basic pattern shortcuts
- analytics and experiment measurement

## Recommended Database
- `Postgres`
- Best fit for this repo: `Supabase Postgres + Supabase Auth`

Why:
- relational data fits the product well
- easy to query summaries and history
- good path for auth + row isolation
- supports JSON payloads for analytics
- can grow into more advanced analytics and personalization later

## Design Principles
- `auth.users.id` is the user identity anchor
- source-of-truth entries should be stored row by row
- derived objects like daily summaries and meal patterns should be rebuildable
- setup should be skippable, so profile fields must allow partial completion
- delete/undo should not physically destroy data in MVP
- analytics should support both pre-auth and post-auth events

## Core Tables

### `public.profiles`
One row per authenticated user.

Responsibilities:
- personalization inputs
- target baseline
- timezone
- lightweight plan metadata

Important notes:
- `age`, `sex`, `current_weight_kg`, and `goal_weight_kg` can be null for skipped setup users
- `daily_calorie_target` can be null if setup is incomplete
- `goal_direction` can also be null before plan creation

### `public.intake_entries`
One row per logged food item.

Responsibilities:
- meal-level logging
- preserves source and local day
- supports edit/delete/undo via soft delete

Important notes:
- `deleted_at_utc` is nullable and used for undo
- `local_date` is stored explicitly so history remains timezone-safe

### `public.exercise_entries`
One row per logged exercise item.

Responsibilities:
- manual quick-add exercise tracking
- preserved separately from food logs
- same soft-delete pattern as intake entries

### `public.daily_summaries`
Derived cache table for Today and History.

Responsibilities:
- fast reads for Today and History
- stores daily rolled-up values
- can be recomputed from intake/exercise entries

Important notes:
- not the primary source of truth
- should be rebuilt whenever entries are created, edited, deleted, restored, or moved across dates

### `public.meal_pattern_shortcuts`
Derived or cached shortcut suggestions for repeated meals.

Responsibilities:
- store repeat detection outputs
- speed up quick-log UX
- support refresh/rebuild jobs later

Important notes:
- this table can always be regenerated from non-deleted intake entries

### `public.analytics_events`
Event log for product and experiment measurement.

Responsibilities:
- welcome/auth/setup/product usage events
- support anonymous pre-auth tracking
- support post-auth user-linked events

Important notes:
- `user_id` is nullable
- `anonymous_id` is used before auth and can continue after auth if needed
- payload lives in `jsonb`

## Optional Early Tables

### `public.user_experiment_assignments`
Useful if experiment assignment should become backend-owned rather than only frontend-deterministic.

### `public.companion_progress_snapshots`
Not required for MVP if companion state is derived on read, but can be added later if long-term progression needs stable persistence.

## Undo Strategy
MVP recommendation:
- use `deleted_at_utc` on intake and exercise entries
- “delete” means soft delete
- “undo” means set `deleted_at_utc` back to null for the last eligible row

Benefits:
- simple
- auditable
- recompute-safe
- avoids accidental permanent loss

## Recompute Strategy
`daily_summaries` should be rebuilt from:
- non-deleted `intake_entries`
- non-deleted `exercise_entries`

Recompute triggers:
- intake create/update/delete/undo
- exercise create/update/delete/undo
- profile target update if target affects summary display
- edits that change `local_date`

## Timezone Rules
- store `logged_at_utc` for the true event timestamp
- store `timezone_at_log` to preserve interpretation context
- store `local_date` so the app can query daily history without re-guessing client timezone later
- `profiles.timezone` is the default timezone for new entries and summary computation

## Planned MVP Table Set
Recommended first real migration:
1. `profiles`
2. `intake_entries`
3. `exercise_entries`
4. `daily_summaries`
5. `meal_pattern_shortcuts`
6. `analytics_events`
7. `user_experiment_assignments`

## Contract Alignment
These tables back the current API contract:
- `GET /api/profile` -> `profiles`, `analytics_events`, `user_experiment_assignments`
- `GET /api/today` -> `profiles`, `intake_entries`, `exercise_entries`, `daily_summaries`
- `GET /api/history` -> `daily_summaries`
- `GET /api/recommendations` -> `profiles`, `daily_summaries`
- `GET /api/logging/quick` -> `meal_pattern_shortcuts`
- `POST/PATCH/DELETE /api/intake` -> `intake_entries`
- `POST/PATCH/DELETE /api/exercise` -> `exercise_entries`

## Next Step
The executable SQL version of this schema lives in:
- [20260327_000001_init.sql](/Users/antaresyuan/calorie-app/calarie_app/supabase/migrations/20260327_000001_init.sql)
