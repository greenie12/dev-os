type ProcessingProgressProps = {
  step: 1 | 2 | 3
}

const LABELS = [
  'Extracting text from your PDF…',
  'Analysing with AI…',
  'Compiling results…',
]

export default function ProcessingProgress({ step }: ProcessingProgressProps) {
  return (
    <div role="status" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {LABELS.map((label, i) => {
        const stepNumber = i + 1
        const isComplete = stepNumber < step
        const isCurrent = stepNumber === step

        return (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              color: isComplete || isCurrent ? '#070A0E' : '#8F9193',
              fontWeight: isCurrent ? 500 : 400,
            }}
          >
            <span aria-hidden="true" style={{ width: '16px', textAlign: 'center', flexShrink: 0 }}>
              {isComplete ? (
                <span style={{ color: '#13A10E' }}>✓</span>
              ) : isCurrent ? (
                <span
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    border: '2px solid #92B7F0',
                    borderTopColor: '#115ACB',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
              ) : null}
            </span>
            {label}
          </div>
        )
      })}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
