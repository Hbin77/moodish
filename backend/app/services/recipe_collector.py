import asyncio
import json
import logging
import os

import httpx

from app.database import get_db, classify_cuisine, normalize_category
from app.services.korean_recipe_api import fetch_korean_recipes
from app.services.spoonacular_api import fetch_spoonacular_recipes
from app.services.themealdb_api import fetch_themealdb_recipes, _parse_meal

logger = logging.getLogger(__name__)


async def _fetch_korean_bulk() -> list[dict]:
    """Fetch Korean recipes from pages 1-200 in batches."""
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


def _parse_spoonacular_recipe(r: dict) -> dict:
    """Parse a single Spoonacular recipe into our format."""
    ingredients = ", ".join(
        ing.get("original", ing.get("name", ""))
        for ing in r.get("extendedIngredients", [])
    )
    steps = []
    for section in r.get("analyzedInstructions", []):
        for step in section.get("steps", []):
            steps.append(step.get("step", ""))

    return {
        "source": "spoonacular",
        "name": r.get("title", ""),
        "ingredients": ingredients,
        "steps": steps,
        "category": ", ".join(r.get("dishTypes", [])),
        "cuisines": r.get("cuisines", []),
        "image_url": r.get("image", ""),
    }


async def _fetch_spoonacular_bulk() -> list[dict]:
    """Fetch recipes from Spoonacular by cuisine categories."""
    api_key = os.getenv("SPOONACULAR_API_KEY")
    if not api_key:
        logger.warning("SPOONACULAR_API_KEY not set")
        return []

    results = []
    cuisines_to_fetch = [
        ("Chinese", 10),
        ("Japanese", 10),
        ("Italian", 5),
        ("French", 5),
        ("Mexican", 5),
        ("Indian", 5),
        ("Korean", 5),
    ]

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            for cuisine_name, count in cuisines_to_fetch:
                try:
                    url = "https://api.spoonacular.com/recipes/complexSearch"
                    params = {
                        "apiKey": api_key,
                        "cuisine": cuisine_name,
                        "number": count,
                        "addRecipeInformation": True,
                        "fillIngredients": True,
                        "sort": "random",
                    }
                    resp = await client.get(url, params=params)
                    resp.raise_for_status()
                    data = resp.json()
                    recipes = data.get("results", [])
                    for r in recipes:
                        parsed = _parse_spoonacular_recipe(r)
                        # Override cuisines with the target cuisine
                        if not parsed["cuisines"]:
                            parsed["cuisines"] = [cuisine_name]
                        results.append(parsed)
                    logger.info(f"Spoonacular: fetched {len(recipes)} {cuisine_name} recipes")
                except Exception:
                    logger.exception(f"Spoonacular {cuisine_name} fetch failed")

            # Also fetch some random recipes
            try:
                url = "https://api.spoonacular.com/recipes/random"
                params = {"apiKey": api_key, "number": 10}
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()
                for r in data.get("recipes", []):
                    results.append(_parse_spoonacular_recipe(r))
            except Exception:
                logger.exception("Spoonacular random fetch failed")

    except Exception:
        logger.exception("Spoonacular bulk fetch failed")

    return results


async def _fetch_themealdb_bulk() -> list[dict]:
    """Fetch recipes from TheMealDB by area (country)."""
    areas_to_fetch = ["Chinese", "Japanese", "Italian", "French", "Mexican",
                      "Indian", "American", "British", "Thai", "Spanish"]

    results = []
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            for area in areas_to_fetch:
                try:
                    # Step 1: Get meal IDs for this area
                    resp = await client.get(
                        f"https://www.themealdb.com/api/json/v1/1/filter.php?a={area}"
                    )
                    resp.raise_for_status()
                    meals = resp.json().get("meals") or []

                    # Step 2: Fetch full details for up to 10 meals per area
                    for meal in meals[:10]:
                        meal_id = meal.get("idMeal")
                        if not meal_id:
                            continue
                        try:
                            detail_resp = await client.get(
                                f"https://www.themealdb.com/api/json/v1/1/lookup.php?i={meal_id}"
                            )
                            detail_resp.raise_for_status()
                            detail_meals = detail_resp.json().get("meals")
                            if detail_meals:
                                results.append(_parse_meal(detail_meals[0]))
                        except Exception:
                            continue

                    logger.info(f"TheMealDB: fetched {min(len(meals), 10)} {area} recipes")
                except Exception:
                    logger.exception(f"TheMealDB {area} fetch failed")

            # Also fetch some random recipes
            tasks = [
                client.get("https://www.themealdb.com/api/json/v1/1/random.php")
                for _ in range(5)
            ]
            responses = await asyncio.gather(*tasks, return_exceptions=True)
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

    except Exception:
        logger.exception("TheMealDB bulk fetch failed")

    return results


async def collect_recipes() -> int:
    """Fetch recipes from all APIs and save to DB. Returns count of new recipes."""
    all_recipes: list[dict] = []

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

            source = recipe.get("source", "")
            area = recipe.get("area", "")
            cuisines = recipe.get("cuisines", [])
            if cuisines and not area:
                area = cuisines[0] if cuisines else ""

            raw_category = recipe.get("category", "")
            cuisine = classify_cuisine(source, area=area, name=name, category=raw_category)
            normalized_cat = normalize_category(raw_category, source)

            await db.execute(
                """INSERT OR IGNORE INTO recipes (name, category, ingredients, steps, source, image_url, cuisine)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (
                    name,
                    normalized_cat,
                    recipe.get("ingredients", ""),
                    steps_json,
                    source,
                    recipe.get("image_url", ""),
                    cuisine,
                ),
            )
            existing_names.add(name)
            inserted += 1

        await db.commit()
    finally:
        await db.close()

    logger.info(f"Inserted {inserted} new recipes")
    return inserted
