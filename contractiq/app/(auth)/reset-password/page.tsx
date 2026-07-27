'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ErrorBanner from '@/components/shared/ErrorBanner'
import { signupPasswordSchema } from '@/lib/utils/validation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = signupPasswordSchema.safeParse(password)
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    // The recovery link the user clicked already established a session in this
    // browser (the Supabase browser client picks up the recovery token from the
    // URL automatically on page load — see lib/supabase/client.ts), so this call
    // is authenticated as the account being reset, not a generic password change.
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(
        /session/i.test(updateError.message)
          ? 'This reset link has expired. Please request a new one.'
          : updateError.message
      )
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 500, color: '#070A0E', marginBottom: '8px' }}>
        Set a new password
      </h1>
      <p style={{ fontSize: '14px', color: '#4A4C4F', marginBottom: '32px', lineHeight: '22px' }}>
        Choose a new password for your account.
      </p>

      {error && (
        <div style={{ marginBottom: '16px' }}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#070A0E', marginBottom: '6px' }}>
            New password
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
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#070A0E', marginBottom: '6px' }}>
            Confirm new password
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
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
          {loading ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
