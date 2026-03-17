export interface MoodOption {
  emoji: string;
  label: string;
  value: string;
}

export interface Ingredient {
  name: string;
  amount: string;
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
