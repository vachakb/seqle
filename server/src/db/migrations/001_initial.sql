CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(100),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
  guest_token   VARCHAR(64),
  mode          VARCHAR(10) NOT NULL CHECK (mode IN ('daily', 'practice')),
  day_number    INTEGER,
  sequence_id   VARCHAR(20) NOT NULL,
  difficulty    SMALLINT NOT NULL CHECK (difficulty IN (1, 2, 3)),
  initial_reveal_count SMALLINT NOT NULL,
  guesses       JSONB NOT NULL DEFAULT '[]',
  consecutive_correct SMALLINT NOT NULL DEFAULT 0,
  status        VARCHAR(10) NOT NULL DEFAULT 'playing' CHECK (status IN ('playing', 'won', 'lost')),
  hint_revealed BOOLEAN NOT NULL DEFAULT false,
  ghost_number  INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_guest ON game_sessions(guest_token);

CREATE TABLE IF NOT EXISTS game_results (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
  mode          VARCHAR(10) NOT NULL CHECK (mode IN ('daily', 'practice')),
  day_number    INTEGER,
  sequence_id   VARCHAR(20) NOT NULL,
  difficulty    SMALLINT NOT NULL CHECK (difficulty IN (1, 2, 3)),
  won           BOOLEAN NOT NULL,
  guess_count   SMALLINT NOT NULL CHECK (guess_count BETWEEN 1 AND 6),
  guesses       JSONB NOT NULL,
  played_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_results_user ON game_results(user_id);

CREATE TABLE IF NOT EXISTS user_stats (
  user_id            INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  games_played       INTEGER DEFAULT 0,
  games_won          INTEGER DEFAULT 0,
  current_streak     INTEGER DEFAULT 0,
  max_streak         INTEGER DEFAULT 0,
  guess_distribution INTEGER[6] DEFAULT '{0,0,0,0,0,0}',
  last_played_date   VARCHAR(10) DEFAULT '',
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
