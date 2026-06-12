import React from 'react'; // 🌟 Add this right at the top!
const features = [
  {
    icon: '🎯',
    title: 'Smart Ingredient Search',
    description:
      'Search recipes from the ingredients you already have and turn a half-full fridge into a real dinner plan.',
  },
  {
    icon: '🎡',
    title: 'Decision Spin Wheel',
    description: "Can't decide? Let the wheel pick your meal and make dinner feel effortless again.",
  },
  {
    icon: '📸',
    title: 'AI Photo Recognition',
    description: 'Snap a picture of your ingredients and get recipe ideas instantly.',
  },
];

export default function LandingPage({ onAuthClick }) {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-950">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#fff7ed_0,#fafaf9_36%,#ffffff_68%)]">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(#fed7aa_1px,transparent_1px),linear-gradient(90deg,#fed7aa_1px,transparent_1px)] [background-size:44px_44px]" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-red-500 text-lg text-white shadow-lg shadow-red-200">
              🍽️
            </div>
            <span className="text-xl font-black tracking-tight text-stone-950">Smart Recipe Hub</span>
          </div>

          <button
            className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-800 shadow-sm transition hover:border-red-200 hover:text-red-600"
            type="button"
            onClick={onAuthClick}
          >
            Sign In
          </button>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-6 pb-20 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-18">
          <div className="max-w-3xl space-y-8">
            <div className="inline-flex rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-sm font-bold text-red-600 shadow-sm backdrop-blur">
              Waste less, cook better, decide faster
            </div>

            <div className="space-y-5">
              <h1 className="text-5xl font-black leading-tight tracking-normal text-stone-950 sm:text-6xl lg:text-7xl">
                Turn Your Fridge into a Five-Star Kitchen
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-stone-600">
                Discover recipes from what you already have, identify ingredients from photos, and
                let a playful meal wheel choose dinner when you cannot.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="min-h-12 rounded-md bg-red-500 px-7 text-base font-black text-white shadow-xl shadow-red-200 transition hover:-translate-y-0.5 hover:bg-red-600"
                type="button"
                onClick={onAuthClick}
              >
                Get Started for Free
              </button>
              <div className="flex items-center gap-3 px-1 text-sm font-semibold text-stone-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                No credit card required
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-orange-200 via-red-100 to-stone-200 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white shadow-2xl shadow-orange-100">
              <div className="h-80 bg-[url('https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center" />
              <div className="grid gap-4 p-6 sm:grid-cols-3">
                <div className="rounded-lg bg-stone-50 p-4">
                  <p className="text-xs font-bold uppercase text-stone-500">Detected</p>
                  <p className="mt-2 text-lg font-black text-stone-950">Tomato</p>
                </div>
                <div className="rounded-lg bg-stone-50 p-4">
                  <p className="text-xs font-bold uppercase text-stone-500">Matched</p>
                  <p className="mt-2 text-lg font-black text-stone-950">Garlic</p>
                </div>
                <div className="rounded-lg bg-red-500 p-4 text-white">
                  <p className="text-xs font-bold uppercase text-red-100">Tonight</p>
                  <p className="mt-2 text-lg font-black">Pasta</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-sm font-black uppercase tracking-widest text-red-600">Core Features</p>
          <h2 className="mt-3 text-4xl font-black tracking-normal text-stone-950">
            Everything you need to answer “what should I cook?”
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article
              className="rounded-lg border border-stone-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
              key={feature.title}
            >
              <div className="mb-6 grid h-14 w-14 place-items-center rounded-md bg-orange-100 text-3xl">
                {feature.icon}
              </div>
              <h3 className="text-xl font-black text-stone-950">{feature.title}</h3>
              <p className="mt-3 leading-7 text-stone-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
