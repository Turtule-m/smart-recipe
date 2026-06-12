import { findRecipesByIngredients } from '../services/themealdb.service.js';

export const searchRecipes = async (req, res, next) => {
  try {
    const ingredients = String(req.query.ingredients || '')
      .split(',')
      .map((ingredient) => ingredient.trim())
      .filter(Boolean);

    if (ingredients.length === 0) {
      return res.status(400).json({ message: 'At least one ingredient is required' });
    }

    const recipes = await findRecipesByIngredients(ingredients);

    res.json({ recipes });
  } catch (error) {
    next(error);
  }
};
