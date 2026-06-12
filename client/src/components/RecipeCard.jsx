import React from 'react';
export default function RecipeCard({ recipe }) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <img className="h-48 w-full object-cover" src={recipe.image} alt={recipe.title} />
      <div className="space-y-4 p-4">
        <h2 className="text-lg font-semibold text-slate-950">{recipe.title}</h2>
        <a
          className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
          href={`https://www.themealdb.com/meal/${recipe.id}`}
          target="_blank"
          rel="noreferrer"
        >
          View Recipe
        </a>
      </div>
    </article>
  );
}
