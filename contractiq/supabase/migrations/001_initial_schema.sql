-- =============================================================================
-- ContractIQ — Production Database Schema
-- =============================================================================
-- Project:  ContractIQ (https://jkdwvnijrwyuytwljgcs.supabase.co)
-- Updated:  2026-07-20
--
-- HOW TO RUN
-- ----------
-- Paste this entire file into the Supabase SQL Editor and click Run.
-- This script is idempotent: safe to re-run without data loss.
-- All CREATE statements use IF NOT EXISTS.
-- All policies are dropped and recreated to stay idempotent.
--
-- SECTIONS
-- --------
--  1. Extensions
--  2. Helper functions (updated_at trigger, rate limiter)
--  3. Tables & indexes (contracts, key_terms, chat_sessions, chat_messages,
--     user_feedback, rate_limit_events)
--  4. Row Level Security (RLS) policies
--  5. Storage bucket & Storage RLS policies
--  6. Supabase Realtime
--  7. 90-day retention cleanup
--  8. Auth configuration notes
-- =============================================================================


-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- gen_random_uuid() fallback
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- reserved for future full-text search on contract_text
CREATE EXTENSION IF NOT EXISTS "pg_net";      -- lets pg_cron call the cleanup-storage Edge Function over HTTP
-- pg_cron is required for the 90-day retention job in Section 7.
-- Enable it in: Supabase Dashboard → Database → Extensions → pg_cron


-- =============================================================================
-- 2. HELPER FUNCTIONS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 2a. Automatic updated_at timestamp trigger
-- Applied to contracts so status transitions (pending→processing→complete→error)
-- are automatically timestamped without requiring the application to pass the value.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2b. Rate limit check function
-- Called by the /process Edge Function before invoking OpenAI.
-- Returns TRUE if the user has hit their limit (10 extractions per hour).
-- Using a function keeps the logic DB-side and easy to adjust.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_rate_limited(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*) >= 10
  FROM contracts
  WHERE user_id    = p_user_id
    AND status     IN ('processing', 'complete')
    AND created_at >= now() - INTERVAL '1 hour';
$$;


-- =============================================================================
-- 3. TABLES & INDEXES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 3a. contracts
-- ---------------------------------------------------------------------------
-- Central record for every uploaded contract.
-- contract_text is extracted once at upload (with [PAGE N] markers) and stored
-- here. All downstream features (extraction, chat, text viewer) read from this
-- column — the original PDF file is never re-read from Storage.
-- file_path is nullable: Storage upload is non-blocking. When null, the PDF
-- viewer falls back to the text viewer silently.
-- last_accessed_at is updated on every /review/[id] page load and is used
-- by the 90-day retention cleanup job.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contracts (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid         NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  file_name        text         NOT NULL,
  file_size_bytes  bigint       CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
  contract_type    text         NOT NULL CHECK (contract_type IN ('nda', 'msa')),
  contract_text    text         NOT NULL,      -- full extracted text with [PAGE N] markers
  file_path        text,                       -- Storage path: contracts/{user_id}/{contract_id}/{filename}.pdf
                                               -- NULL when Storage upload failed (text viewer used instead)
  status           text         NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'processing', 'complete', 'error')),
  page_count       integer      NOT NULL CHECK (page_count > 0 AND page_count <= 20),
  token_count      integer      NOT NULL CHECK (token_count > 0 AND token_count <= 15000),
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now(),   -- auto-updated via trigger on status change
  last_accessed_at timestamptz  NOT NULL DEFAULT now()    -- used for 90-day auto-delete policy
);

COMMENT ON TABLE  contracts                  IS 'One row per uploaded contract. contract_text is the single source of truth for all AI features.';
COMMENT ON COLUMN contracts.file_path        IS 'NULL when Supabase Storage upload failed. Only affects the PDF viewer — all other features use contract_text.';
COMMENT ON COLUMN contracts.status           IS 'pending→processing→complete|error. Error contracts can be retried without re-upload.';
COMMENT ON COLUMN contracts.last_accessed_at IS 'Updated on every results page load. Used by the 90-day retention cleanup job.';

