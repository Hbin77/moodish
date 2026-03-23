import logging
import os

import httpx

logger = logging.getLogger(__name__)

API_TIMEOUT = 10.0

MOOD_QUERY_MAP = {
    "happy": "party food",
    "celebration": "festive",
    "sad": "comfort food",
    "comfort": "comfort food",
    "depressed": "stew",
    "tired": "easy soup",
    "sick": "soup",
    "angry": "spicy",
    "motivated": "healthy protein",
    "stressed": "comfort food",
    "lonely": "warm soup",
    "excited": "party food",
}


async def fetch_spoonacular_recipes(mood: str | None = None) -> list[dict]:
    api_key = os.getenv("SPOONACULAR_API_KEY")
    if not api_key:
        logger.warning("SPOONACULAR_API_KEY not set")
        return []

    try:
        async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
            if mood and mood.lower() in MOOD_QUERY_MAP:
                query = MOOD_QUERY_MAP[mood.lower()]
                url = "https://api.spoonacular.com/recipes/complexSearch"
                params = {
                    "apiKey": api_key,
                    "query": query,
                    "number": 5,
                    "addRecipeInformation": True,
                    "fillIngredients": True,
                }
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()
                recipes = data.get("results", [])
            else:
                url = "https://api.spoonacular.com/recipes/random"
                params = {"apiKey": api_key, "number": 5}
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()
                recipes = data.get("recipes", [])

        results = []
        for r in recipes:
            ingredients = ", ".join(
                ing.get("original", ing.get("name", ""))
                for ing in r.get("extendedIngredients", [])
            )
            # 조리 단계 파싱
            steps = []
            for section in r.get("analyzedInstructions", []):
                for step in section.get("steps", []):
                    steps.append(step.get("step", ""))

            results.append({
                "source": "spoonacular",
                "name": r.get("title", ""),
                "ingredients": ingredients,
                "steps": steps,
                "category": ", ".join(r.get("dishTypes", [])),
                "cuisines": r.get("cuisines", []),
                "image_url": r.get("image", ""),
            })

        return results

    except Exception:
        logger.exception("Spoonacular API 호출 실패")
        return []
