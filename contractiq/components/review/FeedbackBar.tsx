'use client'

import { useState } from 'react'
import type { FeedbackRating } from '@/lib/types/app.types'

type FeedbackBarProps = {
  contractId: string
}

export default function FeedbackBar({ contractId }: FeedbackBarProps) {
  const [rating, setRating] = useState<FeedbackRating | null>(null)
  const [comment, setComment] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(selected: FeedbackRating) {
    setRating(selected)
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_id: contractId, rating: selected, comment: comment || undefined }),
      })
      if (res.ok) setIsSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <p style={{ fontSize: '14px', color: '#2C2F32' }}>Thanks for your feedback!</p>
    )
  }

  return (
    <div>
      <div role="radiogroup" aria-label="Was this analysis accurate?" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px', color: '#070A0E' }}>Was this analysis accurate?</span>
        <button
          type="button"
          role="radio"
          aria-checked={rating === 'up'}
          disabled={isSubmitting}
          onClick={() => submit('up')}
          style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', opacity: isSubmitting ? 0.5 : 1 }}
        >
          👍
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={rating === 'down'}
          disabled={isSubmitting}
          onClick={() => submit('down')}
          style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', opacity: isSubmitting ? 0.5 : 1 }}
        >
          👎
        </button>
      </div>
      <input
        type="text"
        aria-label="Tell us more (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 500))}
        placeholder="Optional: Tell us more…"
        disabled={isSubmitting}
        style={{
          width: '100%',
          padding: '6px 10px',
          fontSize: '13px',
          border: '1px solid #DADADB',
          borderRadius: '6px',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
