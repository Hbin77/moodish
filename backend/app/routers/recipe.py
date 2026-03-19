from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.schemas.recipe import RecipeRequest, RecipeResponse
from app.services.openai_service import generate_recipe

router = APIRouter(prefix="/api")


@router.post("/recipe", response_model=RecipeResponse)
async def create_recipe(
    request: RecipeRequest,
    user=Depends(get_current_user),
):
    user_profile = None
    if user:
        user_profile = {
            "age": user.get("age"),
            "gender": user.get("gender"),
            "dietary": user.get("dietary"),
        }
    result = await generate_recipe(
        request.mood_emoji,
        request.mood_text,
        request.age if not user_profile else user_profile.get("age"),
        user_profile=user_profile,
    )
    return result


@router.get("/health")
async def health():
    return {"status": "ok"}
