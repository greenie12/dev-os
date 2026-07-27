type SourceSentenceTooltipProps = {
  sentence: string
  isOpen: boolean
  onClose: () => void
}

export default function SourceSentenceTooltip({ sentence, isOpen, onClose }: SourceSentenceTooltipProps) {
  if (!isOpen) return null

  return (
    <div
      role="region"
      aria-label="Source sentence"
      style={{
        background: '#E7EFFC',
        border: '1px solid #B6CFF5',
        borderRadius: '6px',
        padding: '12px',
        marginTop: '8px',
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: 500, color: '#0D469E', marginBottom: '6px' }}>
        ℹ Source from document
      </div>
      {sentence ? (
        <p style={{ fontSize: '13px', color: '#25272B', fontStyle: 'italic', margin: '0 0 8px 0', lineHeight: '20px' }}>
          &ldquo;{sentence}&rdquo;
        </p>
      ) : (
        <p style={{ fontSize: '13px', color: '#4A4C4F', margin: '0 0 8px 0', lineHeight: '20px' }}>
          No source sentence — this term was not found in the document.
        </p>
      )}
      <button
        type="button"
        aria-label="Close source sentence"
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#0D469E',
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
          padding: 0,
        }}
      >
        Close ×
      </button>
    </div>
  )
}
