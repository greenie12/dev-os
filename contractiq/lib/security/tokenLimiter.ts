// Central home for size/length/history limits enforced across the app. Re-exports
// the existing app-level constants (lib/constants/limits.ts, lib/utils/tokens.ts)
// rather than duplicating them — those files are the single source of truth for
// values already used by client-side UI (e.g. UploadDropzone, ChatInput); this
// file adds the security-specific ones on top.
import { MAX_FILE_SIZE_BYTES, MAX_PAGE_COUNT } from '@/lib/constants/limits'
import { MAX_CONTRACT_TOKENS } from '@/lib/utils/tokens'

// Chat message length: kept at the app's actual spec value (spec-chat.md — enforced
// client-side in ChatInput's character counter), not the generic 5000 in the skill
// template, since raising it would silently invalidate that UI's character-count UX.
export const MAX_MESSAGE_LENGTH = 1000

// How many past messages are fetched from the DB per chat turn, before
// lib/azure/chat.ts further slices to 10-20 turns depending on query classification.
// Configurable via env so it can be tuned per environment without a code change.
export const MAX_CHAT_HISTORY = Number(process.env.MAX_CHAT_HISTORY) || 100

export { MAX_FILE_SIZE_BYTES, MAX_PAGE_COUNT, MAX_CONTRACT_TOKENS }

export function isMessageTooLong(message: string): boolean {
  return message.length > MAX_MESSAGE_LENGTH
}
