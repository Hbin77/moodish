import json
import math

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth.dependencies import require_user
from app.database import get_db
from app.services.recipe_collector import collect_recipes

router = APIRouter(prefix="/api/recipebook")


@router.get("/recipes")
async def list_recipes(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    category: str | None = None,
    search: str | None = None,
    source: str | None = None,
    cuisine: str | None = None,
):
    """List recipes with pagination, filtering, search"""
    conditions = []
    params: list = []

    if category:
        conditions.append("category = ?")
        params.append(category)
    if source:
        conditions.append("source = ?")
        params.append(source)
    if cuisine:
        conditions.append("cuisine = ?")
        params.append(cuisine)
    if search:
        escaped = search.replace("%", "\\%").replace("_", "\\_")
        conditions.append("(name LIKE ? ESCAPE '\\' OR ingredients LIKE ? ESCAPE '\\')")
        params.extend([f"%{escaped}%", f"%{escaped}%"])

    where = ""
    if conditions:
        where = "WHERE " + " AND ".join(conditions)

    db = await get_db()
    try:
        cursor = await db.execute(
            f"SELECT COUNT(*) FROM recipes {where}", params
        )
        row = await cursor.fetchone()
        total = row[0]

        offset = (page - 1) * limit
        cursor = await db.execute(
            f"SELECT * FROM recipes {where} ORDER BY id DESC LIMIT ? OFFSET ?",
            params + [limit, offset],
        )
        rows = await cursor.fetchall()

        recipes = []
        for r in rows:
            steps_raw = r["steps"]
            try:
                steps = json.loads(steps_raw) if steps_raw else []
            except (json.JSONDecodeError, TypeError):
                steps = [steps_raw] if steps_raw else []

            recipes.append({
                "id": r["id"],
                "name": r["name"],
                "category": r["category"],
                "ingredients": r["ingredients"],
                "steps": steps,
                "cooking_time": r["cooking_time"],
                "difficulty": r["difficulty"],
                "description": r["description"],
                "source": r["source"],
                "cuisine": r["cuisine"],
                "image_url": r["image_url"],
            })

        return {
            "recipes": recipes,
            "total": total,
            "page": page,
            "pages": math.ceil(total / limit) if total > 0 else 0,
        }
    finally:
        await db.close()


@router.get("/recipes/{recipe_id}")
async def get_recipe(recipe_id: int):
    """Get single recipe detail"""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM recipes WHERE id = ?", (recipe_id,))
        r = await cursor.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Recipe not found")

        steps_raw = r["steps"]
        try:
            steps = json.loads(steps_raw) if steps_raw else []
        except (json.JSONDecodeError, TypeError):
            steps = [steps_raw] if steps_raw else []

        return {
            "id": r["id"],
            "name": r["name"],
            "category": r["category"],
            "ingredients": r["ingredients"],
            "steps": steps,
            "cooking_time": r["cooking_time"],
            "difficulty": r["difficulty"],
            "description": r["description"],
            "source": r["source"],
            "cuisine": r["cuisine"],
            "image_url": r["image_url"],
            "created_at": r["created_at"],
        }
    finally:
        await db.close()


@router.get("/categories")
async def list_categories():
    """Get unique category list with counts"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT category, COUNT(*) as count FROM recipes "
            "WHERE category != '' GROUP BY category ORDER BY count DESC"
        )
        rows = await cursor.fetchall()
        return [{"category": r["category"], "count": r["count"]} for r in rows]
    finally:
        await db.close()


@router.post("/collect")
async def trigger_collection(_user=Depends(require_user)):
    """Manually trigger recipe collection from APIs"""
    count = await collect_recipes()
    return {"message": f"Collected {count} new recipes", "count": count}
