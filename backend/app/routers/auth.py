import logging
import os
import secrets

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse

from app.auth.dependencies import require_user
from app.auth.email import send_verification_email
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
            "SELECT * FROM users WHERE email = $1 AND provider = $2", email, provider
        )
        if row:
            return dict(row)

        existing = await conn.fetchrow(
            "SELECT * FROM users WHERE email = $1", email
        )
        if existing:
            row = await conn.fetchrow(
                "UPDATE users SET provider = $1, provider_id = $2, email_verified = TRUE WHERE id = $3 RETURNING *",
                provider, provider_id, existing["id"],
            )
            return dict(row)

        row = await conn.fetchrow(
            """INSERT INTO users (email, name, provider, provider_id, email_verified)
               VALUES ($1, $2, $3, $4, TRUE)
               ON CONFLICT (email) DO UPDATE SET provider = $3, provider_id = $4, email_verified = TRUE
               RETURNING *""",
            email,
            name,
            provider,
            provider_id,
        )
        return dict(row)


@router.post("/register")
async def register(body: UserRegister, request: Request):
    await verify_turnstile(body.turnstile_token)
    pool = await get_pool()

    verification_token = secrets.token_urlsafe(32)

    async with pool.acquire() as conn:
        existing = await conn.fetchrow(
            "SELECT id FROM users WHERE email = $1", body.email
        )
        if existing:
            raise HTTPException(status_code=409, detail="이미 등록된 이메일입니다.")

        await conn.fetchrow(
            """INSERT INTO users (email, password_hash, name, age, gender, dietary, verification_token)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               RETURNING *""",
            body.email,
            _hash_password(body.password),
            body.name,
            body.age,
            body.gender,
            body.dietary or "",
            verification_token,
        )

    base_url = os.getenv("PUBLIC_URL", str(request.base_url).rstrip("/"))

    if not send_verification_email(body.email, body.name, verification_token, base_url):
        return {"message": "회원가입이 완료되었습니다. 이메일 발송에 실패했습니다. 관리자에게 문의해주세요.", "email_sent": False}

    return {"message": "회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.", "email_sent": True}


@router.get("/verify-email")
async def verify_email(token: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM users WHERE verification_token = $1", token
        )
        if not row:
            return HTMLResponse(
                content=_verification_page("인증 실패", "유효하지 않은 인증 링크입니다.", False),
                status_code=400,
            )

        await conn.execute(
            "UPDATE users SET email_verified = TRUE, verification_token = NULL WHERE id = $1",
            row["id"],
        )

    return HTMLResponse(
        content=_verification_page("인증 완료", f"{row['name']}님, 이메일 인증이 완료되었습니다!", True),
    )


def _verification_page(title: str, message: str, success: bool) -> str:
    color = "#FE5F55" if success else "#e53e3e"
    icon = "&#10003;" if success else "&#10007;"
    return f"""<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Moodish - {title}</title>
<style>
body {{ font-family: -apple-system, sans-serif; background: #F7F7FF; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }}
.card {{ background: white; border-radius: 16px; padding: 48px; text-align: center; max-width: 400px; border: 1px solid #BDD5EA; }}
.icon {{ width: 64px; height: 64px; border-radius: 50%; background: {color}; color: white; font-size: 32px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }}
h1 {{ color: #495867; font-size: 24px; margin: 0 0 12px; }}
p {{ color: #577399; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }}
a {{ display: inline-block; background: #FE5F55; color: white; padding: 12px 32px; border-radius: 999px; text-decoration: none; font-weight: 600; }}
</style></head>
<body><div class="card">
<div class="icon">{icon}</div>
<h1>{title}</h1>
<p>{message}</p>
<a href="/">Moodish로 돌아가기</a>
</div></body></html>"""


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

    if not row.get("email_verified"):
        raise HTTPException(status_code=403, detail="이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.")

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
