import json
import logging
import os

from fastapi import HTTPException
from openai import AsyncOpenAI

from app.prompts.recipe_prompt import build_recipe_prompt

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY environment variable is not set")
        _client = AsyncOpenAI(api_key=api_key)
    return _client


async def generate_recipe(mood_emoji: str, mood_text: str | None) -> dict:
    messages = build_recipe_prompt(mood_emoji, mood_text)
    try:
        client = _get_client()
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content
        if content is None:
            raise HTTPException(status_code=502, detail="AI 서비스에서 응답을 받지 못했습니다.")
        return json.loads(content)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("OpenAI API error")
        raise HTTPException(status_code=502, detail="AI 서비스에 일시적인 문제가 발생했습니다.")
