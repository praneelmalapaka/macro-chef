CREATE TABLE IF NOT EXISTS recipes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,

  calories INTEGER NOT NULL CHECK (calories >= 0),
  protein_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (protein_g >= 0),
  carbs_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (carbs_g >= 0),
  fat_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (fat_g >= 0),

  prep_minutes INTEGER CHECK (prep_minutes IS NULL OR prep_minutes >= 0),
  servings INTEGER NOT NULL DEFAULT 1 CHECK (servings > 0),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipes_user_created_at
  ON recipes (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recipes_public_created_at
  ON recipes (created_at DESC)
  WHERE visibility = 'public';