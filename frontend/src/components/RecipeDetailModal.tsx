"use client";

import { useEffect, useState } from "react";
import { fetchRecipeDetail } from "@/lib/recipebook-api";
import { RecipeBookItem } from "@/lib/types";
import { XIcon, ClockIcon } from "./Icons";

type RecipeDetail = RecipeBookItem & { steps: string[]; description: string };

function cuisineBadgeColor(cuisine: string) {
  switch (cuisine) {
    case "한식":
      return "bg-[#FE5F55]/10 text-[#FE5F55]";
    case "중식":
      return "bg-red-100 text-red-600";
    case "양식":
      return "bg-blue-100 text-blue-600";
    case "일식":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-100 text-gray-500";
  }
}

export default function RecipeDetailModal({
  recipeId,
  onClose,
}: {
  recipeId: number | null;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!recipeId) {
      setDetail(null); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchRecipeDetail(recipeId)
      .then((data) => { if (!cancelled) setDetail(data); })
      .catch(() => { if (!cancelled) setDetail(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [recipeId]);

  useEffect(() => {
    if (!recipeId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [recipeId, onClose]);

  if (!recipeId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#577399] hover:text-[#495867] transition-colors"
          aria-label="닫기"
        >
          <XIcon className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-2/3 rounded bg-[#BDD5EA]/40" />
            <div className="h-4 w-1/3 rounded bg-[#BDD5EA]/30" />
            <div className="h-20 rounded bg-[#BDD5EA]/20" />
            <div className="h-32 rounded bg-[#BDD5EA]/20" />
          </div>
        ) : detail ? (
          <div className="space-y-5">
            <div>
              <h2 className="pr-8 text-xl font-bold text-[#495867]">
                {detail.name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {detail.cuisine && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cuisineBadgeColor(detail.cuisine)}`}
                  >
                    {detail.cuisine}
                  </span>
                )}
                {detail.category && (
                  <span className="rounded-full bg-[#BDD5EA]/30 px-3 py-1 text-xs text-[#577399]">
                    {detail.category}
                  </span>
                )}
              </div>
            </div>

            {detail.description && (
              <p className="text-sm leading-relaxed text-[#577399]">
                {detail.description}
              </p>
            )}

            <div className="flex gap-4 text-xs text-[#577399]">
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                {detail.cooking_time}
              </span>
              <span>{detail.difficulty}</span>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-[#495867]">
                재료
              </h3>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-[#577399]">
                {detail.ingredients
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
                  .map((item, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FE5F55]" />
                      {item}
                    </li>
                  ))}
              </ul>
            </div>

            {detail.steps && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-[#495867]">
                  조리 순서
                </h3>
                <ol className="space-y-2 text-sm text-[#577399]">
                  {(Array.isArray(detail.steps) ? detail.steps : [detail.steps]).map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#BDD5EA]/30 text-xs font-semibold text-[#577399]">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-[#577399]">
            레시피 정보를 불러올 수 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
