from pydantic import BaseModel, Field


class Ingredient(BaseModel):
    name: str
    amount: str
    optional: bool = False
    substitute: str | None = None


class RecipeRequest(BaseModel):
    mood_emoji: str = Field(max_length=20)
    mood_text: str | None = Field(default=None, max_length=500)
    age: int | None = Field(default=None, ge=1, le=120)


class RecipeResponse(BaseModel):
    reaction: str
    recipe_name: str
    ingredients: list[Ingredient]
    steps: list[str]
    cooking_time: str
    difficulty: str
    description: str
