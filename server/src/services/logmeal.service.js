import FormData from 'form-data';
import fetch from 'node-fetch';

const SEGMENTATION_URL = 'https://api.logmeal.com/v2/image/segmentation/complete';
const INGREDIENTS_URL = 'https://api.logmeal.com/v2/nutrition/recipe/ingredients';

const parseJsonResponse = async (response, serviceName) => {
  const body = await response.text();
  const data = body ? JSON.parse(body) : {};

  if (!response.ok) {
    const error = new Error(`${serviceName} request failed`);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
};

export const identifyIngredientsFromImage = async (file) => {
  const token = process.env.LOGMEAL_TOKEN;

  if (!token) {
    const error = new Error('LOGMEAL_TOKEN is not configured');
    error.status = 500;
    throw error;
  }

  const formData = new FormData();
  formData.append('image', file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  const segmentationResponse = await fetch(SEGMENTATION_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...formData.getHeaders(),
    },
    body: formData,
  });

  const segmentation = await parseJsonResponse(segmentationResponse, 'LogMeal segmentation');
  const imageId = segmentation.imageId;

  if (!imageId) {
    const error = new Error('LogMeal did not return an imageId');
    error.status = 502;
    throw error;
  }

  const ingredientsResponse = await fetch(INGREDIENTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageId }),
  });

 const nutrition = await parseJsonResponse(ingredientsResponse, 'LogMeal ingredients');

  //  FIX: Parse the structure precisely matching the LogMeal API payload
  let extractedIngredients = [];

  // Check if LogMeal sent a per-dish breakdown
  if (nutrition.recipe_per_item && nutrition.recipe_per_item.length > 0) {
    nutrition.recipe_per_item.forEach(item => {
      if (item.recipe) {
        item.recipe.forEach(ing => {
          if (ing.name) extractedIngredients.push(ing.name);
        });
      }
    });
  } 
  // Fallback to the global/flat recipe array
  else if (nutrition.recipe && nutrition.recipe.length > 0) {
    nutrition.recipe.forEach(ing => {
      if (ing.name) extractedIngredients.push(ing.name);
    });
  }

  // Deduplicate and filter out empty entries
  return [...new Set(extractedIngredients)].filter(Boolean);
};