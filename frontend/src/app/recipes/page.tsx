"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RecipeDetailModal from "@/components/RecipeDetailModal";
import { ClockIcon } from "@/components/Icons";
import { fetchRecipeBook, fetchCategories } from "@/lib/recipebook-api";
import { RecipeBookItem, CategoryItem } from "@/lib/types";

const CUISINE_TABS = [
  { label: "전체", value: "" },
  { label: "한식", value: "한식" },
  { label: "중식", value: "중식" },
  { label: "양식", value: "양식" },
  { label: "일식", value: "일식" },
];

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

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-[#BDD5EA]/50 bg-white p-5">
      <div className="mb-3 h-4 w-2/3 rounded bg-[#BDD5EA]/30" />
      <div className="mb-2 h-3 w-1/3 rounded bg-[#BDD5EA]/20" />
      <div className="h-3 w-1/2 rounded bg-[#BDD5EA]/20" />
    </div>
  );
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeBookItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRecipeBook({
        page,
        category: category || undefined,
        search: debouncedSearch || undefined,
        cuisine: cuisine || undefined,
      });
      setRecipes(data.recipes);
      setTotalPages(data.pages);
    } catch {
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [page, category, debouncedSearch, cuisine]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat === category ? "" : cat);
    setPage(1);
  };

  const handleCuisineChange = (c: string) => {
    setCuisine(c);
    setPage(1);
  };

  const pageNumbers = () => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F7F7FF] px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-[#495867] md:text-4xl">
              레시피 북
            </h1>
            <p className="mt-2 text-[#577399]">
              다양한 레시피를 둘러보고 마음에 드는 요리를 찾아보세요.
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#577399]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              type="text"
              placeholder="레시피 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#BDD5EA]/50 bg-white py-3 pl-10 pr-4 text-sm text-[#495867] placeholder-[#577399]/50 outline-none transition-shadow focus:border-[#577399] focus:shadow-sm"
            />
          </div>

          {/* Cuisine tabs */}
          <div className="mb-4 flex gap-1 rounded-xl bg-white p-1 border border-[#BDD5EA]/30">
            {CUISINE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleCuisineChange(tab.value)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  cuisine === tab.value
                    ? "bg-[#495867] text-white"
                    : "text-[#577399] hover:bg-[#BDD5EA]/20"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category filters */}
          {categories.length > 0 && (
            <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => handleCategoryChange(cat.category)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    category === cat.category
                      ? "bg-[#577399] text-white"
                      : "bg-[#BDD5EA]/30 text-[#577399] hover:bg-[#BDD5EA]/50"
                  }`}
                >
                  {cat.category} ({cat.count})
                </button>
              ))}
            </div>
          )}

          {/* Recipe grid */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-lg font-medium text-[#495867]">
                아직 레시피가 없습니다.
              </p>
              <p className="mt-1 text-sm text-[#577399]">
                잠시 후 다시 확인해주세요.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => setSelectedId(recipe.id)}
                  className="rounded-2xl border border-[#BDD5EA]/50 bg-white p-5 text-left shadow-sm transition hover:shadow-md"
                >
                  <h3 className="mb-2 font-bold text-[#495867] line-clamp-1">
                    {recipe.name}
                  </h3>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {recipe.cuisine && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cuisineBadgeColor(recipe.cuisine)}`}
                      >
                        {recipe.cuisine}
                      </span>
                    )}
                    {recipe.category && (
                      <span className="rounded-full bg-[#BDD5EA]/30 px-3 py-1 text-xs text-[#577399]">
                        {recipe.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#577399]">
                    {recipe.cooking_time && (
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {recipe.cooking_time}
                      </span>
                    )}
                    {recipe.difficulty && <span>{recipe.difficulty}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#577399] transition-colors hover:bg-[#BDD5EA]/20 disabled:opacity-40"
              >
                이전
              </button>
              {pageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`min-w-[36px] rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-[#495867] text-white"
                      : "text-[#577399] hover:bg-[#BDD5EA]/20"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#577399] transition-colors hover:bg-[#BDD5EA]/20 disabled:opacity-40"
              >
                다음
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <RecipeDetailModal
        recipeId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}
