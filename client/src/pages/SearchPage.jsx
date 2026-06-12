import React, { useMemo, useState } from 'react';
import RecipeCard from '../components/RecipeCard.jsx';
import SpinWheel from '../components/SpinWheel.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function SearchPage() {
  const [ingredients, setIngredients] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const recipeNames = useMemo(() => recipes.map((recipe) => recipe.title), [recipes]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const query = ingredients
      .split(',')
      .map((ingredient) => ingredient.trim())
      .filter(Boolean)
      .join(',');

    if (!query) {
      setError('Enter at least one ingredient.');
      setRecipes([]);
      setSelectedRecipe(null);
      setStatus('idle');
      return;
    }

    setStatus('loading');
    setError('');
    setSelectedRecipe(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/recipes?ingredients=${encodeURIComponent(query)}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Recipe search failed');
      }

      setRecipes(data.recipes || []);
      setStatus('success');
    } catch (requestError) {
      setRecipes([]);
      setSelectedRecipe(null);
      setError(requestError.message);
      setStatus('error');
    }
  };

  const handleWheelSelect = (selectedIndex) => {
    setSelectedRecipe(selectedIndex === null ? null : recipes[selectedIndex]);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <section className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Find recipes by ingredients</h1>
          <p className="max-w-2xl text-slate-600">
            Search the free TheMealDB catalog with one or more comma-separated ingredients.
          </p>
        </div>

        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="ingredients">
            Ingredients
          </label>
          <input
            id="ingredients"
            className="min-h-11 flex-1 rounded-md border border-slate-300 bg-white px-4 text-base outline-none ring-emerald-700 transition focus:ring-2"
            type="text"
            value={ingredients}
            onChange={(event) => setIngredients(event.target.value)}
            placeholder="chicken breast, garlic"
          />
          <button
            className="min-h-11 rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            type="submit"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

        {status === 'success' && recipes.length === 0 ? (
          <p className="text-slate-600">No recipes found for those ingredients.</p>
        ) : null}

        {recipes.length > 0 ? (
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
            <SpinWheel recipeNames={recipeNames} onSelect={handleWheelSelect} />

            <div className="min-h-80">
              {selectedRecipe ? (
                <RecipeCard recipe={selectedRecipe} />
              ) : (
                <div className="flex min-h-80 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 text-center text-slate-600">
                  Spin the wheel to pick one of the matching recipes.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
