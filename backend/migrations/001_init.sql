CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  bio TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  daily_calorie_goal INTEGER NOT NULL DEFAULT 2200 CHECK (daily_calorie_goal > 0),
  protein_goal INTEGER NOT NULL DEFAULT 160 CHECK (protein_goal >= 0),
  carbs_goal INTEGER NOT NULL DEFAULT 220 CHECK (carbs_goal >= 0),
  fat_goal INTEGER NOT NULL DEFAULT 70 CHECK (fat_goal >= 0),
  profile_visibility TEXT NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS friend_requests (
  id BIGSERIAL PRIMARY KEY,
  requester_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_friend_request CHECK (requester_id <> addressee_id),
  CONSTRAINT unique_friend_request_pair UNIQUE (requester_id, addressee_id)
);

CREATE TABLE IF NOT EXISTS friendships (
  id BIGSERIAL PRIMARY KEY,
  user_low_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_high_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_friendship CHECK (user_low_id <> user_high_id),
  CONSTRAINT ordered_friendship CHECK (user_low_id < user_high_id),
  CONSTRAINT unique_friendship_pair UNIQUE (user_low_id, user_high_id)
);

CREATE TABLE IF NOT EXISTS food_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  calories INTEGER NOT NULL CHECK (calories >= 0),
  protein_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (protein_g >= 0),
  carbs_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (carbs_g >= 0),
  fat_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (fat_g >= 0),
  serving_size TEXT,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'other')),
  consumed_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_search_username ON users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_search_display_name ON users (LOWER(display_name));
CREATE INDEX IF NOT EXISTS idx_email_tokens_user_created ON email_verification_tokens (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friend_requests_addressee_status ON friend_requests (addressee_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friend_requests_requester_status ON friend_requests (requester_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friendships_low ON friendships (user_low_id);
CREATE INDEX IF NOT EXISTS idx_friendships_high ON friendships (user_high_id);
CREATE INDEX IF NOT EXISTS idx_food_logs_user_consumed_at ON food_logs (user_id, consumed_at DESC);
