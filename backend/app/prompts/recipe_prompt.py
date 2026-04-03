import json
from datetime import datetime


_JSON_FORMAT = """{
  "reaction": "사용자 기분에 대한 따뜻한 공감 한마디 (2~3문장)",
  "recipe_name": "요리 이름",
  "ingredients": [
    {"name": "재료명", "amount": "정확한 양", "optional": false, "substitute": null},
    {"name": "선택 재료", "amount": "양", "optional": true, "substitute": "대체 가능한 재료"}
  ],
  "steps": [
    "구체적인 조리 설명 (불 세기, 시간, 상태 변화 포함)"
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
- 없어도 요리가 가능한 재료는 optional: true로 표시
- 구하기 어려운 재료는 substitute에 대체 재료를 명시 (예: "파마산 치즈" → substitute: "체다 치즈 또는 모차렐라")
- 핵심 재료(메인 재료, 기본 양념)는 optional: false, substitute: null
- 고기류는 반드시 부위를 명시 (예: "소고기" → "소고기 앞다리살", "돼지고기" → "돼지고기 목살", "닭고기" → "닭 가슴살" 등)

### 조리 단계 (steps)
- 최소 5단계 이상, 각 단계를 상세하게 작성
- 각 단계에 불 세기 명시 (예: "센 불", "중약불", "약불")
- 조리 시간 명시 (예: "3분간 볶는다", "20분간 끓인다")
- 상태 변화 설명 (예: "양파가 투명해질 때까지", "고기 겉면이 노릇해지면")
- 요리 초보자도 따라할 수 있도록 전문 용어 사용 시 쉬운 설명 추가
- 단계 번호를 텍스트에 포함하지 않기 (배열 순서가 번호 역할)

### 용어 (한국식 표현 필수)
- 모든 요리명, 재료명, 조리법은 한국에서 실제로 쓰는 표현 사용
- 예시: "프라이드 에그" → "계란 후라이", "스크램블드 에그" → "계란 스크램블", "프라이드 라이스" → "볶음밥"
- "소테" → "볶음", "블랜칭" → "데치기", "그릴" → "구이", "스팀" → "찜"
- "온리" → "양파", "포테이토" → "감자", "캐럿" → "당근", "치킨" → "닭고기"
- 계량 단위도 한국식: "tsp" → "작은술", "tbsp" → "큰술", "cup" → "컵"
- 외래어 요리명도 한국에서 통용되는 이름 사용 (예: "미네스트로네" → "이탈리안 야채 수프" 또는 그대로)
- 절대 영어 원문 그대로 쓰지 않기
"""


def _get_season() -> str:
    month = datetime.now().month
    if month in (3, 4, 5):
        return "봄"
    elif month in (6, 7, 8):
        return "여름"
    elif month in (9, 10, 11):
        return "가을"
    else:
        return "겨울"


def _build_context(age: int | None) -> str:
    now = datetime.now()
    season = _get_season()
    date_str = now.strftime("%Y년 %m월 %d일")
    hour = now.hour

    if hour < 11:
        time_of_day = "아침"
    elif hour < 14:
        time_of_day = "점심"
    elif hour < 17:
        time_of_day = "오후"
    else:
        time_of_day = "저녁"

    context = f"현재: {date_str} {time_of_day}, 계절: {season}"

    if age:
        if age <= 12:
            context += f", 사용자: {age}세 어린이 (아이가 좋아하는 맛, 영양 균형 고려)"
        elif age <= 19:
            context += f", 사용자: {age}세 청소년 (성장기 영양소, 든든한 식사 고려)"
        elif age <= 35:
            context += f", 사용자: {age}세 청년 (간편하면서도 맛있는 요리 선호)"
        elif age <= 55:
            context += f", 사용자: {age}세 중년 (건강과 맛의 균형 고려)"
        else:
            context += f", 사용자: {age}세 (소화가 잘 되고 건강에 좋은 요리 고려)"

    return context


def _build_user_context(user_profile: dict | None) -> str:
    if not user_profile:
        return ""

    parts = []
    gender = user_profile.get("gender")
    if gender:
        parts.append(f"성별: {gender}")

    dietary = user_profile.get("dietary")
    if dietary:
        parts.append(f"식이 제한: {dietary}")

    if not parts:
        return ""
    return ", " + ", ".join(parts)


