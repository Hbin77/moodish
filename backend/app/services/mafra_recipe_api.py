"""농림수산식품교육문화정보원 레시피 API client.

3 APIs:
- Grid_20150827000000000226_1: 레시피 기본정보 (name, cuisine, category, time, difficulty)
- Grid_20150827000000000227_1: 레시피 재료정보 (ingredients per recipe)
- Grid_20150827000000000228_1: 레시피 과정정보 (cooking steps per recipe)
"""

import logging
import os

import httpx

logger = logging.getLogger(__name__)

BASE_URL = "http://211.237.50.150:7080/openapi"
BASIC_API = "Grid_20150827000000000226_1"
INGREDIENT_API = "Grid_20150827000000000227_1"
PROCESS_API = "Grid_20150827000000000228_1"

# Map NATION_NM to our cuisine categories
NATION_TO_CUISINE = {
    "한식": "한식",
    "중국": "중식",
    "중식": "중식",
    "일본": "일식",
    "일식": "일식",
    "서양": "양식",
    "양식": "양식",
    "이탈리아": "양식",
    "프랑스": "양식",
    "동남아": "양식",
    "인도": "양식",
    "기타": "양식",
}


def _api_url(api_key: str, grid_id: str, start: int, end: int) -> str:
    return f"{BASE_URL}/{api_key}/json/{grid_id}/{start}/{end}"


async def fetch_mafra_recipes() -> list[dict]:
    """Fetch all recipes from MAFRA API with ingredients and steps."""
    api_key = os.getenv("MAFRA_API_KEY")
    if not api_key:
        logger.warning("MAFRA_API_KEY not set")
        return []

    all_recipes = []

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Step 1: Fetch all basic recipe info (537 total, fetch in batches)
            recipe_map: dict[int, dict] = {}
            for start in range(1, 600, 100):
                end = start + 99
                url = _api_url(api_key, BASIC_API, start, end)
                try:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    data = resp.json().get(BASIC_API, {})
                    rows = data.get("row", [])
                    if not rows:
                        break
                    for r in rows:
                        rid = r.get("RECIPE_ID")
                        nation = r.get("NATION_NM", "")
                        recipe_map[rid] = {
                            "id": rid,
                            "name": r.get("RECIPE_NM_KO", ""),
                            "description": r.get("SUMRY", ""),
                            "cuisine": NATION_TO_CUISINE.get(nation, "양식"),
                            "category": r.get("TY_NM", ""),
                            "cooking_time": r.get("COOKING_TIME", ""),
                            "difficulty": r.get("LEVEL_NM", ""),
                            "calorie": r.get("CALORIE", ""),
                            "servings": r.get("QNT", ""),
                            "ingredients": [],
                            "steps": [],
                        }
                except Exception:
                    logger.exception(f"MAFRA basic info batch {start}-{end} failed")

            logger.info(f"MAFRA: fetched {len(recipe_map)} basic recipes")

            # Step 2: Fetch ingredients for all recipes
            for start in range(1, 10000, 1000):
                end = start + 999
                url = _api_url(api_key, INGREDIENT_API, start, end)
                try:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    data = resp.json().get(INGREDIENT_API, {})
                    rows = data.get("row", [])
                    if not rows:
                        break
                    for r in rows:
                        rid = r.get("RECIPE_ID")
                        if rid in recipe_map:
                            name = r.get("IRDNT_NM", "")
                            amount = r.get("IRDNT_CPCTY", "")
                            if name:
                                recipe_map[rid]["ingredients"].append(
                                    f"{name} {amount}".strip()
                                )
                except Exception:
                    logger.exception(f"MAFRA ingredients batch {start}-{end} failed")

            # Step 3: Fetch cooking steps for all recipes
            for start in range(1, 10000, 1000):
                end = start + 999
                url = _api_url(api_key, PROCESS_API, start, end)
                try:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    data = resp.json().get(PROCESS_API, {})
                    rows = data.get("row", [])
                    if not rows:
                        break
                    for r in rows:
                        rid = r.get("RECIPE_ID")
                        if rid in recipe_map:
                            step_no = r.get("COOKING_NO", 0)
                            step_text = r.get("COOKING_DC", "")
                            tip = r.get("STEP_TIP", "")
                            if step_text:
                                full_step = step_text
                                if tip:
                                    full_step += f" (팁: {tip})"
                                recipe_map[rid]["steps"].append(
                                    (step_no, full_step)
                                )
                except Exception:
                    logger.exception(f"MAFRA process batch {start}-{end} failed")

            # Build final recipe list
            for recipe in recipe_map.values():
                # Sort steps by step number
                recipe["steps"] = [
                    text for _, text in sorted(recipe["steps"], key=lambda x: x[0])
                ]
                all_recipes.append({
                    "source": "mafra",
                    "name": recipe["name"],
                    "description": recipe["description"],
                    "ingredients": ", ".join(recipe["ingredients"]),
                    "steps": recipe["steps"],
                    "category": recipe["category"],
                    "cuisine": recipe["cuisine"],
                    "cooking_time": recipe["cooking_time"],
                    "difficulty": recipe["difficulty"],
                    "image_url": "",
                })

    except Exception:
        logger.exception("MAFRA API fetch failed")

    logger.info(f"MAFRA: returning {len(all_recipes)} complete recipes")
    return all_recipes
