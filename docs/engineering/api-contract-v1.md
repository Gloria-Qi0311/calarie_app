# API Contract v1

## Purpose
This document defines the first backend-facing contract for the companion-led calorie balance tracker.

The current frontend still runs on a local adapter. These contracts are the shape that the eventual backend should satisfy so the frontend can switch from local persistence to real APIs with minimal UI changes.

## Principles
- The frontend should call one application client layer, not talk to storage directly.
- The backend should become the source of truth for profile, intake, exercise, and summaries.
- Today and History should read derived data from backend-safe contracts, not recompute everything in each screen.
- Setup and settings should write the same profile fields.

## Auth
For MVP, assume session-based or token-based auth exists outside this document.

All endpoints below assume an authenticated user unless marked otherwise.

During local integration before full auth/session wiring is complete, the current server also supports:
- `X-Calorie-App-User-Id`
- `Authorization: Bearer dev-user:<user-id>` when dev bearer auth is enabled

These are development helpers, not the long-term production auth contract.

## Core Resources

### Profile
Represents the user's personalization state and target baseline.

Fields:
- `name`
- `age`
- `sex`
- `currentWeightKg`
- `goalWeightKg`
- `goalDirection`
- `dailyCalorieTarget`
- `timezone`
- `createdAtUtc`
- `updatedAtUtc`

### Intake Entry
Represents one logged food item.

Fields:
- `id`
- `name`
- `calories`
- `mealType`
- `source`
- `loggedAtUtc`
- `localDate`
- `timezoneAtLog`

### Exercise Entry
Represents one logged exercise item.

Fields:
- `id`
- `name`
- `caloriesBurned`
- `source`
- `loggedAtUtc`
- `localDate`
- `timezoneAtLog`

### Daily Summary
Represents one derived day-level summary.

Fields:
- `localDate`
- `totalIntakeCalories`
- `totalExerciseCalories`
- `netCalories`
- `targetCalories`
- `remainingCalories`
- `mealCount`
- `exerciseCount`

## Endpoints

### `GET /api/session`
Returns the currently effective user resolution state for the API process.

Response:
```json
{
  "authenticated": true,
  "effectiveUserId": "00000000-0000-0000-0000-000000000000",
  "mode": "postgres-server",
  "auth": {
    "effectiveUserId": "00000000-0000-0000-0000-000000000000",
    "source": "dev-bearer",
    "allowUserOverride": true,
    "devBearerEnabled": true
  }
}
```

### `GET /api/profile`
Returns the current user's profile.

Response:
```json
{
  "profile": {
    "name": "Ava",
    "age": 28,
    "sex": "female",
    "currentWeightKg": 68,
    "goalWeightKg": 62,
    "goalDirection": "lose",
    "dailyCalorieTarget": 1850,
    "timezone": "America/Los_Angeles",
    "createdAtUtc": "2026-03-27T18:22:00.000Z",
    "updatedAtUtc": "2026-03-27T18:22:00.000Z"
  }
}
```

### `PUT /api/profile`
Updates personalization inputs and returns the rebuilt profile.

Request:
```json
{
  "name": "Ava",
  "age": 28,
  "sex": "female",
  "currentWeightKg": 68,
  "goalWeightKg": 62
}
```

Response:
```json
{
  "profile": {
    "name": "Ava",
    "age": 28,
    "sex": "female",
    "currentWeightKg": 68,
    "goalWeightKg": 62,
    "goalDirection": "lose",
    "dailyCalorieTarget": 1850,
    "timezone": "America/Los_Angeles",
    "createdAtUtc": "2026-03-27T18:22:00.000Z",
    "updatedAtUtc": "2026-03-27T18:35:00.000Z"
  }
}
```

### `GET /api/today`
Returns the Today screen payload in one request.

Response:
```json
{
  "dataSource": "remote-api",
  "profile": {},
  "meals": [],
  "exercises": [],
  "summary": {
    "consumed": 720,
    "exerciseBurned": 180,
    "netCalories": 540,
    "remainingCalories": 1310,
    "percentageUsed": 29.2
  },
  "companion": {
    "interactionCount": 4,
    "loggedDays": 5,
    "onTargetDays": 3,
    "progressState": "ready"
  },
  "experiments": {
    "welcome_mood_copy": "gentle",
    "today_primary_cta": "log_first",
    "recommendation_framing": "balanced"
  },
  "lastDeletedEntry": null
}
```

### `GET /api/history?days=7`
Returns recent daily summaries.

Response:
```json
{
  "dataSource": "remote-api",
  "profile": {},
  "summaries": [
    {
      "localDate": "2026-03-27",
      "totalIntakeCalories": 720,
      "totalExerciseCalories": 180,
      "netCalories": 540,
      "targetCalories": 1850,
      "remainingCalories": 1310,
      "mealCount": 2,
      "exerciseCount": 1
    }
  ]
}
```

### `GET /api/recommendations`
Returns current suggestion payload for the Recommendations page.

