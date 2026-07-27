'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ErrorBanner from '@/components/shared/ErrorBanner'
import { signInSchema } from '@/lib/utils/validation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResend, setShowResend] = useState(false)
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setShowResend(false)
    setResendState('idle')

    const parsed = signInSchema.safeParse({ email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      setLoading(false)
      const body = await res.json().catch(() => ({ error: null, message: null }))
      if (body.error === 'EMAIL_NOT_CONFIRMED') {
        setShowResend(true)
      }
      setError(body.message ?? 'Something went wrong. Please try again.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleResend() {
    setResendState('sending')
    const supabase = createClient()
    await supabase.auth.resend({ type: 'signup', email })
    setResendState('sent')
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 500, color: '#070A0E', marginBottom: '8px' }}>
        Sign in to ContractIQ
      </h1>
      <p style={{ fontSize: '14px', color: '#4A4C4F', marginBottom: '32px', lineHeight: '22px' }}>
        Enter your email and password to access your contract reviews.
      </p>

      {error && (
        <div style={{ marginBottom: '16px' }}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
          {showResend && (
            <p style={{ fontSize: '13px', color: '#4A4C4F', marginTop: '8px' }}>
              {resendState === 'sent' ? (
                'Verification email resent — check your inbox.'
              ) : (
                <>
                  Didn&apos;t get it?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendState === 'sending'}
                    style={{
                      color: '#115ACB',
                      fontWeight: 500,
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      cursor: resendState === 'sending' ? 'not-allowed' : 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    {resendState === 'sending' ? 'Sending…' : 'Resend'}
                  </button>
                </>
              )}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#070A0E', marginBottom: '6px' }}>
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #DADADB',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#070A0E',
              background: '#FFFFFF',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: '#070A0E' }}>
              Password
            </label>
            <Link href="/forgot-password" style={{ fontSize: '13px', color: '#115ACB' }}>
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #DADADB',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#070A0E',
              background: '#FFFFFF',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ width: '100%', marginTop: '8px', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p style={{ marginTop: '24px', fontSize: '14px', color: '#4A4C4F', textAlign: 'center' }}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" style={{ color: '#115ACB', fontWeight: 500 }}>
          Get started free
        </Link>
      </p>
    </div>
  )
}
