import React, { useMemo, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const activityOptions = [
  { value: 'sedentary', label: 'Sedentary', detail: 'Desk work, little exercise' },
  { value: 'light', label: 'Light', detail: '1-3 workouts weekly' },
  { value: 'moderate', label: 'Moderate', detail: '3-5 workouts weekly' },
  { value: 'active', label: 'Active', detail: '6-7 workouts weekly' },
  { value: 'very_active', label: 'Very Active', detail: 'Physical job or athlete' },
];

const goalOptions = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
];

const macroColors = {
  calories: 'from-red-500 to-orange-400',
  protein: 'from-emerald-500 to-teal-400',
  carbs: 'from-amber-500 to-yellow-300',
  fats: 'from-violet-500 to-fuchsia-400',
};

const getMacroTargets = ({ calories, weightKg, goal }) => {
  const proteinMultiplier = goal === 'muscle_gain' ? 2 : goal === 'weight_loss' ? 1.8 : 1.6;
  const proteinGrams = Math.round(weightKg * proteinMultiplier);
  const fatGrams = Math.round((calories * 0.25) / 9);
  const carbCalories = Math.max(calories - proteinGrams * 4 - fatGrams * 9, 0);
  const carbsGrams = Math.round(carbCalories / 4);

  return {
    calories: Math.round(calories),
    protein: proteinGrams,
    carbs: carbsGrams,
    fats: fatGrams,
  };
};

function MacroBar({ label, value, unit, percent, color }) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-4">
        <span className="text-sm font-bold text-stone-700">{label}</span>
        <span className="text-sm font-semibold text-stone-500">
          {value.toLocaleString()} {unit}
        </span>
      </div>
      <div className="h-4 overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

