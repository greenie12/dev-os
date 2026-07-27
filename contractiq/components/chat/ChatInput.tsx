'use client'

import { useState } from 'react'

type ChatInputProps = {
  onSend: (message: string) => void
  disabled: boolean
}

const MAX_LENGTH = 1000

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  const isEmpty = value.trim().length === 0

  return (
    <div style={{ borderTop: '1px solid #F0F0F1', padding: '12px 16px', background: '#FFFFFF' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
        <textarea
          aria-label="Type a question about your contract"
          aria-multiline="true"
          value={value}
          disabled={disabled}
          maxLength={MAX_LENGTH}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Type a question about your contract..."
          rows={1}
          style={{
            flex: 1,
            padding: '10px 12px',
            border: '1px solid #DADADB',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'var(--font-inter)',
            resize: 'none',
            background: disabled ? '#F0F0F1' : '#FFFFFF',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="button"
          aria-label="Send message"
          aria-disabled={disabled || isEmpty}
          onClick={handleSend}
          disabled={disabled || isEmpty}
          style={{
            width: '36px',
            height: '36px',
            flexShrink: 0,
            borderRadius: '8px',
            border: 'none',
            background: '#115ACB',
            color: '#FFFFFF',
            cursor: disabled || isEmpty ? 'not-allowed' : 'pointer',
            opacity: disabled || isEmpty ? 0.5 : 1,
            fontSize: '16px',
          }}
        >
          {disabled ? (
            <span aria-hidden="true" style={{
              display: 'inline-block',
              width: '14px',
              height: '14px',
              border: '2px solid rgba(255,255,255,0.5)',
              borderTopColor: '#FFFFFF',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          ) : '↑'}
        </button>
      </div>
      {value.length > 900 && (
        <div style={{ textAlign: 'right', fontSize: '11px', color: value.length === MAX_LENGTH ? '#D13438' : '#8F9193', marginTop: '4px' }}>
          {value.length}/{MAX_LENGTH}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
