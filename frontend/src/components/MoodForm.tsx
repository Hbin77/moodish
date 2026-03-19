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
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = selectedMood || moodText.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const ageNum = user?.age ?? (age ? parseInt(age, 10) : null);
      const recipe = await fetchRecipe(
        selectedMood || "",
        moodText.trim() || null,
        ageNum,
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
      <MoodSelector selected={selectedMood} onSelect={setSelectedMood} />
      <MoodTextInput value={moodText} onChange={setMoodText} />

      {!user && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#577399]">
            나이 (선택)
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="나이를 입력하면 맞춤 추천을 해드려요"
            min={1}
            max={120}
            className="w-full rounded-xl border border-[#BDD5EA] bg-white px-4 py-3 text-[#495867] placeholder:text-[#577399]/50 focus:border-[#FE5F55] focus:outline-none focus:ring-2 focus:ring-[#FE5F55]/20"
          />
        </div>
      )}

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
