'use client'

import { useState } from 'react'
import type { KeyTerm } from '@/lib/types/app.types'

type TermEditorProps = {
  term: KeyTerm
  onSave: (newValue: string) => Promise<void>
  onCancel: () => void
}

export default function TermEditor({ term, onSave, onCancel }: TermEditorProps) {
  const [value, setValue] = useState(term.value)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempted, setAttempted] = useState(false)

  const isEmpty = value.trim().length === 0
  const tooLong = value.length > 1000

  async function handleSave() {
    setAttempted(true)
    if (isEmpty || tooLong) return

    setIsSaving(true)
    setError(null)
    try {
      await onSave(value)
    } catch {
      setError('Failed to save. Try again.')
      setIsSaving(false)
    }
  }

  return (
    <div>
      <textarea
        aria-label={`Edit value for ${term.term_name}`}
        value={value}
        disabled={isSaving}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            onCancel()
          }
        }}
        rows={2}
        style={{
          width: '100%',
          padding: '8px 10px',
          border: '1px solid #92B7F0',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#070A0E',
          fontFamily: 'var(--font-inter)',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />

      {attempted && isEmpty && (
        <p role="alert" aria-live="assertive" style={{ fontSize: '12px', color: '#942528', margin: '4px 0 0 0' }}>
          Value cannot be empty.
        </p>
      )}
      {tooLong && (
        <p role="alert" aria-live="assertive" style={{ fontSize: '12px', color: '#942528', margin: '4px 0 0 0' }}>
          Value must be 1000 characters or fewer.
        </p>
      )}
      {error && (
        <p role="alert" aria-live="assertive" style={{ fontSize: '12px', color: '#942528', margin: '4px 0 0 0' }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || isEmpty || tooLong}
          aria-busy={isSaving}
          aria-label={isSaving ? 'Saving...' : undefined}
          style={{
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: 500,
            color: '#FFFFFF',
            background: '#115ACB',
            border: 'none',
            borderRadius: '6px',
            cursor: isSaving || isEmpty || tooLong ? 'not-allowed' : 'pointer',
            opacity: isSaving || isEmpty || tooLong ? 0.6 : 1,
          }}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#4A4C4F',
            fontSize: '13px',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            padding: 0,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
