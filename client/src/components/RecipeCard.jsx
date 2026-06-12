import React from 'react';

export default function RecipeCard({ recipe, onViewRecipe }) {
  return (
    <article className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition hover:shadow-md flex flex-col h-full">
      <img className="h-48 w-full object-cover" src={recipe.image} alt={recipe.title} />
      <div className="flex flex-col flex-1 p-4 justify-between space-y-4">
        <h2 className="text-base font-bold text-stone-900 leading-snug line-clamp-2">{recipe.title}</h2>
        <button
          className="w-full inline-flex items-center justify-center rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-600"
          onClick={() => onViewRecipe && onViewRecipe(recipe)}
          type="button"
        >
          View Recipe
        </button>
      </div>
    </article>
  );
}
