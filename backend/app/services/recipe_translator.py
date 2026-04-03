import json
import logging

from app.database import get_db
from app.services.openai_service import _get_client

logger = logging.getLogger(__name__)

_TRANSLATE_PROMPT = """당신은 요리 레시피 전문 번역가입니다. 아래 영어 레시피를 자연스러운 한국어로 번역해주세요.

규칙:
- 요리 이름: 한국에서 통용되는 이름 사용 (예: "Chicken Teriyaki" → "치킨 데리야끼", "Sushi" → "스시")
- 재료: 한국식 표현과 계량 단위 사용 (예: "1 cup flour" → "밀가루 1컵", "2 tbsp soy sauce" → "간장 2큰술")
- 조리 단계: 초보자도 이해할 수 있게 자연스러운 한국어로 번역
- 요리 설명: 이 요리가 어떤 요리인지 한국어로 간단히 설명 (1-2문장)
- 조리 시간과 난이도도 한국어로 (예: "30 minutes" → "30분", "Easy" → "쉬움")

반드시 아래 JSON 형식으로만 응답하세요:
{
  "name": "한국어 요리 이름",
  "ingredients": "재료1, 재료2, 재료3 (한국어, 쉼표 구분)",
  "steps": ["1단계 설명", "2단계 설명", ...],
  "description": "이 요리에 대한 간단한 한국어 설명 (1-2문장)",
  "cooking_time": "조리 시간 (한국어)",
  "difficulty": "쉬움 또는 보통 또는 어려움"
}"""


def _is_english(text: str) -> bool:
    """Check if text is primarily English (contains mostly ASCII letters)."""
    if not text:
        return False
    ascii_letters = sum(1 for c in text if c.isascii() and c.isalpha())
    total_letters = sum(1 for c in text if c.isalpha())
    if total_letters == 0:
        return False
    return ascii_letters / total_letters > 0.5


async def translate_recipe(recipe: dict) -> dict | None:
    """Translate an English recipe to Korean using GPT."""
    name = recipe.get("name", "")
    ingredients = recipe.get("ingredients", "")
    steps = recipe.get("steps", [])
    if isinstance(steps, str):
        steps = [steps]

    user_content = (
        f"요리 이름: {name}\n"
        f"재료: {ingredients}\n"
        f"조리 단계:\n" + "\n".join(f"- {s}" for s in steps if s)
    )

    try:
        client = _get_client()
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": _TRANSLATE_PROMPT},
                {"role": "user", "content": user_content},
            ],
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content
        if not content:
            return None
        return json.loads(content)
    except Exception:
        logger.exception(f"Failed to translate recipe: {name}")
        return None


async def translate_all_english_recipes() -> int:
    """Find and translate all English recipes in the DB."""
    db = await get_db()
    translated = 0
    try:
        cursor = await db.execute(
            "SELECT id, name, ingredients, steps, description, cooking_time, difficulty "
            "FROM recipes WHERE source NOT IN ('korean', 'mafra')"
        )
        rows = await cursor.fetchall()

        for row in rows:
            rid = row[0]
            name = row[1] or ""

            if not _is_english(name):
                continue

            # row: 0=id, 1=name, 2=ingredients, 3=steps, 4=description, 5=cooking_time, 6=difficulty
            steps_raw = row[3] or "[]"
            try:
                steps = json.loads(steps_raw) if steps_raw else []
            except (json.JSONDecodeError, TypeError):
                steps = [steps_raw] if steps_raw else []

            recipe_data = {
                "name": name,
                "ingredients": row[2] or "",
                "steps": steps,
            }

            result = await translate_recipe(recipe_data)
            if not result:
                continue

            new_steps = result.get("steps", steps)
            if isinstance(new_steps, list):
                steps_json = json.dumps(new_steps, ensure_ascii=False)
            else:
                steps_json = json.dumps([new_steps], ensure_ascii=False)

            await db.execute(
                """UPDATE recipes SET
                    name = ?, ingredients = ?, steps = ?,
                    description = ?, cooking_time = ?, difficulty = ?
                   WHERE id = ?""",
                (
                    result.get("name", name),
                    result.get("ingredients", row[2] or ""),
                    steps_json,
                    result.get("description", row[4] or ""),
                    result.get("cooking_time", row[5] or ""),
                    result.get("difficulty", row[6] or ""),
                    rid,
                ),
            )
            translated += 1
            logger.info(f"Translated: {name} → {result.get('name', '?')}")

        await db.commit()
    finally:
        await db.close()

    logger.info(f"Translated {translated} recipes to Korean")
    return translated
