# fitty 🍑

A calorie tracking app with Mochi, your personal nutrition companion. Built with React + Vite (frontend) and Node.js + Supabase (backend).

**Live demo:** https://fitty-nu.vercel.app/

---

## Features

- **Mochi companion** — animated character that reacts to your daily progress
- **Food logging** — search from a built-in food database or log custom entries
- **Daily summary** — calorie ring, remaining calories, meal breakdown
- **Weekly progress** — bar chart of the past 7 days
- **Onboarding** — set your name and daily calorie goal
- **Settings** — update profile, calorie target, and preferences

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| Backend | Node.js (ESM) |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel (frontend) + Railway (backend) |

## Project structure

```
calarie_app/
├── Caloriedecisionsupportapp/   # React frontend
│   └── src/app/components/
│       ├── Home.tsx
│       ├── FoodLog.tsx
│       ├── Progress.tsx
│       ├── Settings.tsx
│       ├── Onboarding.tsx
│       ├── Mochi.tsx
│       └── Nav.tsx
├── server/                      # Node.js API
│   └── index.mjs
└── .env.server                  # Backend env vars (not committed)
```

## Local development

### Backend

1. Copy `.env.server.example` to `.env.server` and fill in your Supabase credentials
2. Start the API:
```bash
npm run api:dev:postgres
```
The server runs on `http://localhost:8787`.

### Frontend

```bash
cd Caloriedecisionsupportapp
npm install
npm run dev:remote
```

The app runs on `http://localhost:5173`.

## Environment variables

Create `.env.server` in the project root:

```
CALORIE_APP_REPOSITORY=postgres
CALORIE_APP_DATABASE_URL=your_supabase_connection_string
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CALORIE_APP_ALLOW_USER_OVERRIDE=1
```
