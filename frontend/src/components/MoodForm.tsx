"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MoodSelector from "./MoodSelector";
import MoodTextInput from "./MoodTextInput";
import LoadingSpinner from "./LoadingSpinner";
import { fetchRecipe } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function MoodForm() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodText, setMoodText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = selectedMood || moodText.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const recipe = await fetchRecipe(
        selectedMood || "neutral",
        moodText.trim() || null,
        user?.age ?? null,
        token || undefined
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
      <h1 className="text-2xl font-bold text-[#495867]">오늘 기분이 어때요?</h1>
      {user && (
        <p className="text-sm text-[#577399]">
          {user.name}님, 프로필 정보를 바탕으로 맞춤 추천해드릴게요.
        </p>
      )}
      <MoodSelector selected={selectedMood} onSelect={setSelectedMood} />
      <MoodTextInput value={moodText} onChange={setMoodText} />
      {error && <p className="text-center text-sm text-red-500">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full rounded-full bg-[#FE5F55] py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#e5534b] disabled:cursor-not-allowed disabled:bg-[#BDD5EA] disabled:text-[#577399]"
      >
        오늘의 레시피 받기
      </button>
    </div>
  );
}
