export interface MoodOption {
  icon: string;
  label: string;
  value: string;
}

export interface Ingredient {
  name: string;
  amount: string;
  optional?: boolean;
  substitute?: string | null;
}

export interface Recipe {
  reaction: string;
  recipe_name: string;
  ingredients: Ingredient[];
  steps: string[];
  cooking_time: string;
  difficulty: string;
  description: string;
}

export interface RecipeBookItem {
  id: number;
  name: string;
  category: string;
  ingredients: string;
  cooking_time: string;
  difficulty: string;
  source: string;
  cuisine: string;
  image_url: string;
}

export interface RecipeBookResponse {
  recipes: RecipeBookItem[];
  total: number;
  page: number;
  pages: number;
}

export interface CategoryItem {
  category: string;
  count: number;
}
