import './config/env.js';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import dietRoutes from './routes/diet.routes.js';
import identifyIngredientsRoutes from './routes/identifyIngredients.routes.js';
import recipesRoutes from './routes/recipes.routes.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/identify-ingredients', identifyIngredientsRoutes);
app.use('/api/recipes', recipesRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

export default app;
