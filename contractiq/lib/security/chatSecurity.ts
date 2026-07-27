import type { SupabaseClient } from '@supabase/supabase-js'

// RLS already enforces these boundaries at the DB level (verified directly in this
// project — anon-key reads against synthetic rows in every table returned empty).
// These helpers add an explicit, named application-level check on top: RLS silently
// filters rows, which reads as "not found" either way, but a named helper makes the
// intent (ownership, not just existence) legible at each call site and gives one
// place to change the failure behavior (currently 404, matching security-foundation's
// requirement) without touching every route.

export async function verifyContractOwnership(supabase: SupabaseClient, contractId: string, userId: string) {
  const { data: contract } = await supabase
    .from('contracts')
    .select('id, contract_text, contract_type, status')
    .eq('id', contractId)
    .eq('user_id', userId)
    .single()

  return contract ?? null
}

export async function verifySessionOwnership(supabase: SupabaseClient, sessionId: string, userId: string) {
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id, contract_id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single()

  return session ?? null
}
