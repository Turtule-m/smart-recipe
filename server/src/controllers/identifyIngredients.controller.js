import { identifyIngredientsFromImage } from '../services/logmeal.service.js';
import { fetchMealsByIngredient } from '../services/themealdb.service.js';

/**
 * Sanitizes ingredient names from LogMeal to match TheMealDB expectations.
 * (e.g., "Tomatoes" -> "tomato", "fresh_tomato" -> "tomato")
 */
function sanitizeIngredient(name) {
  if (!name) return '';
  
  let clean = name.toLowerCase().trim();
  
  // Strip out common descriptive prefixes or underscores
  clean = clean.replace(/^(fresh|red|ripe|raw|cooked|green|sweet)[_\s]*/, '');
  clean = clean.replace(/_/g, ' ');
  
  // Convert common plurals to singular forms
  if (clean.endsWith('oes')) {
    clean = clean.slice(0, -2); // tomatoes -> tomato
  } else if (clean.endsWith('s') && !clean.endsWith('ss')) {
    clean = clean.slice(0, -1); // onions -> onion, mushrooms -> mushroom
  }
  
  return clean.trim();
}

export const identifyIngredients = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    // 1. Fetch raw strings using the newly fixed data mapper in service file
    const ingredients = await identifyIngredientsFromImage(req.file);
    
    console.log('============= LOGMEAL DETECTION =============');
    console.log('Raw ingredients array returned:', ingredients);

    let meals = [];
    
    if (ingredients.length > 0) {
      // 2. Sanitize the primary ingredient string
      const rawPrimary = ingredients[0];
      const sanitizedPrimary = sanitizeIngredient(rawPrimary);
      
      console.log(`🔎 Target Ingredient: "${rawPrimary}" -> Sanitized to: "${sanitizedPrimary}"`);
      console.log('==============================================');

      // 3. Query TheMealDB with the cleaned string
      meals = await fetchMealsByIngredient(sanitizedPrimary);
    } else {
      console.log('⚠️ No ingredients were extracted from the API payload.');
      console.log('==============================================');
    }

    res.json({ ingredients, meals });
  } catch (error) {
    console.error('❌ Error in identifyIngredients controller:', error);
    next(error);
  }
};