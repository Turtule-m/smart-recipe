import React, { useEffect, useState } from 'react';
import RecipeCard from '../components/RecipeCard.jsx';
import SpinWheel from '../components/SpinWheel.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const parseIngredients = (meal) => {
  const list = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      list.push({
        name: ingredient.trim(),
        measure: measure ? measure.trim() : ''
      });
    }
  }
  return list;
};

export default function SearchPage() {
  const [ingredients, setIngredients] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [checkedIngredients, setCheckedIngredients] = useState({});

  // Spin wheel overlay states
  const [isWheelModalOpen, setIsWheelModalOpen] = useState(false);
  const [selectedWheelRecipeIds, setSelectedWheelRecipeIds] = useState([]);
  const [wheelWinner, setWheelWinner] = useState(null);

  const currentSearchItems = recipes.slice(0, 8);
  const hasSearchResults = currentSearchItems.length > 0;

  // Determine items to display on the wheel
  const wheelItems = currentSearchItems
    .filter(r => selectedWheelRecipeIds.includes(r.id))
    .map(r => r.title);

  // Disable body scroll when modal is active
  useEffect(() => {
    if (activeRecipe || isWheelModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeRecipe, isWheelModalOpen]);

  const fetchRecipes = async (query) => {
    setStatus('loading');
    setError('');
    setSelectedRecipeId(null);
    setSelectedWheelRecipeIds([]);
    setWheelWinner(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/recipes?ingredients=${encodeURIComponent(query)}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Recipe search failed');
      }

      const foundRecipes = data.recipes || [];
      setRecipes(foundRecipes);
      setStatus('success');
      
      const topRecipes = foundRecipes.slice(0, 8);
      setSelectedWheelRecipeIds(topRecipes.map(r => r.id));
    } catch (requestError) {
      setRecipes([]);
      setError(requestError.message);
      setStatus('error');
    }
  };

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
      setStatus('idle');
      return;
    }

    await fetchRecipes(query);
  };

  const handleSpinEnd = (winningIndex) => {
    const topRecipes = recipes.slice(0, 8);
    const filteredRecipes = topRecipes.filter(r => selectedWheelRecipeIds.includes(r.id));
    const winningRecipe = filteredRecipes[winningIndex];

    if (winningRecipe) {
      setWheelWinner(winningRecipe.title);

      // Dismiss the wheel modal and scroll/highlight after 2 seconds
      setTimeout(() => {
        setIsWheelModalOpen(false);
        setWheelWinner(null);
        setIsSpinning(false);
        setSelectedRecipeId(winningRecipe.id);

        setTimeout(() => {
          const cardElement = document.getElementById(`recipe-card-${winningRecipe.id}`);
          if (cardElement) {
            cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }, 2000);
    } else {
      setIsSpinning(false);
    }
  };

  const handleViewRecipe = async (recipe) => {
    setActiveRecipe({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      loading: true,
      ingredients: [],
      instructions: ''
    });
    setCheckedIngredients({});

    try {
      const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipe.id}`);
      const data = await response.json();
      const meal = data.meals?.[0];
      
      if (meal) {
        setActiveRecipe({
          id: meal.idMeal,
          title: meal.strMeal,
          image: meal.strMealThumb,
          category: meal.strCategory,
          area: meal.strArea,
          instructions: meal.strInstructions || '',
          tags: meal.strTags ? meal.strTags.split(',').map(t => t.trim()).filter(Boolean) : [],
          ingredients: parseIngredients(meal),
          loading: false
        });
      } else {
        setActiveRecipe(prev => prev ? { ...prev, loading: false } : null);
      }
    } catch (err) {
      console.error('Failed to lookup recipe details:', err);
      setActiveRecipe(prev => prev ? { ...prev, loading: false } : null);
    }
  };

  const toggleIngredient = (idx) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 text-stone-955">
      <section className="mx-auto max-w-4xl space-y-8">
        {/* Header section */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-black tracking-tight text-stone-950">Find Recipes by Ingredients</h1>
          <p className="max-w-2xl mx-auto text-stone-600">
            Search our extensive recipe database by entering the ingredients you have, or use the optional spinner helper.
          </p>
        </div>

        {/* Wide Search Panel */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 md:p-8 shadow-sm space-y-4">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="ingredients">
              Ingredients
            </label>
            <input
              id="ingredients"
              className="min-h-12 flex-1 rounded-xl border border-stone-200 bg-stone-50 px-4 text-base outline-none ring-2 ring-transparent focus:ring-red-500 focus:bg-white transition duration-200"
              type="text"
              value={ingredients}
              onChange={(event) => setIngredients(event.target.value)}
              placeholder="chicken, garlic, broccoli, tomato..."
              disabled={isSpinning}
            />
            <button
              className="min-h-12 rounded-xl bg-red-500 hover:bg-red-600 px-8 text-base font-bold text-white shadow-md transition duration-200 disabled:cursor-not-allowed disabled:bg-stone-300"
              type="submit"
              disabled={status === 'loading' || isSpinning}
            >
              {status === 'loading' ? 'Searching...' : 'Search'}
            </button>
          </form>

          {error ? <p className="text-sm font-semibold text-red-600 text-center">{error}</p> : null}

          {/* Optional Wheel Trigger Button */}
          {hasSearchResults && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setIsWheelModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 px-6 py-3.5 text-sm font-bold shadow-sm transition duration-200 transform hover:scale-[1.02]"
                type="button"
                disabled={isSpinning}
              >
                🎡 Can't Decide? Let the Wheel Choose From These Results!
              </button>
            </div>
          )}
        </div>

        {/* Recipe Results Section */}
        <div className="space-y-6">
          {recipes.length > 0 && (
            <h3 className="text-xl font-black text-stone-950">
              {status === 'loading' ? 'Searching Recipes...' : `Matched Recipes (${recipes.length})`}
            </h3>
          )}

          {status === 'loading' && (
            <div className="flex min-h-60 items-center justify-center rounded-xl border border-stone-200 bg-white p-6 text-stone-500 shadow-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
                <p className="font-semibold text-sm">Finding delicious ideas...</p>
              </div>
            </div>
          )}

          {status === 'success' && recipes.length === 0 && (
            <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-stone-500 shadow-sm">
              <p>No recipes found for those ingredients. Try something simple like "chicken" or "pasta".</p>
            </div>
          )}

          {status === 'idle' && recipes.length === 0 && (
            <div className="flex min-h-60 items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-stone-500 shadow-sm">
              <p>Enter ingredients above to find recipes. Use comma separation for multiple ingredients.</p>
            </div>
          )}

          {recipes.length > 0 && status !== 'loading' && (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {recipes.map((recipe) => {
                const isSelected = selectedRecipeId === recipe.id;
                return (
                  <div
                    key={recipe.id}
                    id={`recipe-card-${recipe.id}`}
                    className={`transition-all duration-700 rounded-lg p-1 ${
                      isSelected
                        ? 'ring-4 ring-amber-500 shadow-2xl scale-[1.03] border-amber-500 bg-amber-50/50 animate-glow'
                        : 'border border-transparent'
                    }`}
                  >
                    <RecipeCard recipe={recipe} onViewRecipe={handleViewRecipe} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Wheel Optional Overlay Modal */}
      {isWheelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-955/65 p-4 md:p-6 backdrop-blur-md transition-opacity duration-300 animate-fade-in">
          <div className="relative max-w-4xl w-full max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl flex flex-col text-stone-900 p-6 md:p-8 animate-scale-up">
            
            {/* Close Button */}
            <button
              onClick={() => setIsWheelModalOpen(false)}
              disabled={isSpinning}
              className="absolute top-4 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 transition"
              type="button"
            >
              ✕
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-black text-stone-950">Let the Wheel Choose!</h2>
              <p className="text-sm text-stone-500">
                Uncheck recipes you don't feel like eating, then spin the wheel to make a decision.
              </p>
            </div>

            {/* Inner Celebration Banner Overlay */}
            {wheelWinner && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm p-6 text-center animate-fade-in">
                <div className="mx-auto my-4 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-5xl animate-bounce">
                  🎉
                </div>
                <h3 className="text-3xl font-black text-stone-950">Dinner Decided!</h3>
                <p className="mt-4 text-xl text-stone-700 leading-normal max-w-md">
                  Looks like it's <span className="font-extrabold text-red-600 block text-2xl mt-2">{wheelWinner}</span> tonight!
                </p>
                <p className="mt-4 text-xs text-stone-400">Closing wheel and scrolling to recipe...</p>
              </div>
            )}

            {/* Split Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Left pane: Checklist of 6-8 recipes */}
              <div className="space-y-4">
                <h3 className="font-bold text-stone-850 text-base">Select recipes to include on the wheel:</h3>
                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-2">
                  {recipes.slice(0, 8).map((recipe) => {
                    const isChecked = selectedWheelRecipeIds.includes(recipe.id);
                    return (
                      <label
                        key={recipe.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
                          isChecked
                            ? 'bg-orange-50/70 border-orange-200 text-stone-900 font-semibold'
                            : 'bg-stone-50 border-stone-100 text-stone-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isSpinning}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedWheelRecipeIds(prev => prev.filter(id => id !== recipe.id));
                            } else {
                              setSelectedWheelRecipeIds(prev => [...prev, recipe.id]);
                            }
                          }}
                          className="h-4.5 w-4.5 rounded text-orange-500 border-stone-300 focus:ring-orange-500 cursor-pointer"
                        />
                        <span className="text-sm truncate flex-1">{recipe.title}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedWheelRecipeIds(recipes.slice(0, 8).map(r => r.id))}
                    disabled={isSpinning}
                    className="text-xs font-bold text-stone-500 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition"
                    type="button"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedWheelRecipeIds([])}
                    disabled={isSpinning}
                    className="text-xs font-bold text-stone-500 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition"
                    type="button"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Right pane: Spinner Wheel */}
              <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-stone-100 pt-6 md:pt-0 md:pl-8">
                <SpinWheel 
                  items={wheelItems}
                  onSpinStart={() => setIsSpinning(true)}
                  onSpinEnd={handleSpinEnd}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Modal Overlay */}
      {activeRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-955/65 p-4 md:p-6 backdrop-blur-md transition-opacity duration-300 animate-fade-in">
          {/* Scrollable Modal Card */}
          <div className="relative max-w-3xl w-full max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl flex flex-col text-stone-900 animate-scale-up">
            
            {/* Close Button */}
            <button
              onClick={() => setActiveRecipe(null)}
              className="absolute top-4 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-stone-950/80 text-white shadow-md hover:bg-stone-950 transition backdrop-blur-sm"
              aria-label="Close recipe details"
              type="button"
            >
              <span className="text-lg font-bold">✕</span>
            </button>

            {activeRecipe.loading ? (
              <div className="flex flex-col items-center justify-center py-24 px-6 space-y-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
                <p className="text-sm font-semibold text-stone-500">Retrieving culinary details...</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Header Image section */}
                <div className="relative h-64 md:h-80 w-full overflow-hidden">
                  <img 
                    src={activeRecipe.image} 
                    alt={activeRecipe.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-6 text-white space-y-2.5">
                    <h2 className="text-2xl md:text-3xl font-black leading-tight drop-shadow-sm">
                      {activeRecipe.title}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {activeRecipe.category && (
                        <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                          {activeRecipe.category}
                        </span>
                      )}
                      {activeRecipe.area && (
                        <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                          {activeRecipe.area}
                        </span>
                      )}
                      {activeRecipe.tags && activeRecipe.tags.map((tag, i) => (
                        <span key={i} className="rounded-full bg-stone-700/80 px-3 py-1 text-xs font-medium text-stone-100">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 md:p-8 space-y-8">
                  {/* Ingredients section */}
                  <div>
                    <h3 className="text-lg font-extrabold text-stone-900 mb-4 flex items-center gap-2">
                      📝 Ingredients checklist
                    </h3>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {activeRecipe.ingredients.map((item, idx) => {
                        const isChecked = !!checkedIngredients[idx];
                        return (
                          <li 
                            key={idx}
                            onClick={() => toggleIngredient(idx)}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
                              isChecked 
                                ? 'bg-emerald-50/70 border-emerald-200 text-stone-400 line-through' 
                                : 'bg-stone-50 border-stone-100 text-stone-800 hover:bg-stone-100/70'
                            }`}
                          >
                            <span className={`w-5 h-5 flex items-center justify-center rounded border transition-all ${
                              isChecked
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-stone-300 bg-white hover:border-stone-400'
                            }`}>
                              {isChecked && (
                                <svg className="w-3.5 h-3.5 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </span>
                            <span className="text-sm font-medium">
                              {item.measure && (
                                <span className={`font-semibold mr-1.5 ${isChecked ? 'text-stone-400' : 'text-stone-900'}`}>
                                  {item.measure}
                                </span>
                              )}
                              {item.name}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-stone-200 w-full" />

                  {/* Cooking Steps Pane */}
                  <div>
                    <h3 className="text-lg font-extrabold text-stone-900 mb-4 flex items-center gap-2">
                      🍳 Instructions
                    </h3>
                    <div className="space-y-4 text-stone-700 leading-relaxed font-normal text-sm md:text-base">
                      {activeRecipe.instructions.split(/\r?\n/).map((paragraph, idx) => {
                        const clean = paragraph.trim();
                        if (!clean) return null;
                        return <p key={idx}>{clean}</p>;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style>{`
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 12px rgba(245, 158, 11, 0.4); }
          50% { box-shadow: 0 0 25px rgba(245, 158, 11, 0.8); }
        }
        .animate-glow {
          animation: glowPulse 2s infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </main>
  );
}
