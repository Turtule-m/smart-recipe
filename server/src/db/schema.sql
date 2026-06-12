-- 1. Wipe out everything completely in the correct order to break old UUID links
DROP TABLE IF EXISTS community_recipes CASCADE;
DROP TABLE IF EXISTS saved_recipes CASCADE;
DROP TABLE IF EXISTS dietary_prefs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Now recreate them fresh using standard INTEGER IDs
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  verification_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(120),
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ... (Keep the rest of your tables exactly as they are)

CREATE TABLE IF NOT EXISTS dietary_prefs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  vegetarian BOOLEAN NOT NULL DEFAULT FALSE,
  vegan BOOLEAN NOT NULL DEFAULT FALSE,
  gluten_free BOOLEAN NOT NULL DEFAULT FALSE,
  dairy_free BOOLEAN NOT NULL DEFAULT FALSE,
  nut_free BOOLEAN NOT NULL DEFAULT FALSE,
  allergies TEXT[] NOT NULL DEFAULT '{}',
  disliked_ingredients TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_recipes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_external_id TEXT,
  title VARCHAR(255) NOT NULL,
  image_url TEXT,
  source_url TEXT,
  recipe_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_id ON saved_recipes(user_id);

CREATE TABLE IF NOT EXISTS community_recipes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]',
  instructions JSONB NOT NULL DEFAULT '[]',
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER,
  visibility VARCHAR(20) NOT NULL DEFAULT 'public',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT community_recipes_visibility_check CHECK (visibility IN ('public', 'private'))
);

CREATE INDEX IF NOT EXISTS idx_community_recipes_user_id ON community_recipes(user_id);
