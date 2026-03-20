# Moodish (무디시)

> 기분 기반 AI 요리 추천 서비스 | "오늘 기분, 어떤 맛?"

기분을 알려주면 AI가 당신의 감정에 딱 맞는 한국 가정식 레시피를 추천해주는 서비스입니다.

## Features

- **AI 맞춤 레시피** — 3개 레시피 API에서 후보를 수집하고, GPT-4o-mini가 기분에 맞는 최적의 레시피를 선택
- **개인화 추천** — 계절, 시간대, 나이, 성별, 식이 제한을 종합 고려
- **상세 레시피** — 초보자도 따라할 수 있는 단계별 조리법, 대체 재료 안내
- **레시피 북** — 외부 API에서 수집한 레시피 브라우징 (검색, 카테고리 필터)
- **소셜 로그인** — 카카오, 구글, 이메일 회원가입/로그인
- **공유** — 카카오톡 공유, 레시피 카드 이미지 저장

## Tech Stack

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, TypeScript |
| Backend | FastAPI, Python |
| AI | OpenAI GPT-4o-mini |
| Recipe APIs | 공공데이터포털, Spoonacular, TheMealDB |
| Database | PostgreSQL (사용자), SQLite (레시피 북) |
| Auth | JWT, bcrypt, Kakao OAuth, Google OAuth |
| Bot Protection | Cloudflare Turnstile |
| Deployment | Docker Compose |

## Quick Start

### 1. 환경변수 설정

```bash
cp backend/.env.example backend/.env
# backend/.env에 API 키 입력
```

필수 키:
- `OPENAI_API_KEY` — OpenAI API 키
- `POSTGRES_PASSWORD` — PostgreSQL 비밀번호
- `JWT_SECRET` — JWT 서명 키

선택 키:
- `KOREAN_RECIPE_API_KEY` — 공공데이터포털
- `SPOONACULAR_API_KEY` — Spoonacular
- `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET` — 카카오 로그인
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — 구글 로그인
- `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile

### 2. 실행

```bash
docker compose up -d --build
```

- Frontend: http://localhost:3091
- Backend: http://localhost:8000 (내부)

### 3. 첫 실행

서버가 시작되면 자동으로:
1. PostgreSQL에 사용자 테이블 생성
2. SQLite에 레시피 테이블 생성
3. 3개 외부 API에서 레시피 수집 (DB가 비어있을 경우)

## Architecture

```
사용자 브라우저
    ↓
  Next.js (프론트엔드, :3091)
    ↓ /api/* → rewrites
  FastAPI (백엔드, :8000 내부)
    ├── OpenAI GPT-4o-mini (레시피 선택 + 감성 메시지)
    ├── 공공데이터포털 API (한국 레시피)
    ├── Spoonacular API (글로벌 레시피)
    ├── TheMealDB API (카테고리별 레시피)
    ├── PostgreSQL (사용자 데이터)
    └── SQLite (레시피 북)
```

## Pages

| 경로 | 설명 | 로그인 필수 |
|------|------|:-----------:|
| `/` | 랜딩 페이지 | |
| `/mood` | 기분 입력 | O |
| `/result` | 레시피 결과 | O |
| `/recipes` | 레시피 북 | |
| `/login` | 로그인/회원가입 | |
| `/profile` | 프로필 관리 | O |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/recipe` | 선택 | 기분 기반 레시피 생성 |
| GET | `/api/recipebook/recipes` | - | 레시피 목록 (페이지네이션, 검색, 필터) |
| POST | `/api/recipebook/collect` | - | 외부 API 레시피 수집 트리거 |
| POST | `/api/auth/register` | - | 이메일 회원가입 |
| POST | `/api/auth/login` | - | 이메일 로그인 |
| POST | `/api/auth/kakao` | - | 카카오 OAuth |
| POST | `/api/auth/google` | - | 구글 OAuth |
| GET | `/api/auth/me` | 필수 | 프로필 조회 |
| PUT | `/api/auth/me` | 필수 | 프로필 수정 |

## License

Private project.
