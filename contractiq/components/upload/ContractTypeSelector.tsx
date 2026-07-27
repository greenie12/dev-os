'use client'

import type { ContractType } from '@/lib/types/app.types'

type ContractTypeSelectorProps = {
  value: ContractType | null
  onChange: (type: ContractType) => void
  disabled: boolean
}

const OPTIONS: { value: ContractType; label: string }[] = [
  { value: 'nda', label: 'NDA' },
  { value: 'msa', label: 'MSA' },
]

export default function ContractTypeSelector({ value, onChange, disabled }: ContractTypeSelectorProps) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const currentIndex = OPTIONS.findIndex((o) => o.value === value)
    const delta = e.key === 'ArrowRight' ? 1 : -1
    const nextIndex = (currentIndex + delta + OPTIONS.length) % OPTIONS.length
    onChange(OPTIONS[nextIndex].value)
  }

  return (
    <div role="radiogroup" aria-label="Contract type" onKeyDown={handleKeyDown} style={{ display: 'flex', gap: '8px' }}>
      {OPTIONS.map((option) => {
        const isSelected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            style={{
              padding: '8px 20px',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '6px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              background: isSelected ? '#115ACB' : '#FFFFFF',
              color: isSelected ? '#FFFFFF' : '#25272B',
              border: isSelected ? '1px solid #115ACB' : '1px solid #C1C2C3',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
