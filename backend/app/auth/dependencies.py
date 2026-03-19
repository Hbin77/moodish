from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.auth.jwt_utils import verify_token
from app.auth.models import get_pool

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict | None:
    """Returns user dict or None (for optional auth)."""
    if credentials is None:
        return None

    user_id = verify_token(credentials.credentials)
    if user_id is None:
        return None

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM users WHERE id = $1", user_id)

    if row is None:
        return None

    return dict(row)


async def require_user(user=Depends(get_current_user)):
    """Raises 401 if not authenticated."""
    if not user:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
    return user
