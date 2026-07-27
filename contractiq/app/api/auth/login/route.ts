import { createClient } from '@/lib/supabase/server'
import { jsonError, jsonOk } from '@/lib/api/response'
import { signInSchema } from '@/lib/security/inputValidator'
import { checkRateLimit, RATE_LIMITS, getClientIdentifier } from '@/lib/security/rateLimiter'
import { mapAuthError } from '@/lib/utils/validation'

// Server-side login so the rate limiter runs BEFORE Supabase is ever called — a
// client-side-only signInWithPassword() (the previous implementation) can't be
// rate limited this way, since a scripted attacker just calls the Supabase API
// directly and skips the browser entirely. This also sets the session cookie via
// the server client's Set-Cookie response headers, same as middleware.ts does.
export async function POST(request: Request) {
  const identifier = getClientIdentifier(request)
  const rateLimit = await checkRateLimit({ identifier }, RATE_LIMITS.auth)
  if (rateLimit.limited) {
    return jsonError('RATE_LIMITED', 'Too many sign-in attempts. Please wait a minute and try again.', 429)
  }

  const body = await request.json().catch(() => null)
  const parsedBody = signInSchema.safeParse(body)
  if (!parsedBody.success) {
    return jsonError('VALIDATION_ERROR', parsedBody.error.issues[0].message, 422)
  }
  const { email, password } = parsedBody.data

  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Distinct code so the client can reliably show the "resend verification"
    // action without pattern-matching the already-localized message text.
    const code = /email not confirmed/i.test(error.message) ? 'EMAIL_NOT_CONFIRMED' : 'AUTH_ERROR'
    return jsonError(code, mapAuthError(error.message), 401)
  }

  return jsonOk({ user: { id: data.user.id, email: data.user.email } }, 200)
}
