import { createAdminClient } from '@/lib/supabase/admin'

// Sliding-window rate limiting backed by the rate_limit_events table (see
// supabase/rls-policies.sql). Always uses the admin (service-role) client — RLS on
// that table has no user-facing policies at all, so a normal user's client can
// neither read nor write it, meaning nobody can pad or inspect their own count.
type RateLimitKey = { userId: string } | { identifier: string }

type RateLimitConfig = {
  action: string
  limit: number
  windowMs: number
}

// One config per endpoint category from security-foundation/SKILL.md's table.
// `auth` is keyed by IP (see identifier below), not user_id, because failed login
// attempts by definition may not resolve to a known user.
export const RATE_LIMITS = {
  auth: { action: 'auth', limit: 10, windowMs: 60_000 } satisfies RateLimitConfig,
  chat: { action: 'chat', limit: 30, windowMs: 60_000 } satisfies RateLimitConfig,
  process: { action: 'process', limit: 5, windowMs: 3_600_000 } satisfies RateLimitConfig,
  upload: { action: 'upload', limit: 20, windowMs: 86_400_000 } satisfies RateLimitConfig,
} as const

export type RateLimitResult = { limited: boolean; retryAfterSeconds: number }

export async function checkRateLimit(key: RateLimitKey, config: RateLimitConfig): Promise<RateLimitResult> {
  const admin = createAdminClient()
  const windowStart = new Date(Date.now() - config.windowMs).toISOString()

  let query = admin
    .from('rate_limit_events')
    .select('id', { count: 'exact', head: true })
    .eq('action', config.action)
    .gte('created_at', windowStart)

  query = 'userId' in key ? query.eq('user_id', key.userId) : query.eq('identifier', key.identifier)

  const { count, error: countError } = await query
  if (countError) {
    // Fail open: a rate-limiter outage must not take down the endpoints it protects.
    console.error({ error: countError, context: 'rate_limit_check', action: config.action })
    return { limited: false, retryAfterSeconds: 0 }
  }

  if ((count ?? 0) >= config.limit) {
    return { limited: true, retryAfterSeconds: Math.ceil(config.windowMs / 1000) }
  }

  const { error: insertError } = await admin.from('rate_limit_events').insert(
    'userId' in key
      ? { user_id: key.userId, action: config.action }
      : { identifier: key.identifier, action: config.action }
  )
  if (insertError) {
    console.error({ error: insertError, context: 'rate_limit_record', action: config.action })
  }

  return { limited: false, retryAfterSeconds: 0 }
}

// Best-effort client IP extraction for pre-auth rate limiting (login attempts have
// no user_id yet). Not spoof-proof against a client that controls its own proxy
// chain, but sufficient as a practical brute-force throttle behind a normal
// reverse proxy (Vercel, etc.), which sets x-forwarded-for itself.
export function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}
