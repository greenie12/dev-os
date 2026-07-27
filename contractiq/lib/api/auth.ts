import { createClient } from '@/lib/supabase/server'

// All app/api/* route handlers run behind middleware.ts, which already refreshes the
// session cookie on every request. Route handlers reuse that same cookie-based session
// (via the server Supabase client) rather than parsing an Authorization header — the
// browser sends cookies automatically on same-origin fetches, so there's no token to pass.
export async function getAuthedContext() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, user }
}
