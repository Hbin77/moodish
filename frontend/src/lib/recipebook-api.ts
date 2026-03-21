import { RecipeBookResponse, RecipeBookItem, CategoryItem } from "./types";

export async function fetchRecipeBook(params: {
  page?: number;
  category?: string;
  search?: string;
  source?: string;
}): Promise<RecipeBookResponse> {
  const searchParams = new URLSearchParams();
  if (params.page != null) searchParams.set("page", String(params.page));
  if (params.category) searchParams.set("category", params.category);
  if (params.search) searchParams.set("search", params.search);
  if (params.source) searchParams.set("source", params.source);

  const res = await fetch(`/api/recipebook/recipes?${searchParams.toString()}`);
  if (!res.ok) {
    throw new Error("레시피 목록을 가져오는 데 실패했습니다.");
  }
  return res.json();
}

export async function fetchRecipeDetail(
  id: number
): Promise<RecipeBookItem & { steps: string; description: string }> {
  const res = await fetch(`/api/recipebook/recipes/${id}`);
  if (!res.ok) {
    throw new Error("레시피 상세 정보를 가져오는 데 실패했습니다.");
  }
  return res.json();
}

export async function fetchCategories(): Promise<CategoryItem[]> {
  const res = await fetch(`/api/recipebook/categories`);
  if (!res.ok) {
    throw new Error("카테고리를 가져오는 데 실패했습니다.");
  }
  return res.json();
}
