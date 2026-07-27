-- Security foundation: rate_limit_events table for sliding-window rate limiting.
-- See lib/security/rateLimiter.ts and supabase/rls-policies.sql. Safe to re-run.
CREATE TABLE IF NOT EXISTS rate_limit_events (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  identifier text,
  action     text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rate_limit_events_key_present CHECK (user_id IS NOT NULL OR identifier IS NOT NULL)
);

COMMENT ON TABLE rate_limit_events IS 'Sliding-window rate limit log. Service-role access only — see lib/security/rateLimiter.ts.';

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_user_lookup
  ON rate_limit_events (user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_identifier_lookup
  ON rate_limit_events (identifier, action, created_at DESC);

ALTER TABLE rate_limit_events ENABLE ROW LEVEL SECURITY;
-- No policies — service role only (default deny for anon/authenticated).
