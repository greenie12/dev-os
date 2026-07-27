-- =============================================================================
-- ContractIQ — Security Foundation: rate_limit_events
-- =============================================================================
-- Paste-and-run in the Supabase SQL Editor. Safe to re-run (idempotent).
--
-- This is an ADDITIVE file layered on top of the main schema in database.sql,
-- which already defines RLS on all 5 application tables (contracts, key_terms,
-- chat_sessions, chat_messages, user_feedback) — verified directly this session
-- (anon-key reads against synthetic rows in every one of those tables returned
-- empty, confirming RLS is actually enforced, not just declared). This file adds
-- the one new table security-foundation introduces: sliding-window rate limiting.
--
-- Run this after database.sql. Also mirrored into database.sql itself (§3f) so
-- a fresh project setup only needs to run one file.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- rate_limit_events
-- ---------------------------------------------------------------------------
-- Backs lib/security/rateLimiter.ts's sliding-window check. All reads and writes
-- go through createAdminClient() (service role) — see rateLimiter.ts — so a
-- user's own browser session can never inflate, delete, or inspect their own
-- count. Accordingly this table has NO user-facing RLS policies: RLS is enabled
-- with zero policies, which is a default-deny for both the anon and authenticated
-- roles. Only the service role (which bypasses RLS entirely by design) can touch it.
--
-- user_id is nullable because auth-attempt rate limiting happens before login
-- succeeds — there may be no known user_id yet (e.g. a wrong-password attempt, or
-- an attempt against a non-existent email). Those events are keyed by `identifier`
-- (client IP) instead. Exactly one of the two must be set.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limit_events (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  identifier text,                                    -- client IP; used when user_id is not yet known
  action     text        NOT NULL,                     -- 'auth' | 'chat' | 'process' | 'upload'
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rate_limit_events_key_present CHECK (user_id IS NOT NULL OR identifier IS NOT NULL)
);

COMMENT ON TABLE rate_limit_events IS 'Sliding-window rate limit log. Service-role access only — see lib/security/rateLimiter.ts.';

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_user_lookup
  ON rate_limit_events (user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_identifier_lookup
  ON rate_limit_events (identifier, action, created_at DESC);

ALTER TABLE rate_limit_events ENABLE ROW LEVEL SECURITY;
-- Intentionally no CREATE POLICY statements — RLS enabled + zero policies means
-- every role except service_role (which bypasses RLS) is denied by default.

-- Optional: periodically prune old events so the table doesn't grow unbounded.
-- The longest window in RATE_LIMITS is 24h (upload); a 2-day retention is a safe
-- margin. Uncomment and schedule via pg_cron once enabled (see database.sql §7
-- for the pg_cron enablement steps):
--
-- SELECT cron.schedule(
--   'prune-rate-limit-events',
--   '0 4 * * *',
--   $$ DELETE FROM rate_limit_events WHERE created_at < now() - INTERVAL '2 days' $$
-- );
