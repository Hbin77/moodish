import json


_JSON_FORMAT = """{
  "reaction": "사용자 기분에 대한 따뜻한 공감 한마디 (2~3문장)",
  "recipe_name": "요리 이름",
  "ingredients": [
    {"name": "재료명 (예: 돼지고기 목살)", "amount": "정확한 양 (예: 300g)"}
  ],
  "steps": [
    "1단계: 구체적인 조리 설명 (불 세기, 시간, 상태 변화 포함)"
  ],
  "cooking_time": "예: 30분",
  "difficulty": "쉬움 또는 보통 또는 어려움",
  "description": "이 요리가 오늘 기분에 어울리는 이유 (1~2문장)"
}"""

_DETAIL_INSTRUCTIONS = """
## 반드시 지켜야 할 규칙:

### 재료 (ingredients)
- 모든 재료에 정확한 분량을 기재 (g, ml, 큰술, 작은술, 개, 장, 모 등)
- "적당량", "약간" 대신 구체적 수치 사용 (예: "소금 약간" → "소금 1/2작은술")
- 양념장이 필요하면 양념 재료도 각각 분리해서 기재
- 1인분 기준으로 작성

### 조리 단계 (steps)
- 최소 5단계 이상, 각 단계를 상세하게 작성
- 각 단계에 불 세기 명시 (예: "센 불", "중약불", "약불")
- 조리 시간 명시 (예: "3분간 볶는다", "20분간 끓인다")
- 상태 변화 설명 (예: "양파가 투명해질 때까지", "고기 겉면이 노릇해지면")
- 요리 초보자도 따라할 수 있도록 전문 용어 사용 시 쉬운 설명 추가
- 단계 번호를 텍스트에 포함하지 않기 (배열 순서가 번호 역할)
"""


def build_recipe_prompt(mood_emoji: str, mood_text: str | None) -> list[dict]:
    system = (
        "당신은 따뜻한 한국 가정식 요리사입니다. "
        "사용자의 기분을 읽고, 그 기분에 어울리는 요리 레시피를 추천해주세요. "
        "요리 초보자도 그대로 따라하면 완성할 수 있도록 상세하게 작성해야 합니다.\n\n"
        f"{_DETAIL_INSTRUCTIONS}\n"
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
    system = (
        "당신은 따뜻한 한국 가정식 요리사입니다. "
        "아래에 여러 출처에서 수집한 레시피 후보들이 주어집니다. "
        "사용자의 기분에 가장 어울리는 레시피를 하나 골라 한국어로 재구성해주세요. "
        "필요하면 여러 후보를 참고해 조합하거나 변형해도 좋습니다. "
        "따뜻한 공감 메시지도 함께 작성해주세요.\n\n"
        "중요: 후보의 재료와 단계 정보가 부족할 수 있습니다. "
        "그 경우 당신의 요리 지식으로 재료 분량과 조리 단계를 보완하여 "
        "초보자도 따라할 수 있도록 상세하게 완성해주세요.\n\n"
        f"{_DETAIL_INSTRUCTIONS}\n"
        f"반드시 다음 JSON 형식으로만 응답하세요:\n{_JSON_FORMAT}"
    )

    candidate_summaries = []
    for c in candidates:
        summary = {
            "source": c.get("source", ""),
            "name": c.get("name", ""),
            "category": c.get("category", ""),
            "ingredients": c.get("ingredients", ""),
            "steps": c.get("steps", []),
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