function CalorieRing({ value, tdee }) {
  const percentage = Math.min(Math.round((value / Math.max(tdee, 1)) * 100), 100);

  return (
    <div className="flex items-center justify-center">
      <div
        className="grid h-56 w-56 place-items-center rounded-full shadow-inner"
        style={{
          background: `conic-gradient(#f97316 ${percentage}%, #f5f5f4 0)`,
        }}
      >
        <div className="grid h-40 w-40 place-items-center rounded-full bg-white text-center shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Daily Target</p>
            <p className="mt-1 text-4xl font-black text-stone-950">{value.toLocaleString()}</p>
            <p className="text-sm font-medium text-stone-500">calories</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DietTracker() {
  const [form, setForm] = useState({
    weightKg: '75',
    heightCm: '175',
    age: '30',
    sex: 'male',
    activityLevel: 'moderate',
    goal: 'maintain',
  });
  const [targets, setTargets] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const macroTargets = useMemo(() => {
    if (!targets) {
      return null;
    }

    return getMacroTargets({
      calories: targets.dailyCalorieTarget,
      weightKg: Number(form.weightKg),
      goal: form.goal,
    });
  }, [form.goal, form.weightKg, targets]);

  const handleChange = (event) => {
    setForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('loading');
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/diet/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weightKg: Number(form.weightKg),
          heightCm: Number(form.heightCm),
          age: Number(form.age),
          sex: form.sex,
          activityLevel: form.activityLevel,
          goal: form.goal,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to calculate diet targets');
      }

      setTargets(data);
      setStatus('success');
    } catch (requestError) {
      setTargets(null);
      setError(requestError.message);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen rounded-[2rem] bg-gradient-to-br from-stone-100 via-orange-50 to-red-50 px-4 py-8 text-stone-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-black uppercase tracking-widest text-red-600">Macro & Diet Tracker</p>
            <h1 className="text-4xl font-black tracking-normal text-stone-950 sm:text-5xl">
              Build a daily nutrition target that fits your goal.
            </h1>
            <p className="text-lg leading-8 text-stone-600">
              Calculate BMR, TDEE, and balanced macro targets from your body stats and activity level.
            </p>
          </div>

          {targets ? (
            <div className="rounded-lg border border-white/70 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold text-stone-500">Maintenance TDEE</p>
              <p className="mt-1 text-3xl font-black text-red-600">{targets.tdee.toLocaleString()} kcal</p>
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
          <form className="space-y-5 rounded-lg border border-white/70 bg-white p-6 shadow-xl" onSubmit={handleSubmit}>
            <div>
              <h2 className="text-2xl font-black text-stone-950">Profile Calculator</h2>
              <p className="mt-1 text-sm leading-6 text-stone-500">Enter your stats to generate a daily target.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <label className="space-y-2">
                <span className="text-sm font-bold text-stone-700">Weight (kg)</span>
                <input
                  className="min-h-11 w-full rounded-md border border-stone-200 bg-stone-50 px-4 outline-none ring-red-500 transition focus:bg-white focus:ring-2"
                  min="1"
                  name="weightKg"
                  onChange={handleChange}
                  type="number"
                  value={form.weightKg}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-stone-700">Height (cm)</span>
                <input
                  className="min-h-11 w-full rounded-md border border-stone-200 bg-stone-50 px-4 outline-none ring-red-500 transition focus:bg-white focus:ring-2"
                  min="1"
                  name="heightCm"
                  onChange={handleChange}
                  type="number"
                  value={form.heightCm}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-stone-700">Age</span>
                <input
                  className="min-h-11 w-full rounded-md border border-stone-200 bg-stone-50 px-4 outline-none ring-red-500 transition focus:bg-white focus:ring-2"
                  min="1"
                  name="age"
                  onChange={handleChange}
                  type="number"
                  value={form.age}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-stone-700">Sex</span>
                <select
                  className="min-h-11 w-full rounded-md border border-stone-200 bg-stone-50 px-4 outline-none ring-red-500 transition focus:bg-white focus:ring-2"
                  name="sex"
                  onChange={handleChange}
                  value={form.sex}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-bold text-stone-700">Activity Level</span>
              <select
                className="min-h-11 w-full rounded-md border border-stone-200 bg-stone-50 px-4 outline-none ring-red-500 transition focus:bg-white focus:ring-2"
                name="activityLevel"
                onChange={handleChange}
                value={form.activityLevel}
              >
                {activityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.detail}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-2">
              <span className="text-sm font-bold text-stone-700">Goal</span>
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                {goalOptions.map((goal) => (
                  <label
                    className={`cursor-pointer rounded-md border px-4 py-3 text-sm font-bold transition ${
                      form.goal === goal.value
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300'
                    }`}
                    key={goal.value}
                  >
                    <input
                      checked={form.goal === goal.value}
                      className="sr-only"
                      name="goal"
                      onChange={handleChange}
                      type="radio"
                      value={goal.value}
                    />
                    {goal.label}
                  </label>
                ))}
              </div>
            </div>

            <button
              className="min-h-12 w-full rounded-md bg-red-500 px-5 text-base font-black text-white shadow-lg shadow-red-200 transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-stone-400"
              disabled={status === 'loading'}
              type="submit"
            >
              {status === 'loading' ? 'Calculating...' : 'Calculate Daily Targets'}
            </button>

            {error ? <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
          </form>

          <div className="rounded-lg border border-white/70 bg-white p-6 shadow-xl">
            {targets && macroTargets ? (
              <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
                <div className="space-y-5 rounded-lg bg-stone-50 p-5">
                  <CalorieRing value={macroTargets.calories} tdee={targets.tdee} />
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-md bg-white p-3 shadow-sm">
                      <p className="text-xs font-bold uppercase text-stone-500">BMR</p>
                      <p className="mt-1 text-xl font-black text-stone-950">{targets.bmr.toLocaleString()}</p>
                    </div>
                    <div className="rounded-md bg-white p-3 shadow-sm">
                      <p className="text-xs font-bold uppercase text-stone-500">TDEE</p>
                      <p className="mt-1 text-xl font-black text-stone-950">{targets.tdee.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-7">
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-orange-600">Daily Breakdown</p>
                    <h2 className="mt-2 text-3xl font-black text-stone-950">Your macro targets</h2>
                    <p className="mt-2 text-sm leading-6 text-stone-500">
                      Protein is goal-adjusted by body weight; fats use 25% of calories; carbs fill the remainder.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <MacroBar color={macroColors.calories} label="Calories" percent={100} unit="kcal" value={macroTargets.calories} />
                    <MacroBar
                      color={macroColors.protein}
                      label="Protein"
                      percent={(macroTargets.protein * 4 * 100) / macroTargets.calories}
                      unit="g"
                      value={macroTargets.protein}
                    />
                    <MacroBar
                      color={macroColors.carbs}
                      label="Carbs"
                      percent={(macroTargets.carbs * 4 * 100) / macroTargets.calories}
                      unit="g"
                      value={macroTargets.carbs}
                    />
                    <MacroBar
                      color={macroColors.fats}
                      label="Fats"
                      percent={(macroTargets.fats * 9 * 100) / macroTargets.calories}
                      unit="g"
                      value={macroTargets.fats}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[520px] items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
                <div className="max-w-md">
                  <p className="text-5xl">🥗</p>
                  <h2 className="mt-4 text-3xl font-black text-stone-950">Your nutrition dashboard is ready.</h2>
                  <p className="mt-3 leading-7 text-stone-600">
                    Fill out the calculator to see calorie targets, BMR, TDEE, and a clean macro breakdown.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
