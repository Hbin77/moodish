import logging

import bcrypt
from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import require_user
from app.auth.jwt_utils import create_token
from app.auth.models import get_pool
from app.auth.oauth import google_get_user, kakao_get_user
from app.auth.turnstile import verify_turnstile
from app.auth.schemas import (
    OAuthCallback,
    TokenResponse,
    UserLogin,
    UserProfile,
    UserRegister,
    UserUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth")


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def _user_to_profile(row: dict) -> UserProfile:
    return UserProfile(
        id=row["id"],
        email=row["email"],
        name=row["name"],
        age=row["age"],
        gender=row["gender"],
        dietary=row["dietary"],
        provider=row["provider"],
    )


async def _get_or_create_oauth_user(
    email: str, name: str, provider: str, provider_id: str
) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM users WHERE email = $1", email
        )
        if row:
            return dict(row)

        row = await conn.fetchrow(
            """INSERT INTO users (email, name, provider, provider_id)
               VALUES ($1, $2, $3, $4)
               RETURNING *""",
            email,
            name,
            provider,
            provider_id,
        )
        return dict(row)


@router.post("/register", response_model=TokenResponse)
async def register(body: UserRegister):
    await verify_turnstile(body.turnstile_token)
    pool = await get_pool()
    async with pool.acquire() as conn:
        existing = await conn.fetchrow(
            "SELECT id FROM users WHERE email = $1", body.email
        )
        if existing:
            raise HTTPException(status_code=409, detail="이미 등록된 이메일입니다.")

        row = await conn.fetchrow(
            """INSERT INTO users (email, password_hash, name, age, gender, dietary)
               VALUES ($1, $2, $3, $4, $5, $6)
               RETURNING *""",
            body.email,
            _hash_password(body.password),
            body.name,
            body.age,
            body.gender,
            body.dietary or "",
        )

    user = dict(row)
    token = create_token(user["id"])
    return TokenResponse(access_token=token, user=_user_to_profile(user))


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin):
    await verify_turnstile(body.turnstile_token)
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM users WHERE email = $1", body.email
        )

    if not row or not row["password_hash"]:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    if not _verify_password(body.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    user = dict(row)
    token = create_token(user["id"])
    return TokenResponse(access_token=token, user=_user_to_profile(user))


@router.post("/kakao", response_model=TokenResponse)
async def kakao_login(body: OAuthCallback):
    try:
        info = await kakao_get_user(body.code, body.redirect_uri)
    except Exception:
        logger.exception("Kakao OAuth failed")
        raise HTTPException(status_code=502, detail="카카오 로그인에 실패했습니다.")

    if not info.get("email"):
        raise HTTPException(status_code=400, detail="카카오 계정에 이메일이 없습니다.")

    user = await _get_or_create_oauth_user(
        info["email"], info["name"], "kakao", info["provider_id"]
    )
    token = create_token(user["id"])
    return TokenResponse(access_token=token, user=_user_to_profile(user))


@router.post("/google", response_model=TokenResponse)
async def google_login(body: OAuthCallback):
    try:
        info = await google_get_user(body.code, body.redirect_uri)
    except Exception:
        logger.exception("Google OAuth failed")
        raise HTTPException(status_code=502, detail="구글 로그인에 실패했습니다.")

    if not info.get("email"):
        raise HTTPException(status_code=400, detail="구글 계정에 이메일이 없습니다.")

    user = await _get_or_create_oauth_user(
        info["email"], info["name"], "google", info["provider_id"]
    )
    token = create_token(user["id"])
    return TokenResponse(access_token=token, user=_user_to_profile(user))


@router.get("/me", response_model=UserProfile)
async def get_me(user=Depends(require_user)):
    return _user_to_profile(user)


@router.put("/me", response_model=UserProfile)
async def update_me(body: UserUpdate, user=Depends(require_user)):
    pool = await get_pool()
    fields = []
    values = []
    idx = 1

    for field_name in ("name", "age", "gender", "dietary"):
        value = getattr(body, field_name)
        if value is not None:
            fields.append(f"{field_name} = ${idx}")
            values.append(value)
            idx += 1

    if not fields:
        return _user_to_profile(user)

    fields.append(f"updated_at = NOW()")
    values.append(user["id"])

    query = f"UPDATE users SET {', '.join(fields)} WHERE id = ${idx} RETURNING *"
    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, *values)

    return _user_to_profile(dict(row))
