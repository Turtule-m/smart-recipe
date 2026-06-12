import { Router } from 'express';

const router = Router();

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENTS = {
  weight_loss: -500,
  maintain: 0,
  muscle_gain: 300,
};

const MOCK_NUTRIENTS_BY_MEAL_ID = {
  '52772': {
    mealId: '52772',
    title: 'Teriyaki Chicken Casserole',
    calories: 476,
    proteinGrams: 38,
    carbsGrams: 42,
    fatGrams: 18,
    fiberGrams: 5,
  },
  '52959': {
    mealId: '52959',
    title: 'Baked Salmon with Fennel and Tomatoes',
    calories: 392,
    proteinGrams: 34,
    carbsGrams: 12,
    fatGrams: 23,
    fiberGrams: 4,
  },
};

const toNumber = (value) => Number.parseFloat(value);

const normalizeGoal = (goal) =>
  String(goal || 'maintain')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

const normalizeActivityLevel = (activityLevel) =>
  String(activityLevel || 'moderate')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

const calculateBmr = ({ sex, weightKg, heightCm, age }) => {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'female' ? base - 161 : base + 5;
};

router.post('/calculate', (req, res) => {
  const weightKg = toNumber(req.body.weightKg || req.body.weight);
  const heightCm = toNumber(req.body.heightCm || req.body.height);
  const age = toNumber(req.body.age);
  const sex = String(req.body.sex || 'male').toLowerCase();
  const activityLevel = normalizeActivityLevel(req.body.activityLevel);
  const goal = normalizeGoal(req.body.goal);

  if (!weightKg || !heightCm || !age) {
    return res.status(400).json({
      message: 'weightKg, heightCm, and age are required',
    });
  }

  if (!['male', 'female'].includes(sex)) {
    return res.status(400).json({
      message: 'sex must be either male or female',
    });
  }

  if (!ACTIVITY_MULTIPLIERS[activityLevel]) {
    return res.status(400).json({
      message: 'activityLevel must be sedentary, light, moderate, active, or very_active',
    });
  }

  if (GOAL_ADJUSTMENTS[goal] === undefined) {
    return res.status(400).json({
      message: 'goal must be weight_loss, maintain, or muscle_gain',
    });
  }

  const bmr = calculateBmr({ sex, weightKg, heightCm, age });
  const maintenanceCalories = bmr * ACTIVITY_MULTIPLIERS[activityLevel];
  const calorieTarget = maintenanceCalories + GOAL_ADJUSTMENTS[goal];

  res.json({
    inputs: {
      weightKg,
      heightCm,
      age,
      sex,
      activityLevel,
      goal,
    },
    bmr: Math.round(bmr),
    tdee: Math.round(maintenanceCalories),
    dailyCalorieTarget: Math.round(calorieTarget),
  });
});

router.get('/nutrients/:mealId', (req, res) => {
  const { mealId } = req.params;
  const nutrients = MOCK_NUTRIENTS_BY_MEAL_ID[mealId];

  if (!nutrients) {
    return res.status(404).json({
      message: 'Nutrient details are not available for this meal yet',
      mealId,
    });
  }

  res.json({ nutrients });
});

export default router;
