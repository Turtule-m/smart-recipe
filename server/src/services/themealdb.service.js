const MEALDB_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

const normalizeIngredient = (ingredient) =>
  String(ingredient || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

const toRecipeSummary = (meal) => ({
  id: meal.idMeal,
  title: meal.strMeal,
  image: meal.strMealThumb,
});

export const fetchMealsByIngredient = async (ingredient) => {
  const url = `${MEALDB_BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TheMealDB request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.meals || [];
};

export const findRecipesByIngredients = async (rawIngredients) => {
  const ingredients = rawIngredients.map(normalizeIngredient).filter(Boolean);

  if (ingredients.length === 0) {
    return [];
  }

  const mealGroups = await Promise.all(ingredients.map(fetchMealsByIngredient));
  const [firstGroup, ...remainingGroups] = mealGroups;
  const remainingMealIds = remainingGroups.map((group) => new Set(group.map((meal) => meal.idMeal)));

  return firstGroup
    .filter((meal) => remainingMealIds.every((ids) => ids.has(meal.idMeal)))
    .map(toRecipeSummary);
};
