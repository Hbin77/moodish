"use client";

import { useEffect, useState } from "react";
import { fetchRecipeDetail } from "@/lib/recipebook-api";
import { RecipeBookItem } from "@/lib/types";
import { XIcon, ClockIcon } from "./Icons";

type RecipeDetail = RecipeBookItem & { steps: string; description: string };

function sourceLabel(source: string) {
  switch (source) {
    case "korean":
      return "한국 레시피";
    case "spoonacular":
      return "글로벌";
    case "themealdb":
      return "TheMealDB";
    default:
      return source;
  }
}

function sourceDotColor(source: string) {
  switch (source) {
    case "korean":
      return "bg-[#FE5F55]";
    case "spoonacular":
      return "bg-[#577399]";
    case "themealdb":
      return "bg-emerald-500";
    default:
      return "bg-gray-400";
  }
}

function parseSteps(steps: string): string[] {
  try {
    const parsed = JSON.parse(steps);
    if (Array.isArray(parsed)) return parsed;
    return [String(parsed)];
  } catch {
    return steps.split("\n").filter((s) => s.trim());
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
  const [prevId, setPrevId] = useState<number | null>(null);

  if (recipeId !== prevId) {
    setPrevId(recipeId);
    if (!recipeId) {
      setDetail(null);
      setLoading(false);
    } else {
      setLoading(true);
      fetchRecipeDetail(recipeId)
        .then(setDetail)
        .catch(() => setDetail(null))
        .finally(() => setLoading(false));
    }
  }

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
                <span className="rounded-full bg-[#BDD5EA]/30 px-3 py-1 text-xs text-[#577399]">
                  {detail.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-[#577399]">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${sourceDotColor(detail.source)}`}
                  />
                  {sourceLabel(detail.source)}
                </span>
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
                  {parseSteps(detail.steps).map((step, i) => (
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
