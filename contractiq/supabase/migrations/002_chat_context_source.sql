-- Adds context_source to chat_messages: records which classification (contract /
-- history / both) produced an assistant response, so the UI can show a source
-- attribution badge on revisit, not just in the live session.
-- Safe to re-run.
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS context_source text CHECK (context_source IN ('contract', 'history', 'both'));

COMMENT ON COLUMN chat_messages.context_source IS 'contract | history | both — which sources fed the assistant response. NULL for user messages.';