def _build_dietary_instruction(user_profile: dict | None) -> str:
    if not user_profile:
        return ""

    dietary = user_profile.get("dietary") or ""
    if not dietary:
        return ""

    parts = ["\n## 식이 제한 규칙 (반드시 준수):"]
    items = [d.strip() for d in dietary.split(",") if d.strip()]

    for item in items:
        if "채식" in item:
            parts.append("- 채식주의: 육류(소고기, 돼지고기, 닭고기 등)를 절대 포함하지 않기")
        if "글루텐프리" in item:
            parts.append("- 글루텐프리: 밀가루, 빵, 파스타 등 글루텐 함유 재료 제외")
        if item not in ("채식", "글루텐프리"):
            parts.append(f"- {item}: 해당 제한 사항 준수")

    return "\n".join(parts)


def _build_personalization_instruction(age: int | None) -> str:
    season = _get_season()
    parts = [
        f"\n## 개인화 추천 규칙:",
        f"- 현재 {season}이므로 제철 재료와 계절에 맞는 요리를 우선 추천",
    ]

    if season == "여름":
        parts.append("- 여름: 시원한 국물, 냉면, 냉국, 상큼한 요리 선호")
    elif season == "겨울":
        parts.append("- 겨울: 따뜻한 국물, 찌개, 전골, 뜨끈한 요리 선호")
    elif season == "봄":
        parts.append("- 봄: 봄나물, 산채, 가벼운 요리 선호")
    else:
        parts.append("- 가을: 제철 버섯, 고구마, 풍성한 가을 요리 선호")

    now = datetime.now()
    if now.hour < 11:
        parts.append("- 아침 시간대: 가볍고 속 편한 아침 식사 추천")
    elif now.hour >= 21:
        parts.append("- 야식 시간대: 간단하면서 위에 부담 적은 야식 추천")

    if age:
        if age <= 12:
            parts.append("- 어린이: 맵지 않고, 재미있는 모양/이름의 요리, 편식 방지 고려")
        elif age <= 19:
            parts.append("- 청소년: 양이 넉넉하고, 탄수화물과 단백질 충분한 요리")

    return "\n".join(parts)


def build_recipe_prompt(
    mood_emoji: str,
    mood_text: str | None,
    age: int | None = None,
    user_profile: dict | None = None,
) -> list[dict]:
    context = _build_context(age) + _build_user_context(user_profile)
    personalization = _build_personalization_instruction(age)
    dietary_instruction = _build_dietary_instruction(user_profile)

    system = (
        "당신은 따뜻한 한국 가정식 요리사입니다. "
        "사용자의 기분, 현재 날짜/시간/계절, 나이를 종합적으로 고려하여 "
        "가장 어울리는 요리 레시피를 추천해주세요. "
        "요리 초보자도 그대로 따라하면 완성할 수 있도록 상세하게 작성해야 합니다.\n\n"
        f"{_DETAIL_INSTRUCTIONS}"
        f"{personalization}"
        f"{dietary_instruction}\n\n"
        f"반드시 다음 JSON 형식으로만 응답하세요:\n{_JSON_FORMAT}"
    )

    user_parts = [f"[{context}]", mood_emoji]
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
    age: int | None = None,
    user_profile: dict | None = None,
) -> list[dict]:
    context = _build_context(age) + _build_user_context(user_profile)
    personalization = _build_personalization_instruction(age)
    dietary_instruction = _build_dietary_instruction(user_profile)

    system = (
        "당신은 따뜻한 한국 가정식 요리사입니다. "
        "아래에 여러 출처에서 수집한 레시피 후보들이 주어집니다. "
        "사용자의 기분, 현재 날짜/시간/계절, 나이를 종합적으로 고려하여 "
        "가장 어울리는 레시피를 하나 골라 한국어로 재구성해주세요. "
        "필요하면 여러 후보를 참고해 조합하거나 변형해도 좋습니다. "
        "따뜻한 공감 메시지도 함께 작성해주세요.\n\n"
        "중요: 후보의 재료와 단계 정보가 부족할 수 있습니다. "
        "그 경우 당신의 요리 지식으로 재료 분량과 조리 단계를 보완하여 "
        "초보자도 따라할 수 있도록 상세하게 완성해주세요.\n\n"
        f"{_DETAIL_INSTRUCTIONS}"
        f"{personalization}"
        f"{dietary_instruction}\n\n"
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
        f"[{context}]\n"
        f"내 기분: {mood_value}"
        + (f" ({mood_text})" if mood_text else "")
        + f"\n\n레시피 후보 목록:\n{json.dumps(candidate_summaries, ensure_ascii=False, indent=2)}"
    )

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user_content},
    ]
