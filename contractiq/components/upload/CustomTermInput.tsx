'use client'

import { useState } from 'react'
import { MAX_CUSTOM_TERMS, MAX_CUSTOM_TERM_LENGTH } from '@/lib/constants/terms'

type CustomTermInputProps = {
  terms: string[]
  onAdd: (term: string) => void
  onRemove: (index: number) => void
  maxTerms?: number
}

export default function CustomTermInput({ terms, onAdd, onRemove, maxTerms = MAX_CUSTOM_TERMS }: CustomTermInputProps) {
  const [inputValue, setInputValue] = useState('')
  const atLimit = terms.length >= maxTerms

  function handleAdd() {
    const trimmed = inputValue.trim()
    if (!trimmed || atLimit) return
    onAdd(trimmed)
    setInputValue('')
  }

  return (
    <div>
      {terms.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {terms.map((term, index) => (
            <span
              key={`${term}-${index}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: '#115ACB',
                background: '#E7EFFC',
                borderRadius: '4px',
                padding: '4px 8px',
              }}
            >
              {term}
              <button
                type="button"
                aria-label={`Remove ${term}`}
                onClick={() => onRemove(index)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#115ACB',
                  padding: 0,
                  lineHeight: 1,
                  fontSize: '14px',
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          aria-label="Custom term name"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value.slice(0, MAX_CUSTOM_TERM_LENGTH))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          disabled={atLimit}
          placeholder="e.g. Non-compete radius"
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #DADADB',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#070A0E',
            background: atLimit ? '#F0F0F1' : '#FFFFFF',
          }}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={atLimit || !inputValue.trim()}
          title={atLimit ? 'Maximum 5 custom terms reached' : undefined}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#115ACB',
            background: 'transparent',
            border: '1px solid #92B7F0',
            borderRadius: '6px',
            cursor: atLimit || !inputValue.trim() ? 'not-allowed' : 'pointer',
            opacity: atLimit || !inputValue.trim() ? 0.5 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          + Add Key Term
        </button>
      </div>
    </div>
  )
}
