# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Moodish (무디시) — a mood-based AI recipe recommendation service. Users input their current mood/situation, and AI generates personalized Korean recipes with empathetic messages. Records accumulate into an emotion-food pattern diary.

## Tech Stack

- **Frontend**: Next.js (App Router) — SSR + static generation
- **Backend**: FastAPI (Python)
- **AI**: OpenAI API (GPT-4o / GPT-4o-mini) — recipe generation + empathetic messages
- **Database**: PostgreSQL
- **Cache**: Redis
- **Storage**: Cloudflare R2 or AWS S3 (recipe card images)
- **Deployment**: Cloudflare (Pages + Workers)
- **Auth**: Kakao + Google OAuth 2.0

## Architecture

The service follows a decoupled frontend/backend architecture:
- Next.js frontend communicates with FastAPI backend via REST API
- FastAPI handles business logic and proxies OpenAI API calls
- AI calls use streaming responses — empathetic message (reaction) displays first while recipe loads
- Reaction and recipe generation can be parallelized for lower latency

## Data Model

Four core tables: `users`, `mood_logs` (mood emoji/text + context JSON), `recipes` (structured recipe data linked to mood_log), `diary_entries` (user's saved records with optional photo).

## Development Phases

- **Phase 1 (MVP)**: Mood input → AI recipe → result card → SNS share (no auth)
- **Phase 2**: Login + food diary + history
- **Phase 3**: Pattern analysis + premium + SEO + commerce integration

## Language

- UI and recipe content are in **Korean** (한국어)
- Code, comments, and API interfaces should use **English**
