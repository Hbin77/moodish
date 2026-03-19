import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.models import init_user_db
from app.database import get_db, init_db
from app.routers.auth import router as auth_router
from app.routers.recipe import router as recipe_router
from app.routers.recipebook import router as recipebook_router

load_dotenv()

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await init_user_db()
    # Auto-collect if DB is empty
    db = await get_db()
    try:
        cursor = await db.execute("SELECT COUNT(*) FROM recipes")
        row = await cursor.fetchone()
        count = row[0]
    finally:
        await db.close()

    if count == 0:
        logger.info("DB is empty, triggering initial recipe collection...")
        from app.services.recipe_collector import collect_recipes

        try:
            inserted = await collect_recipes()
            logger.info(f"Initial collection: {inserted} recipes")
        except Exception:
            logger.exception("Initial recipe collection failed")

    yield


app = FastAPI(title="Moodish API", lifespan=lifespan)

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(auth_router)
app.include_router(recipe_router)
app.include_router(recipebook_router)
