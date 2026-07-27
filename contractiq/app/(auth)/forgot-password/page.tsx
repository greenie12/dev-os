'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ErrorBanner from '@/components/shared/ErrorBanner'
import { emailSchema } from '@/lib/utils/validation'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = emailSchema.safeParse(email)
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    // Always show the same confirmation regardless of whether the email is
    // registered — revealing that would let an attacker enumerate accounts.
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 500, color: '#070A0E', marginBottom: '8px' }}>
          Check your email
        </h1>
        <p style={{ fontSize: '14px', color: '#4A4C4F', lineHeight: '22px' }}>
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your password.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 500, color: '#070A0E', marginBottom: '8px' }}>
        Reset your password
      </h1>
      <p style={{ fontSize: '14px', color: '#4A4C4F', marginBottom: '32px', lineHeight: '22px' }}>
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      {error && (
        <div style={{ marginBottom: '16px' }}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
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
        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ width: '100%', marginTop: '8px', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p style={{ marginTop: '24px', fontSize: '14px', color: '#4A4C4F', textAlign: 'center' }}>
        <Link href="/login" style={{ color: '#115ACB', fontWeight: 500 }}>
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
