import logging
import os

import aiosqlite

DB_PATH = os.getenv("DB_PATH", "/app/data/moodish.db")

logger = logging.getLogger(__name__)


async def get_db():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db


# Cuisine classification helpers
CUISINE_MAP_AREA = {
    "korean": "한식",
    "japanese": "일식",
    "chinese": "중식",
    "thai": "양식",
    "vietnamese": "양식",
    "indian": "양식",
    "italian": "양식",
    "french": "양식",
    "american": "양식",
    "british": "양식",
    "mexican": "양식",
    "spanish": "양식",
    "greek": "양식",
    "turkish": "양식",
    "moroccan": "양식",
    "russian": "양식",
    "dutch": "양식",
    "canadian": "양식",
    "irish": "양식",
    "polish": "양식",
    "portuguese": "양식",
    "croatian": "양식",
    "egyptian": "양식",
    "filipino": "양식",
    "malaysian": "양식",
    "tunisian": "양식",
    "jamaican": "양식",
    "kenyan": "양식",
}

KOREAN_KEYWORDS = [
    "김치", "불고기", "비빔", "잡채", "떡", "전", "찌개", "국", "탕",
    "볶음", "구이", "조림", "나물", "무침", "밥", "죽", "면", "찜",
    "쌈", "갈비", "삼겹", "된장", "고추장", "김밥", "순두부", "두부",
    "해물", "삼계탕", "냉면", "칼국수", "수제비", "만두", "호떡",
]

JAPANESE_KEYWORDS = [
    "sushi", "ramen", "tempura", "teriyaki", "udon", "soba", "miso",
    "katsu", "tonkatsu", "yakitori", "gyoza", "donburi", "sashimi",
    "matcha", "mochi", "edamame", "takoyaki", "okonomiyaki",
]

CHINESE_KEYWORDS = [
    "kung pao", "chow mein", "fried rice", "sweet and sour", "wonton",
    "dim sum", "dumpling", "mapo tofu", "peking", "szechuan", "sichuan",
    "cantonese", "hoisin", "chow fun", "lo mein", "spring roll",
    "char siu", "congee", "bao", "xiaolongbao",
    "짜장", "짬뽕", "탕수육", "마파두부", "깐풍기",
]


def classify_cuisine(source: str, area: str = "", name: str = "", category: str = "") -> str:
    """Classify a recipe into cuisine type."""
    source = source or ""
    if source == "korean":
        return "한식"

    area_lower = (area or "").lower().strip()
    if area_lower in CUISINE_MAP_AREA:
        return CUISINE_MAP_AREA[area_lower]

    name_lower = (name or "").lower()
    cat_lower = (category or "").lower()
    combined = f"{name_lower} {cat_lower}"

    for kw in KOREAN_KEYWORDS:
        if kw in combined:
            return "한식"
    for kw in JAPANESE_KEYWORDS:
        if kw in combined:
            return "일식"
    for kw in CHINESE_KEYWORDS:
        if kw in combined:
            return "중식"

    return "양식"


CATEGORY_MAP = {
    "beef": "소고기",
    "chicken": "닭고기",
    "dessert": "디저트",
    "lamb": "양고기",
    "miscellaneous": "기타",
    "pasta": "파스타/면",
    "pork": "돼지고기",
    "seafood": "해산물",
    "side": "반찬/사이드",
    "starter": "전채",
    "vegan": "비건",
    "vegetarian": "채식",
    "breakfast": "아침식사",
    "goat": "염소고기",
    "main course": "메인요리",
    "side dish": "반찬/사이드",
    "appetizer": "전채",
    "salad": "샐러드",
    "bread": "빵",
    "soup": "국/수프",
    "beverage": "음료",
    "sauce": "소스",
    "marinade": "양념",
    "fingerfood": "핑거푸드",
    "snack": "간식",
    "drink": "음료",
    "antipasti": "전채",
    "antipasto": "전채",
    "hor d'oeuvre": "전채",
    "lunch": "점심",
    "dinner": "저녁",
    "morning meal": "아침식사",
    "brunch": "브런치",
    "condiment": "양념",
    "dip": "딥/소스",
    "spread": "스프레드",
}


def normalize_category(raw_category: str, source: str) -> str:
    """Normalize category to Korean label."""
    if not raw_category:
        return ""
    if source == "korean":
        return raw_category

    parts = [p.strip().lower() for p in raw_category.split(",")]
    for part in parts:
        if part in CATEGORY_MAP:
            return CATEGORY_MAP[part]

    return raw_category.split(",")[0].strip()


async def init_db():
    """Create tables if not exist, run migrations."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    db = await aiosqlite.connect(DB_PATH)
    await db.execute("""
        CREATE TABLE IF NOT EXISTS recipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT DEFAULT '',
            ingredients TEXT DEFAULT '',
            steps TEXT DEFAULT '',
            cooking_time TEXT DEFAULT '',
            difficulty TEXT DEFAULT '',
            description TEXT DEFAULT '',
            source TEXT DEFAULT '',
            image_url TEXT DEFAULT '',
            cuisine TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category)"
    )
    await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_recipes_source ON recipes(source)"
    )

    # Migration: add cuisine column if table already exists without it
    cursor = await db.execute("PRAGMA table_info(recipes)")
    columns = [row[1] for row in await cursor.fetchall()]
    if "cuisine" not in columns:
        await db.execute("ALTER TABLE recipes ADD COLUMN cuisine TEXT DEFAULT ''")
        logger.info("Added cuisine column to recipes table")

    # Index must be created AFTER column exists
    await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine)"
    )

    # Migrate existing data: classify cuisine + normalize categories (one-time)
    cursor = await db.execute(
        "SELECT id, source, name, category FROM recipes WHERE cuisine = '' OR cuisine IS NULL"
    )
    rows = await cursor.fetchall()
    if rows:
        updates = []
        for row in rows:
            rid, source, name, cat = row[0], row[1] or "", row[2] or "", row[3] or ""
            cuisine = classify_cuisine(source, area="", name=name, category=cat)
            normalized_cat = normalize_category(cat, source)
            updates.append((cuisine, normalized_cat, rid))
        await db.executemany(
            "UPDATE recipes SET cuisine = ?, category = ? WHERE id = ?", updates
        )
        logger.info(f"Migrated cuisine/category for {len(rows)} recipes")

    await db.commit()
    await db.close()
