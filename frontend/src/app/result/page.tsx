"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RecipeCard from "@/components/RecipeCard";
import ShareButtons from "@/components/ShareButtons";
import { Recipe } from "@/lib/types";

export default function ResultPage() {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [recipe] = useState<Recipe | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = sessionStorage.getItem("moodish_recipe");
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!recipe) {
      router.replace("/");
    }
  }, [recipe, router]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (key && window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(key);
    }
  }, []);

  if (!recipe) return null;

  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-12">
      <main className="flex w-full max-w-md flex-col gap-5">
        <RecipeCard ref={cardRef} recipe={recipe} />
        <ShareButtons recipe={recipe} cardRef={cardRef} />
        <button
          onClick={() => router.push("/")}
          className="w-full rounded-2xl border-2 border-orange-200 py-3 text-sm font-semibold text-stone-600 transition-colors hover:bg-orange-50"
        >
          다른 레시피 받기
        </button>
      </main>
    </div>
  );
}
