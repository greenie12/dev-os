'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ErrorBanner from '@/components/shared/ErrorBanner'
import { signUpSchema, mapAuthError } from '@/lib/utils/validation'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = signUpSchema.safeParse({ email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })

    setLoading(false)

    if (error) {
      setError(mapAuthError(error.message))
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 500, color: '#070A0E', marginBottom: '8px' }}>
          Check your email
        </h1>
        <p style={{ fontSize: '14px', color: '#4A4C4F', lineHeight: '22px' }}>
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 500, color: '#070A0E', marginBottom: '8px' }}>
        Create your account
      </h1>
      <p style={{ fontSize: '14px', color: '#4A4C4F', marginBottom: '32px', lineHeight: '22px' }}>
        Start your free trial — 5 contract reviews included, no credit card required.
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
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#070A0E', marginBottom: '6px' }}>
            Password
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
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
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p style={{ marginTop: '16px', fontSize: '12px', color: '#8F9193', textAlign: 'center', lineHeight: '18px' }}>
        By creating an account you agree to our Terms of Service and Privacy Policy.
        ContractIQ is not a law firm and does not provide legal advice.
      </p>

      <p style={{ marginTop: '16px', fontSize: '14px', color: '#4A4C4F', textAlign: 'center' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: '#115ACB', fontWeight: 500 }}>
          Sign in
        </Link>
      </p>
    </div>
  )
}
