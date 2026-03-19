import os

import httpx

KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY", "")
KAKAO_CLIENT_SECRET = os.getenv("KAKAO_CLIENT_SECRET", "")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")


async def kakao_get_user(code: str, redirect_uri: str) -> dict:
    """Exchange code for token, then get user info from Kakao."""
    async with httpx.AsyncClient(timeout=10) as client:
        token_resp = await client.post(
            "https://kauth.kakao.com/oauth/token",
            data={
                "grant_type": "authorization_code",
                "client_id": KAKAO_REST_API_KEY,
                "client_secret": KAKAO_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "code": code,
            },
        )
        token_resp.raise_for_status()
        access_token = token_resp.json()["access_token"]

        user_resp = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_resp.raise_for_status()
        data = user_resp.json()

    kakao_account = data.get("kakao_account", {})
    profile = kakao_account.get("profile", {})

    return {
        "email": kakao_account.get("email", ""),
        "name": profile.get("nickname", "카카오 사용자"),
        "provider_id": str(data["id"]),
    }


async def google_get_user(code: str, redirect_uri: str) -> dict:
    """Exchange code for token, then get user info from Google."""
    async with httpx.AsyncClient(timeout=10) as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "grant_type": "authorization_code",
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "code": code,
            },
        )
        token_resp.raise_for_status()
        access_token = token_resp.json()["access_token"]

        user_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_resp.raise_for_status()
        data = user_resp.json()

    return {
        "email": data.get("email", ""),
        "name": data.get("name", "Google 사용자"),
        "provider_id": str(data["id"]),
    }
