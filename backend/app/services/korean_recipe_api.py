import logging
import os
import random

import httpx

logger = logging.getLogger(__name__)

API_TIMEOUT = 10.0


async def fetch_korean_recipes(keyword: str | None = None) -> list[dict]:
    api_key = os.getenv("KOREAN_RECIPE_API_KEY")
    if not api_key:
        logger.warning("KOREAN_RECIPE_API_KEY not set")
        return []

    try:
        # 랜덤 구간에서 10개 가져오기
        start = random.randint(1, 100)
        end = start + 9
        url = f"http://openapi.foodsafetykorea.go.kr/api/{api_key}/COOKRCP01/json/{start}/{end}"

        async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

        rows = data.get("COOKRCP01", {}).get("row", [])
        if not rows:
            return []

        # 키워드 필터링
        if keyword:
            rows = [r for r in rows if keyword in r.get("RCP_NM", "") or keyword in r.get("RCP_PARTS_DTLS", "")]
            if not rows:
                return []

        results = []
        for r in rows:
            steps = []
            for i in range(1, 21):
                step = r.get(f"MANUAL{i:02d}", "")
                if step and step.strip():
                    steps.append(step.strip())

            results.append({
                "source": "korean",
                "name": r.get("RCP_NM", ""),
                "ingredients": r.get("RCP_PARTS_DTLS", ""),
                "steps": steps,
                "category": r.get("RCP_PAT2", ""),
                "calories": r.get("INFO_ENG", ""),
            })

        return results

    except Exception:
        logger.exception("공공데이터포털 API 호출 실패")
        return []
