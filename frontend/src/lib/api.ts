import { Recipe } from "./types";

export async function fetchRecipe(
  moodValue: string,
  moodText: string | null,
  age: number | null = null,
  token?: string
): Promise<Recipe> {
  const body: Record<string, unknown> = {
    mood_emoji: moodValue,
    mood_text: moodText,
  };
  if (age) body.age = age;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`/api/recipe`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error("레시피를 가져오는 데 실패했습니다.");
  }

  return res.json();
}