Response:
```json
{
  "dataSource": "remote-api",
  "profile": {},
  "remainingCalories": 1310,
  "experiments": {
    "welcome_mood_copy": "gentle",
    "today_primary_cta": "log_first",
    "recommendation_framing": "balanced"
  },
  "suggestions": [
    {
      "name": "Chicken rice bowl",
      "description": "Balanced and filling.",
      "calories": 620,
      "emoji": "🍚"
    }
  ]
}
```

### `GET /api/logging/quick`
Returns quick-log helper data.

Response:
```json
{
  "dataSource": "remote-api",
  "patternShortcuts": [
    {
      "key": "lunch:chicken-salad",
      "label": "Chicken salad",
      "mealType": "lunch",
      "count": 4,
      "averageCalories": 450
    }
  ]
}
```

### `GET /api/summary/diagnostics`
Returns summary cache coverage for the current effective user.

### `POST /api/summary/recompute`
Forces summary recomputation and persistence for the current effective user.

### `GET /api/patterns/diagnostics`
Returns quick-log pattern shortcut coverage for the current effective user.

### `POST /api/patterns/recompute`
Forces pattern shortcut recomputation and persistence for the current effective user.

### `POST /api/intake`
Creates a new intake entry.

Request:
```json
{
  "name": "Chicken salad",
  "calories": 450,
  "mealType": "lunch",
  "source": "quick-add"
}
```

Response:
```json
{
  "entry": {
    "id": "entry_123",
    "name": "Chicken salad",
    "calories": 450,
    "mealType": "lunch",
    "source": "quick-add",
    "loggedAtUtc": "2026-03-27T18:40:00.000Z",
    "localDate": "2026-03-27",
    "timezoneAtLog": "America/Los_Angeles"
  }
}
```

### `PATCH /api/intake/:id`
Updates an intake entry.

Request:
```json
{
  "name": "Chicken salad with avocado",
  "calories": 520
}
```

### `DELETE /api/intake/:id`
Deletes an intake entry and may return undo metadata.

### `POST /api/exercise`
Creates a new exercise entry.

Request:
```json
{
  "name": "Walk",
  "caloriesBurned": 120,
  "source": "quick-add"
}
```

### `PATCH /api/exercise/:id`
Updates an exercise entry.

### `DELETE /api/exercise/:id`
Deletes an exercise entry and may return undo metadata.

### `POST /api/undo`
Restores the most recently deleted entry for the current user if still valid.

Response:
```json
{
  "restored": {
    "kind": "intake",
    "entry": {}
  }
}
```

## Frontend Mapping
The frontend currently routes these through the app client:

- `getDashboardData()` -> `GET /api/today`
- `getSession()` -> `GET /api/session` if/when the frontend wants explicit auth diagnostics
- `getHistoryData(days)` -> `GET /api/history?days=n`
- `getRecommendationsData()` -> `GET /api/recommendations`
- `getQuickLogData()` -> `GET /api/logging/quick`
- `saveSettings(input)` -> `PUT /api/profile`
- `addMeal(input)` -> `POST /api/intake`
- `updateMeal(id, updates)` -> `PATCH /api/intake/:id`
- `deleteMeal(id)` -> `DELETE /api/intake/:id`
- `addExercise(input)` -> `POST /api/exercise`
- `updateExercise(id, updates)` -> `PATCH /api/exercise/:id`
- `deleteExercise(id)` -> `DELETE /api/exercise/:id`
- `restoreLastDeletedEntry()` -> `POST /api/undo`

## Frontend Adapter Modes
The frontend supports two app-data modes:

- `local`
  - Uses the local adapter and browser storage
  - Best for prototype/demo work
- `remote`
  - Uses the remote adapter and calls real backend endpoints
  - Best for backend integration

Environment variables:

- `VITE_APP_DATA_MODE=local|remote`
- `VITE_API_BASE_URL=http://localhost:8787/api`
- `VITE_APP_REMOTE_USER_ID=...`
- `VITE_APP_REMOTE_BEARER_TOKEN=dev-user:...`

Example:
```bash
cp .env.example .env
```
Then set:
```bash
VITE_APP_DATA_MODE=remote
VITE_API_BASE_URL=http://localhost:8787/api
# Optional during local integration:
# VITE_APP_REMOTE_USER_ID=00000000-0000-0000-0000-000000000000
# VITE_APP_REMOTE_BEARER_TOKEN=dev-user:00000000-0000-0000-0000-000000000000
```

Mock API server:
```bash
npm run api:dev
```

Health check:
```bash
curl -s http://127.0.0.1:8787/api/health
```

## Notes
- `Today` should continue to read one aggregated response rather than fanning out into many frontend fetches.
- `History` should come from backend-safe summaries, not random or frontend-only reconstruction long term.
- `recommendations` can remain rule-based in MVP as long as inputs and outputs stay stable.
- The companion is not its own API resource yet; its MVP state is derived from user behavior and included in Today payloads.
