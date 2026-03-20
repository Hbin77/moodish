import json
import logging

from app.database import get_db
from app.services.korean_recipe_api import fetch_korean_recipes
from app.services.spoonacular_api import fetch_spoonacular_recipes
from app.services.themealdb_api import fetch_themealdb_recipes

logger = logging.getLogger(__name__)


async def _fetch_korean_bulk() -> list[dict]:
    """Fetch Korean recipes from pages 1-200 in batches."""
    import os
    import httpx

    api_key = os.getenv("KOREAN_RECIPE_API_KEY")
    if not api_key:
        logger.warning("KOREAN_RECIPE_API_KEY not set, falling back to default fetch")
        return await fetch_korean_recipes()

    all_recipes: list[dict] = []
    batch_size = 100

    for start in (1, 101):
        end = start + batch_size - 1
        url = f"http://openapi.foodsafetykorea.go.kr/api/{api_key}/COOKRCP01/json/{start}/{end}"
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()

            rows = data.get("COOKRCP01", {}).get("row", [])
            for r in rows:
                steps = []
                for i in range(1, 21):
                    step = r.get(f"MANUAL{i:02d}", "")
                    if step and step.strip():
                        steps.append(step.strip())

                all_recipes.append({
                    "source": "korean",
                    "name": r.get("RCP_NM", ""),
                    "ingredients": r.get("RCP_PARTS_DTLS", ""),
                    "steps": steps,
                    "category": r.get("RCP_PAT2", ""),
                    "image_url": r.get("ATT_FILE_NO_MAIN", ""),
                })
        except Exception:
            logger.exception(f"Korean API batch {start}-{end} failed")

    return all_recipes


async def _fetch_spoonacular_bulk() -> list[dict]:
    """Fetch 20 random recipes from Spoonacular."""
    import os
    import httpx

    api_key = os.getenv("SPOONACULAR_API_KEY")
    if not api_key:
        logger.warning("SPOONACULAR_API_KEY not set")
        return []

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = "https://api.spoonacular.com/recipes/random"
            params = {"apiKey": api_key, "number": 20}
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
                "image_url": r.get("image", ""),
            })
        return results
    except Exception:
        logger.exception("Spoonacular bulk fetch failed")
        return []


async def _fetch_themealdb_bulk() -> list[dict]:
    """Fetch 10 random recipes from TheMealDB."""
    import asyncio
    import httpx

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            tasks = []
            for _ in range(10):
                tasks.append(
                    client.get("https://www.themealdb.com/api/json/v1/1/random.php")
                )
            responses = await asyncio.gather(*tasks, return_exceptions=True)

        from app.services.themealdb_api import _parse_meal

        results = []
        for resp in responses:
            if isinstance(resp, Exception):
                continue
            try:
                resp.raise_for_status()
                meals = resp.json().get("meals")
                if meals:
                    results.append(_parse_meal(meals[0]))
            except Exception:
                continue
        return results
    except Exception:
        logger.exception("TheMealDB bulk fetch failed")
        return []


async def collect_recipes() -> int:
    """Fetch recipes from all APIs and save to DB. Returns count of new recipes."""
    all_recipes: list[dict] = []

    # Fetch from all sources independently
    for fetcher, name in [
        (_fetch_korean_bulk, "korean"),
        (_fetch_spoonacular_bulk, "spoonacular"),
        (_fetch_themealdb_bulk, "themealdb"),
    ]:
        try:
            recipes = await fetcher()
            all_recipes.extend(recipes)
            logger.info(f"Fetched {len(recipes)} recipes from {name}")
        except Exception:
            logger.exception(f"Failed to fetch from {name}")

    if not all_recipes:
        return 0

    db = await get_db()
    inserted = 0
    try:
        # Fetch all existing recipe names in one query to avoid N+1
        cursor = await db.execute("SELECT name FROM recipes")
        rows = await cursor.fetchall()
        existing_names = {r["name"] for r in rows}

        for recipe in all_recipes:
            name = recipe.get("name", "").strip()
            if not name or name in existing_names:
                continue

            steps = recipe.get("steps", [])
            if isinstance(steps, list):
                steps_json = json.dumps(steps, ensure_ascii=False)
            else:
                steps_json = json.dumps([steps], ensure_ascii=False)

            await db.execute(
                """INSERT OR IGNORE INTO recipes (name, category, ingredients, steps, source, image_url)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    name,
                    recipe.get("category", ""),
                    recipe.get("ingredients", ""),
                    steps_json,
                    recipe.get("source", ""),
                    recipe.get("image_url", ""),
                ),
            )
            existing_names.add(name)
            inserted += 1

        await db.commit()
    finally:
        await db.close()

    logger.info(f"Inserted {inserted} new recipes")
    return inserted
