"use client";

import { forwardRef } from "react";
import { Recipe } from "@/lib/types";

interface RecipeCardProps {
  recipe: Recipe;
}

const RecipeCard = forwardRef<HTMLDivElement, RecipeCardProps>(
  ({ recipe }, ref) => {
    return (
      <div
        ref={ref}
        className="rounded-3xl border-2 border-orange-100 bg-white p-6 shadow-sm"
      >
        <p className="mb-4 text-sm italic text-amber-600">{recipe.reaction}</p>

        <h2 className="mb-2 text-2xl font-bold text-stone-800">
          {recipe.recipe_name}
        </h2>

        <p className="mb-5 text-sm text-stone-500">{recipe.description}</p>

        <div className="mb-4 flex gap-2">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            {recipe.cooking_time}
          </span>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
            {recipe.difficulty}
          </span>
        </div>

        <div className="mb-5">
          <h3 className="mb-2 text-sm font-semibold text-stone-700">재료</h3>
          <ul className="grid grid-cols-2 gap-1 text-sm text-stone-600">
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>
                {ing.name}{" "}
                <span className="text-stone-400">{ing.amount}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-stone-700">만드는 법</h3>
          <ol className="flex flex-col gap-2 text-sm text-stone-600">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="flex-shrink-0 font-semibold text-amber-500">
                  {i + 1}.
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }
);

RecipeCard.displayName = "RecipeCard";

export default RecipeCard;
