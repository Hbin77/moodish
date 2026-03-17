import { Recipe } from "./types";

export async function fetchRecipe(
  moodEmoji: string,
  moodText: string | null
): Promise<Recipe> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/recipe`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood_emoji: moodEmoji, mood_text: moodText }),
    }
  );

  if (!res.ok) {
    throw new Error("레시피를 가져오는 데 실패했습니다.");
  }

  return res.json();
}
