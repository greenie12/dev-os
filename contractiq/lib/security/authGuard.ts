import { getAuthedContext } from '@/lib/api/auth'
import { jsonError } from '@/lib/api/response'

// Thin wrapper around lib/api/auth.ts's getAuthedContext(), formalizing the
// "verify session, return user or 401" pattern every app/api/* route already
// follows, into a single reusable call: `const { supabase, user, response } =
// await requireAuth(); if (response) return response`.
export async function requireAuth() {
  const { supabase, user } = await getAuthedContext()

  if (!user) {
    return { supabase, user: null, response: jsonError('UNAUTHORIZED', undefined, 401) }
  }

  return { supabase, user, response: null }
}
