import React, { useState } from 'react';
import RecipeCard from '../components/RecipeCard.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const toRecipeCard = (meal) => ({
  id: meal.id || meal.idMeal,
  title: meal.title || meal.strMeal,
  image: meal.image || meal.strMealThumb,
});

export default function PictureToRecipe() {
  const [ingredients, setIngredients] = useState([]);
  const [meals, setMeals] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setStatus('loading');
    setError('');
    setIngredients([]);
    setMeals([]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/identify-ingredients`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Image ingredient detection failed');
      }

      setIngredients(data.ingredients || []);
      setMeals(data.meals || []);
      setStatus('success');
    } catch (requestError) {
      setError(requestError.message);
      setStatus('error');
    }
  };

  const removeIngredient = (ingredientToRemove) => {
    setIngredients((currentIngredients) =>
      currentIngredients.filter((ingredient) => ingredient !== ingredientToRemove),
    );
  };

  const recipeCards = meals.map(toRecipeCard);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <section className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Picture to recipe</h1>
          <p className="max-w-2xl text-slate-600">
            Upload a food photo to detect ingredients and get recipe matches.
          </p>
        </div>

        <label className="block max-w-xl">
          <span className="mb-2 block text-sm font-medium text-slate-700">Food image</span>
          <input
            className="block w-full rounded-md border border-slate-300 bg-white text-sm text-slate-700 file:mr-4 file:min-h-11 file:border-0 file:bg-emerald-700 file:px-4 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-800"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
        </label>

        {status === 'loading' ? <p className="text-slate-600">Analyzing image...</p> : null}
        {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

        {ingredients.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {ingredients.map((ingredient) => (
              <button
                key={ingredient}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-900 transition hover:border-emerald-500"
                type="button"
                onClick={() => removeIngredient(ingredient)}
              >
                {ingredient} x
              </button>
            ))}
          </div>
        ) : null}

        {status === 'success' && recipeCards.length === 0 ? (
          <p className="text-slate-600">No meals found for the detected ingredients.</p>
        ) : null}

        {recipeCards.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recipeCards.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
