"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RecipeCard from "@/components/RecipeCard";
import ShareButtons from "@/components/ShareButtons";
import { Recipe } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

export default function ResultPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
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
    if (!loading && !user) {
      router.replace("/login");
    } else if (!recipe) {
      router.replace("/mood");
    }
  }, [recipe, user, loading, router]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (key && window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(key);
    }
  }, []);

  if (loading || !user || !recipe) return null;

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen items-start justify-center px-4 pt-28 pb-16">
        <div className="flex w-full max-w-md flex-col gap-5">
          <RecipeCard ref={cardRef} recipe={recipe} />
          <ShareButtons recipe={recipe} cardRef={cardRef} />
          <button
            onClick={() => router.push("/mood")}
            className="w-full rounded-full border-2 border-[#BDD5EA] py-3 text-sm font-semibold text-[#495867] transition-colors hover:bg-[#BDD5EA]/20"
          >
            다른 레시피 받기
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
