import { createClient } from '@/lib/supabase/server'
import { jsonOk } from '@/lib/api/response'

// The client must call this route instead of supabase.auth.signOut() directly, so
// sign-out is always handled server-side and the session cookie is cleared via
// the same Set-Cookie mechanism used everywhere else (middleware.ts, login route).
export async function POST() {
  const supabase = createClient()
  await supabase.auth.signOut()
  return jsonOk({ success: true }, 200)
}
