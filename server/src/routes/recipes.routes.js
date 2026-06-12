import { Router } from 'express';
import { searchRecipes } from '../controllers/recipes.controller.js';

const router = Router();

router.get('/', searchRecipes);

export default router;
