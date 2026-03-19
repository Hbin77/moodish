import asyncio
import logging

import httpx

logger = logging.getLogger(__name__)

API_TIMEOUT = 10.0


def _parse_meal(meal: dict) -> dict:
    """TheMealDB 응답을 정규화된 형식으로 변환"""
    ingredients_parts = []
    for i in range(1, 21):
        ing = meal.get(f"strIngredient{i}", "") or ""
        measure = meal.get(f"strMeasure{i}", "") or ""
        if ing.strip():
            ingredients_parts.append(f"{measure.strip()} {ing.strip()}".strip())

    return {
        "source": "themealdb",
        "name": meal.get("strMeal", ""),
        "ingredients": ", ".join(ingredients_parts),
        "steps": meal.get("strInstructions", ""),
        "category": meal.get("strCategory", ""),
        "image_url": meal.get("strMealThumb", ""),
    }


async def _fetch_random_meal(client: httpx.AsyncClient) -> dict | None:
    try:
        resp = await client.get("https://www.themealdb.com/api/json/v1/1/random.php")
        resp.raise_for_status()
        meals = resp.json().get("meals")
        if meals:
            return meals[0]
    except Exception:
        logger.exception("TheMealDB random 호출 실패")
    return None


async def fetch_themealdb_recipes(keyword: str | None = None) -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
            if keyword:
                resp = await client.get(
                    f"https://www.themealdb.com/api/json/v1/1/search.php?s={keyword}"
                )
                resp.raise_for_status()
                meals = resp.json().get("meals") or []
                return [_parse_meal(m) for m in meals[:5]]

            # 랜덤 3개 병렬 요청
            tasks = [_fetch_random_meal(client) for _ in range(3)]
            results = await asyncio.gather(*tasks)
            return [_parse_meal(m) for m in results if m is not None]

    except Exception:
        logger.exception("TheMealDB API 호출 실패")
        return []
