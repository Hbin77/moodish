from fastapi import APIRouter

from app.schemas.recipe import RecipeRequest, RecipeResponse
from app.services.openai_service import generate_recipe

router = APIRouter(prefix="/api")


@router.post("/recipe", response_model=RecipeResponse)
async def create_recipe(request: RecipeRequest):
    result = await generate_recipe(request.mood_emoji, request.mood_text)
    return result


@router.get("/health")
async def health():
    return {"status": "ok"}
