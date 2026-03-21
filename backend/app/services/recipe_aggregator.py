import asyncio
import logging

from app.services.korean_recipe_api import fetch_korean_recipes
from app.services.spoonacular_api import fetch_spoonacular_recipes
from app.services.themealdb_api import fetch_themealdb_recipes

logger = logging.getLogger(__name__)

# 무드 → 검색 키워드 매핑
MOOD_KEYWORD_MAP = {
    "happy": "파티",
    "sad": "국",
    "angry": "매운",
    "tired": "국",
    "excited": "볶음",
    "comfort": "찌개",
    "celebration": "잔치",
    "sick": "죽",
    "depressed": "죽",
    "motivated": "닭가슴살",
    "anxious": "편안한 음식",
    "neutral": None,
}


async def fetch_all_recipes(mood_value: str, mood_text: str | None) -> list[dict]:
    """3개 외부 API에서 병렬로 레시피 후보를 수집"""
    korean_keyword = MOOD_KEYWORD_MAP.get(mood_value.lower())

    results = await asyncio.gather(
        fetch_korean_recipes(keyword=korean_keyword),
        fetch_spoonacular_recipes(mood=mood_value),
        fetch_themealdb_recipes(keyword=None),
        return_exceptions=True,
    )

    combined = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.error("API %d 실패: %s", i, result)
            continue
        combined.extend(result)

    logger.info("총 %d개 레시피 후보 수집 완료", len(combined))
    return combined
