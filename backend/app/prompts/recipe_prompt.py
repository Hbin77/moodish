def build_recipe_prompt(mood_emoji: str, mood_text: str | None) -> list[dict]:
    system = (
        "당신은 따뜻한 한국 가정식 요리사입니다. "
        "사용자의 기분을 읽고, 그 기분에 어울리는 요리 레시피를 추천해주세요. "
        "반드시 다음 JSON 형식으로만 응답하세요:\n"
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

    user_parts = [mood_emoji]
    if mood_text:
        user_parts.append(mood_text)
    user_message = " ".join(user_parts)

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user_message},
    ]
