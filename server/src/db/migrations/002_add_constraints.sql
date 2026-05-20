CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_user_daily
  ON game_sessions(user_id, day_number)
  WHERE user_id IS NOT NULL AND mode = 'daily';

CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_guest_daily
  ON game_sessions(guest_token, day_number)
  WHERE guest_token IS NOT NULL AND mode = 'daily';

CREATE INDEX IF NOT EXISTS idx_sessions_guest_day
  ON game_sessions(guest_token, day_number);
