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
        className="overflow-hidden rounded-2xl border border-[#BDD5EA] bg-white shadow-sm"
      >
        <div className="bg-[#BDD5EA]/20 p-5">
          <p className="text-base italic text-[#FE5F55]">{recipe.reaction}</p>
        </div>

        <div className="p-6">
          <h2 className="mb-2 text-2xl font-bold text-[#495867]">
            {recipe.recipe_name}
          </h2>

          <p className="mb-5 text-sm italic text-[#577399]">
            {recipe.description}
          </p>

          <div className="mb-5 flex gap-2">
            <span className="rounded-full bg-[#BDD5EA]/30 px-3 py-1 text-sm text-[#577399]">
              {recipe.cooking_time}
            </span>
            <span className="rounded-full bg-[#BDD5EA]/30 px-3 py-1 text-sm text-[#577399]">
              {recipe.difficulty}
            </span>
          </div>

          <div className="mb-5">
            <h3 className="mb-2 text-sm font-semibold text-[#495867]">재료</h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-[#495867]">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${ing.optional ? "bg-[#BDD5EA]" : "bg-[#FE5F55]"}`} />
                  <span>
                    {ing.name}{" "}
                    <span className="text-[#577399]">{ing.amount}</span>
                    {ing.optional && (
                      <span className="ml-1 text-xs text-[#BDD5EA]">(생략 가능)</span>
                    )}
                    {ing.substitute && (
                      <span className="block text-xs text-[#577399]/70">
                        → 대체: {ing.substitute}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-[#495867]">만드는 법</h3>
            <ol className="flex flex-col gap-3 text-sm text-[#495867]">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#FE5F55] text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    );
  }
);

RecipeCard.displayName = "RecipeCard";

export default RecipeCard;
