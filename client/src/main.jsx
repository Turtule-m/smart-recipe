import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import DietTracker from './pages/DietTracker.jsx';
import LandingPage from './pages/LandingPage.jsx';
import PictureToRecipe from './pages/PictureToRecipe.jsx';
import SearchPage from './pages/SearchPage.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function AuthGate({ 
  authMode, 
  email, 
  name, 
  password, 
  onAuthModeChange, 
  onEmailChange, 
  onNameChange, 
  onPasswordChange, 
  onSubmit, 
  notification 
}) {
  return (
    <div className="min-h-screen bg-stone-955/70 px-4 py-10 backdrop-blur-sm">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden bg-[url('https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center lg:block" />

          <div className="p-8 sm:p-10">
            <div className="mb-8">
              <p className="text-sm font-black uppercase tracking-widest text-red-600">Smart Recipe Hub</p>
              <h1 className="mt-2 text-3xl font-black tracking-normal text-stone-950">
                {authMode === 'login' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                {authMode === 'login'
                  ? 'Sign in to open your recipe dashboard.'
                  : 'Start saving time, ingredients, and dinner decisions.'}
              </p>
            </div>

            {/* Notification alert banner */}
            {notification && (
              <div className={`p-4 mb-5 text-sm font-bold rounded-lg border ${
                notification.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                {notification.message}
              </div>
            )}

            <form className="space-y-4" onSubmit={onSubmit}>
              {authMode === 'register' ? (
                <label className="block space-y-2">
                  <span className="text-xs font-black uppercase text-stone-500">Full Name</span>
                  <input
                    className="min-h-11 w-full rounded-md border border-stone-200 bg-stone-50 px-4 outline-none ring-red-500 transition focus:bg-white focus:ring-2"
                    onChange={(event) => onNameChange(event.target.value)}
                    placeholder="Jane Cook"
                    required
                    type="text"
                    value={name}
                  />
                </label>
              ) : null}

              <label className="block space-y-2">
                <span className="text-xs font-black uppercase text-stone-500">Email Address</span>
                <input
                  className="min-h-11 w-full rounded-md border border-stone-200 bg-stone-50 px-4 outline-none ring-red-500 transition focus:bg-white focus:ring-2"
                  onChange={(event) => onEmailChange(event.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-black uppercase text-stone-500">Password</span>
                <input
                  className="min-h-11 w-full rounded-md border border-stone-200 bg-stone-50 px-4 outline-none ring-red-500 transition focus:bg-white focus:ring-2"
                  onChange={(event) => onPasswordChange(event.target.value)}
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                />
              </label>

              <button
                className="min-h-12 w-full rounded-md bg-red-500 px-5 text-base font-black text-white shadow-lg shadow-red-200 transition hover:bg-red-600"
                type="submit"
              >
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 border-t border-stone-100 pt-6 text-center">
              <button
                className="text-sm font-bold text-red-600 transition hover:text-red-700"
                onClick={() => onAuthModeChange(authMode === 'login' ? 'register' : 'login')}
                type="button"
              >
                {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppDashboard() {
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('token');
  });
  const [authMode, setAuthMode] = useState('login');
  const [activeTab, setActiveTab] = useState('search');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [notification, setNotification] = useState(null);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setNotification(null);

    try {
      if (authMode === 'register') {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Registration failed');
        }

        // On successful registration, clear form fields and show notification
        setName('');
        setEmail('');
        setPassword('');
        setNotification({
          type: 'success',
          message: 'Onboarding email sent! Head over to your inbox to activate your profile before signing in.',
        });
      } else {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }

        // Store login token securely
        localStorage.setItem('token', data.token);
        setIsLoggedIn(true);
        setShowAuthGate(false);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message,
      });
    }
  };

  if (!showAuthGate && !isLoggedIn) {
    return <LandingPage onAuthClick={() => setShowAuthGate(true)} />;
  }

  if (showAuthGate && !isLoggedIn) {
    return (
      <AuthGate
        authMode={authMode}
        email={email}
        name={name}
        password={password}
        onAuthModeChange={(mode) => {
          setAuthMode(mode);
          setNotification(null);
        }}
        onEmailChange={setEmail}
        onNameChange={setName}
        onPasswordChange={setPassword}
        onSubmit={handleAuthSubmit}
        notification={notification}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-red-500">
            🍽️ Smart Recipe Hub
          </h1>

          <div className="flex flex-col items-center gap-3 lg:flex-row">
            <nav className="flex flex-wrap justify-center gap-2 rounded-lg bg-gray-100 p-1">
              <button
                className={`rounded-md px-4 py-2 text-sm font-semibold transition-all ${
                  activeTab === 'search' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab('search')}
                type="button"
              >
                🎯 Search & Spin
              </button>

              <button
                className={`rounded-md px-4 py-2 text-sm font-semibold transition-all ${
                  activeTab === 'ai-upload' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab('ai-upload')}
                type="button"
              >
                📸 AI Picture Upload
              </button>

              <button
                className={`rounded-md px-4 py-2 text-sm font-semibold transition-all ${
                  activeTab === 'diet' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab('diet')}
                type="button"
              >
                🥗 Macro & Diet Tracker
              </button>
            </nav>

            <button
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-500 transition-all hover:border-red-200 hover:text-red-500"
              onClick={() => {
                localStorage.removeItem('token');
                setIsLoggedIn(false);
                setShowAuthGate(false);
                setEmail('');
                setPassword('');
                setName('');
                setNotification(null);
              }}
              type="button"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {activeTab === 'search' && <SearchPage />}
        {activeTab === 'ai-upload' && <PictureToRecipe />}
        {activeTab === 'diet' && <DietTracker />}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppDashboard />
  </React.StrictMode>,
);
