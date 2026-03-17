"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MoodSelector from "./MoodSelector";
import MoodTextInput from "./MoodTextInput";
import LoadingSpinner from "./LoadingSpinner";
import { fetchRecipe } from "@/lib/api";

export default function MoodForm() {
  const router = useRouter();
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [moodText, setMoodText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = selectedEmoji || moodText.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const recipe = await fetchRecipe(
        selectedEmoji ?? "",
        moodText.trim() || null
      );
      sessionStorage.setItem("moodish_recipe", JSON.stringify(recipe));
      router.push("/result");
    } catch {
      setError("레시피를 가져오는 데 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <MoodSelector selected={selectedEmoji} onSelect={setSelectedEmoji} />
      <MoodTextInput value={moodText} onChange={setMoodText} />
      {error && <p className="text-center text-sm text-red-500">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full rounded-2xl bg-amber-500 py-4 text-lg font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        오늘의 레시피 받기
      </button>
    </div>
  );
}
