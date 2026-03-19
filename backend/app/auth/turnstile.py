import os
import httpx
from fastapi import HTTPException

TURNSTILE_SECRET = os.getenv("TURNSTILE_SECRET_KEY", "")
VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


async def verify_turnstile(token: str) -> None:
    if not TURNSTILE_SECRET:
        return

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            VERIFY_URL,
            data={"secret": TURNSTILE_SECRET, "response": token},
        )

    result = resp.json()
    if not result.get("success"):
        raise HTTPException(status_code=403, detail="로봇 인증에 실패했습니다. 다시 시도해주세요.")