-- Trigger: keep updated_at current on every row update
DROP TRIGGER IF EXISTS trg_contracts_updated_at ON contracts;
CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_user_id          ON contracts (user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at       ON contracts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_user_status      ON contracts (user_id, status);           -- dashboard status filter
CREATE INDEX IF NOT EXISTS idx_contracts_last_accessed    ON contracts (last_accessed_at)
  WHERE status = 'complete';                                                                         -- retention cleanup scans only complete contracts


-- ---------------------------------------------------------------------------
-- 3b. key_terms
-- ---------------------------------------------------------------------------
-- One row per extracted (or custom) term per contract.
-- original_ai_value is written once at extraction and never overwritten — it
-- tracks what GPT-4o originally said, independent of user edits, for the
-- feedback/improvement loop.
-- page_number is the 1-indexed page from the [PAGE N] marker where the term
-- was found. It drives click-to-navigate in the PDF/text viewer.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS key_terms (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id       uuid          NOT NULL REFERENCES contracts ON DELETE CASCADE,
  user_id           uuid          NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  term_name         text          NOT NULL,
  value             text          NOT NULL,        -- current displayed value; may be user-edited
  original_ai_value text          NOT NULL,        -- GPT-4o's original output; never modified after INSERT
  page_number       integer       NOT NULL DEFAULT 1 CHECK (page_number >= 1),
  confidence_score  numeric(5,2)  NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
  source_sentence   text          NOT NULL DEFAULT '',  -- verbatim sentence used by AI; '' when term = "Not found"
  is_manual         boolean       NOT NULL DEFAULT false,   -- true = user-added custom term
  is_edited         boolean       NOT NULL DEFAULT false,   -- true = user has overridden the AI value
  created_at        timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE  key_terms                       IS 'Extracted key terms from contracts. One row per term per contract.';
COMMENT ON COLUMN key_terms.original_ai_value     IS 'Preserved forever — diverges from value when is_edited=true. Used for extraction accuracy analysis.';
COMMENT ON COLUMN key_terms.confidence_score      IS '0–100. <50 triggers the red ⚠️ badge in the UI. 0 means term was not found in document.';
COMMENT ON COLUMN key_terms.source_sentence       IS 'Verbatim sentence from the contract that supported this extraction. Empty string means "Not found".';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_key_terms_contract_id ON key_terms (contract_id);
CREATE INDEX IF NOT EXISTS idx_key_terms_user_id     ON key_terms (user_id);
CREATE INDEX IF NOT EXISTS idx_key_terms_confidence  ON key_terms (contract_id, confidence_score);  -- low-confidence reporting


-- ---------------------------------------------------------------------------
-- 3c. chat_sessions
-- ---------------------------------------------------------------------------
-- One session per (contract, user) pair — enforced by unique index.
-- Created on first message; persists for the lifetime of the contract.
-- The UNIQUE constraint enables safe upsert in the /chat Edge Function.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_sessions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid        NOT NULL REFERENCES contracts ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE chat_sessions IS 'One session per (contract, user). Created on first chat message; never re-created.';

-- UNIQUE: enforce one session per (contract, user) — upserted by Edge Function
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_sessions_contract_user
  ON chat_sessions (contract_id, user_id);


-- ---------------------------------------------------------------------------
-- 3d. chat_messages
-- ---------------------------------------------------------------------------
-- Ordered by created_at ASC. Up to 200 messages are fetched from the DB per turn;
-- lib/openai/chat.ts then slices the last 10-20 (by classification) to send to
-- GPT-4o — see context_source below.
-- page_citation is extracted from [Page X] patterns in assistant responses and
-- stored as an integer so the UI can render a clickable page navigation link.
-- context_source records which classification (contract/history/both) produced
-- an assistant response, so the UI can show an attribution badge on revisit,
-- not just in the live session.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     uuid        NOT NULL REFERENCES chat_sessions ON DELETE CASCADE,
  role           text        NOT NULL CHECK (role IN ('user', 'assistant')),
  content        text        NOT NULL CHECK (char_length(content) <= 50000),  -- guard against runaway responses
  page_citation  integer     CHECK (page_citation >= 1),   -- NULL for user messages and uncited responses
  context_source text        CHECK (context_source IN ('contract', 'history', 'both')),  -- NULL for user messages
  created_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  chat_messages                IS 'Individual messages within a chat session. Fetched ascending for history; Realtime subscription delivers new messages.';
COMMENT ON COLUMN chat_messages.page_citation  IS 'Parsed from [Page X] in assistant content. Drives click-to-navigate in the PDF/text viewer.';
COMMENT ON COLUMN chat_messages.context_source IS 'contract | history | both — which sources fed the assistant response. NULL for user messages.';

-- Composite index: primary query pattern is session_id + created_at ASC (message history)
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
  ON chat_messages (session_id, created_at ASC);


-- ---------------------------------------------------------------------------
-- 3e. user_feedback
-- ---------------------------------------------------------------------------
-- One feedback record per (user, contract). The UNIQUE index allows upsert:
-- if the user submits again, their rating/comment is overwritten.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_feedback (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  contract_id uuid        NOT NULL REFERENCES contracts ON DELETE CASCADE,
  rating      text        NOT NULL CHECK (rating IN ('up', 'down')),
  comment     text        CHECK (char_length(comment) <= 500),  -- max 500 chars per UI spec
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE user_feedback IS 'Thumbs-up/down feedback per contract per user. Upserted: submitting again overwrites the previous response.';

DROP TRIGGER IF EXISTS trg_user_feedback_updated_at ON user_feedback;
CREATE TRIGGER trg_user_feedback_updated_at
  BEFORE UPDATE ON user_feedback
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX  IF NOT EXISTS idx_user_feedback_contract_id ON user_feedback (contract_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_feedback_unique
  ON user_feedback (user_id, contract_id);   -- one submission per user per contract


-- ---------------------------------------------------------------------------
-- 3f. rate_limit_events
-- ---------------------------------------------------------------------------
-- Backs lib/security/rateLimiter.ts's sliding-window check (security-foundation).
-- All reads/writes go through the service-role client, never a user's own session
-- — see RLS note in section 4f. user_id is nullable because auth-attempt rate
-- limiting happens before login succeeds, so there may be no known user yet;
-- those events are keyed by `identifier` (client IP) instead.
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


-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
-- All tables are locked to auth.uid() = user_id.
-- Policies are dropped before creation so this script is safe to re-run.
-- The DB enforces these regardless of application-level auth — defence in depth.

-- ---------------------------------------------------------------------------
-- 4a. contracts
-- ---------------------------------------------------------------------------
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contracts: owner full access" ON contracts;
CREATE POLICY "contracts: owner full access"
  ON contracts FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4b. key_terms
-- ---------------------------------------------------------------------------
ALTER TABLE key_terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "key_terms: owner full access" ON key_terms;
CREATE POLICY "key_terms: owner full access"
  ON key_terms FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4c. chat_sessions
-- ---------------------------------------------------------------------------
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_sessions: owner full access" ON chat_sessions;
CREATE POLICY "chat_sessions: owner full access"
  ON chat_sessions FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4d. chat_messages
-- ---------------------------------------------------------------------------
-- Messages are scoped to the user via their chat_sessions.
-- The SECURITY DEFINER subquery avoids a per-row RLS policy lookup on
-- chat_sessions, which would otherwise add a join on every message read.
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages: owner full access via session" ON chat_messages;
CREATE POLICY "chat_messages: owner full access via session"
  ON chat_messages FOR ALL
  USING (
    session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4e. user_feedback
-- ---------------------------------------------------------------------------
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_feedback: owner full access" ON user_feedback;
CREATE POLICY "user_feedback: owner full access"
  ON user_feedback FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4f. rate_limit_events
-- ---------------------------------------------------------------------------
-- Intentionally NO CREATE POLICY statements. RLS enabled + zero policies is a
-- default-deny for the anon and authenticated roles — only the service role
-- (which bypasses RLS entirely) can read or write this table. A user's own
-- browser session can never inflate, delete, or inspect their own rate-limit count.
ALTER TABLE rate_limit_events ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- 5. STORAGE BUCKET & STORAGE RLS
-- =============================================================================
-- Bucket: "contracts"
-- Path convention: contracts/{user_id}/{contract_id}/{filename}.pdf
-- Access: private (no public URLs). All access via signed URLs (1-hour expiry).
-- Storage upload is NON-BLOCKING — failure leaves contracts.file_path = NULL.
-- When file_path is NULL: PDF viewer falls back to the text viewer silently.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contracts',
  'contracts',
  false,
  10485760,                    -- 10 MB hard limit at bucket level (mirrors app validation)
  ARRAY['application/pdf']     -- only PDFs accepted
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS: all three operations are scoped to the first folder segment = user_id
-- Path structure: {user_id}/{contract_id}/{filename}.pdf → foldername()[1] = user_id

DROP POLICY IF EXISTS "storage: owner upload"  ON storage.objects;
CREATE POLICY "storage: owner upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'contracts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "storage: owner read" ON storage.objects;
CREATE POLICY "storage: owner read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contracts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "storage: owner delete" ON storage.objects;
CREATE POLICY "storage: owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'contracts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- =============================================================================
-- 6. SUPABASE REALTIME
-- =============================================================================
-- Enable Realtime on chat_messages so the ChatInterface component can receive
-- new messages via Supabase Realtime subscription without polling.
--
-- REQUIRED: Before running this statement, enable Replication for chat_messages:
--   Supabase Dashboard → Database → Replication → Tables → toggle chat_messages ON
--
-- The Edge Function inserts both the user message and the assistant response.
-- The client subscribes to INSERT events on chat_messages filtered by session_id.
-- The useChatSession hook deduplicates by message ID to prevent double-renders.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
END $$;


-- =============================================================================
-- 7. 90-DAY RETENTION CLEANUP
-- =============================================================================
-- IMPORTANT — this is NOT contract deletion. Per engineering-doc.md §7 and
-- spec-data-retention.md: after 90 days of inactivity, only the uploaded PDF
-- binary in Storage is removed. The contract row, contract_text, key_terms,
-- and chat history are all retained indefinitely — they are only removed by
-- user-initiated deletion (DELETE /contracts/:id, spec-contract-deletion.md).
--
-- Storage deletion is not expressible in SQL — it requires the Storage API —
-- so this job does not delete anything itself. It calls the app's
-- app/api/cron/cleanup-storage/route.ts (a Next.js Route Handler, not a
-- Supabase Edge Function — see engineering-doc.md deviation notes) over HTTP
-- once a day; that route finds contracts with file_path IS NOT NULL and
-- last_accessed_at older than 90 days, removes the Storage object, and sets
-- file_path = NULL. The results page already falls back to TextViewer
-- whenever file_path is NULL, so no further app change is needed.
--
-- SETUP REQUIRED (cannot be scripted — all one-time manual steps):
--   1. Enable pg_cron: Supabase Dashboard → Database → Extensions → pg_cron
--   2. Set CRON_SECRET (a random string, NOT the service_role_key) as an env
--      var on the deployed app AND in Postgres, so the two can be compared:
--        ALTER DATABASE postgres SET app.settings.cron_secret = '<same random string>';
--      (never hardcode the secret in this file / commit it to git)
--   3. Replace the placeholder url below with your deployed app's origin
--      (e.g. https://contractiq.vercel.app) — localhost is not reachable
--      from Supabase's cron infrastructure.
-- Then uncomment the cron.schedule call below and re-run this file.

DROP FUNCTION IF EXISTS delete_stale_contracts();  -- superseded: deleted whole contracts, contradicting retention policy above

-- Schedule nightly at 03:00 UTC (requires pg_cron + the settings above).
-- Uncomment after completing SETUP REQUIRED steps 1–3:
--
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-stale-contract-storage') THEN
--     PERFORM cron.unschedule('cleanup-stale-contract-storage');
--   END IF;
-- END $$;
--
-- SELECT cron.schedule(
--   'cleanup-stale-contract-storage',
--   '0 3 * * *',
--   $cron$
--   SELECT net.http_post(
--     url := 'https://<your-deployed-app-domain>/api/cron/cleanup-storage',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret'),
--       'Content-Type', 'application/json'
--     ),
--     body := '{}'::jsonb
--   );
--   $cron$
-- );


-- =============================================================================
-- 8. AUTH CONFIGURATION (reference — applied in Supabase Dashboard)
-- =============================================================================
-- These settings cannot be applied via SQL. Apply them manually in:
--   Supabase Dashboard → Authentication → Settings
--
-- Required settings:
--   ✓ Email confirmations:       ENABLED
--   ✓ Minimum password length:   8 characters
--   ✓ JWT expiry:                3600 seconds (1 hour)
--   ✓ Site URL:                  https://contractiq.vercel.app  (or http://localhost:3000 for dev)
--   ✓ Redirect URLs (allowlist): https://contractiq.vercel.app/**, http://localhost:3000/**
--
-- Email templates: customise in Supabase Dashboard → Authentication → Email Templates
--   - Confirm signup: subject "Verify your ContractIQ email"
--   - Magic link: not used (email+password only in MVP)


-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
-- Verification checklist (run these queries after applying to confirm setup):
--
-- 1. Tables created:
--    SELECT table_name FROM information_schema.tables
--    WHERE table_schema = 'public' ORDER BY table_name;
--    → should return: chat_messages, chat_sessions, contracts, key_terms,
--      rate_limit_events, user_feedback
--
-- 2. RLS enabled on all tables:
--    SELECT tablename, rowsecurity FROM pg_tables
--    WHERE schemaname = 'public';
--    → rowsecurity should be TRUE for all 6 tables
--
-- 3. Storage bucket created:
--    SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'contracts';
--    → should return 1 row with public=false, file_size_limit=10485760
--
-- 4. Legacy rate limit function (superseded — see note below):
--    SELECT is_rate_limited('00000000-0000-0000-0000-000000000000'::uuid);
--    → should return FALSE (no contracts for this dummy UUID)
--    NOTE: app/api/process/route.ts no longer calls this function as of the
--    security-foundation pass — it now uses lib/security/rateLimiter.ts's
--    rate_limit_events table, the same mechanism used by every other rate-limited
--    endpoint (auth, chat, upload), for one consistent system instead of two.
--    is_rate_limited() is left in place (harmless) rather than dropped, in case
--    anything else comes to depend on it later.
--
-- 5. rate_limit_events has no user-facing policies (service-role only):
--    SELECT policyname FROM pg_policies WHERE tablename = 'rate_limit_events';
--    → should return 0 rows
