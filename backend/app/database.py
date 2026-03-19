import os

import aiosqlite

DB_PATH = os.getenv("DB_PATH", "/app/data/moodish.db")


async def get_db():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    """Create tables if not exist"""
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category)"
    )
    await db.execute(
        "CREATE INDEX IF NOT EXISTS idx_recipes_source ON recipes(source)"
    )
    await db.commit()
    await db.close()
