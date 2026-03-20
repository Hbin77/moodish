# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Moodish (무디시) — a mood-based AI recipe recommendation service. Users input their current mood/situation, and AI generates personalized recipe recommendations with empathetic messages. Personalization factors include season, time of day, age, gender, and dietary restrictions.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript
- **Backend**: FastAPI (Python), Uvicorn
- **AI**: OpenAI GPT-4o-mini — recipe selection + empathetic message generation
- **Recipe APIs**: Korean 공공데이터포털, Spoonacular, TheMealDB
- **Databases**: PostgreSQL (user data via asyncpg), SQLite (recipe book via aiosqlite)
- **Auth**: JWT (PyJWT), bcrypt, Kakao OAuth, Google OAuth
- **Bot protection**: Cloudflare Turnstile
- **Deployment**: Docker Compose (postgres + backend + frontend containers)

## Repository Structure

```
moodish/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app, lifespan startup, CORS
│   │   ├── database.py           # SQLite (recipe book) connection
│   │   ├── routers/
│   │   │   ├── recipe.py         # POST /api/recipe
│   │   │   ├── recipebook.py     # GET /api/recipebook/recipes, /api/recipebook/collect
│   │   │   └── auth.py           # /api/auth/* endpoints
│   │   ├── services/
│   │   │   ├── openai_service.py       # GPT-4o-mini recipe selection + messages
│   │   │   ├── recipe_collector.py     # Populates SQLite from all 3 APIs on startup
│   │   │   ├── recipe_aggregator.py    # Merges results from all 3 APIs
│   │   │   ├── korean_recipe_api.py    # 공공데이터포털 client
│   │   │   ├── spoonacular_api.py      # Spoonacular client
│   │   │   └── themealdb_api.py        # TheMealDB client
│   │   ├── auth/
│   │   │   ├── models.py         # PostgreSQL user table init, asyncpg pool
│   │   │   ├── dependencies.py   # get_current_user, require_user
│   │   │   ├── jwt_utils.py      # create_token, decode_token
│   │   │   ├── oauth.py          # kakao_get_user, google_get_user
│   │   │   ├── turnstile.py      # Cloudflare Turnstile verification
│   │   │   └── schemas.py        # Pydantic auth schemas
│   │   └── schemas/
│   │       └── recipe.py         # RecipeRequest, RecipeResponse
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/app/
│       ├── page.tsx              # / Landing
│       ├── mood/page.tsx         # /mood  Mood input form
│       ├── result/page.tsx       # /result Recipe result card
│       ├── recipes/page.tsx      # /recipes Recipe book browser
│       ├── login/page.tsx        # /login
│       ├── profile/page.tsx      # /profile
│       ├── auth/kakao/callback/  # Kakao OAuth callback
│       └── auth/google/callback/ # Google OAuth callback
└── docker-compose.yml
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/recipe` | optional | Generate recipe from mood (uses profile if logged in) |
| GET | `/api/health` | — | Health check |
| GET | `/api/recipebook/recipes` | — | List recipes (page, limit, category, search, source) |
| POST | `/api/recipebook/collect` | — | Trigger recipe collection from external APIs |
| POST | `/api/auth/register` | — | Email/password registration (Turnstile required) |
| POST | `/api/auth/login` | — | Email/password login (Turnstile required) |
| POST | `/api/auth/oauth/kakao` | — | Kakao OAuth token exchange |
| POST | `/api/auth/oauth/google` | — | Google OAuth token exchange |
| GET | `/api/auth/me` | required | Get current user profile |
| PUT | `/api/auth/me` | required | Update profile (age, gender, dietary) |

## Data Model

**PostgreSQL** — `users` table: `id`, `email`, `name`, `password_hash`, `age`, `gender`, `dietary`, `provider`, `provider_id`

**SQLite** (`/app/data/recipes.db`) — `recipes` table: `id`, `name`, `ingredients`, `steps`, `category`, `source`, `image_url`, `substitutes`, `korean_terms`

On startup, if the SQLite recipe DB is empty, the backend automatically collects recipes from all three external APIs.

## Environment Variables

Copy `backend/.env.example` to `backend/.env`:

```
OPENAI_API_KEY=
KOREAN_RECIPE_API_KEY=        # 공공데이터포털
SPOONACULAR_API_KEY=
ALLOWED_ORIGINS=http://frontend:3000
POSTGRES_PASSWORD=
JWT_SECRET=
KAKAO_REST_API_KEY=
KAKAO_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Docker Compose also reads these from `backend/.env` and accepts `KAKAO_JS_KEY` and `TURNSTILE_SITE_KEY` at the root level for the frontend build args.

## Running the Project

**Docker (recommended):**
```bash
docker compose up --build
# Frontend available at http://localhost:3091
```

**Local development:**
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev   # http://localhost:3000
```

## Language

UI and recipe content are in **Korean** (한국어). Code, comments, and API interfaces use **English**.
