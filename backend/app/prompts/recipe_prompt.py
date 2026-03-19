import json


_JSON_FORMAT = (
    "{\n"
    '  "reaction": "사용자 기분에 대한 따뜻한 한마디",\n'
    '  "recipe_name": "요리 이름",\n'
    '  "ingredients": [{"name": "재료명", "amount": "양"}],\n'
    '  "steps": ["조리 단계 1", "조리 단계 2"],\n'
    '  "cooking_time": "예: 30분",\n'
    '  "difficulty": "쉬움 또는 보통 또는 어려움",\n'
    '  "description": "요리에 대한 짧은 설명"\n'
    "}"
)


def build_recipe_prompt(mood_emoji: str, mood_text: str | None) -> list[dict]:
    """후보 없이 순수 OpenAI 생성용 (폴백)"""
    system = (
        "당신은 따뜻한 한국 가정식 요리사입니다. "
        "사용자의 기분을 읽고, 그 기분에 어울리는 요리 레시피를 추천해주세요. "
        f"반드시 다음 JSON 형식으로만 응답하세요:\n{_JSON_FORMAT}"
    )

    user_parts = [mood_emoji]
    if mood_text:
        user_parts.append(mood_text)

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": " ".join(user_parts)},
    ]


def build_recipe_prompt_with_candidates(
    mood_value: str,
    mood_text: str | None,
    candidates: list[dict],
) -> list[dict]:
    """외부 API 후보를 포함한 프롬프트"""
    system = (
        "당신은 따뜻한 한국 가정식 요리사입니다. "
        "아래에 여러 출처에서 수집한 레시피 후보들이 주어집니다. "
        "사용자의 기분에 가장 어울리는 레시피를 하나 골라 한국어로 재구성해주세요. "
        "필요하면 여러 후보를 참고해 조합하거나 변형해도 좋습니다. "
        "따뜻한 공감 메시지도 함께 작성해주세요.\n\n"
        f"반드시 다음 JSON 형식으로만 응답하세요:\n{_JSON_FORMAT}"
    )

    # 후보 요약 (토큰 절약을 위해 핵심 정보만)
    candidate_summaries = []
    for c in candidates:
        summary = {
            "source": c.get("source", ""),
            "name": c.get("name", ""),
            "category": c.get("category", ""),
            "ingredients": c.get("ingredients", "")[:200],
        }
        candidate_summaries.append(summary)

    user_content = (
        f"내 기분: {mood_value}"
        + (f" ({mood_text})" if mood_text else "")
        + f"\n\n레시피 후보 목록:\n{json.dumps(candidate_summaries, ensure_ascii=False, indent=2)}"
    )

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user_content},
    ]
