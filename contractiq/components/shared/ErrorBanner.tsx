type ErrorBannerProps = {
  message: string
  onDismiss?: () => void
}

export default function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      style={{
        background: '#FAEBEB',
        border: '1px solid #EAA2A3',
        borderRadius: '6px',
        padding: '12px 16px',
        fontSize: '14px',
        color: '#942528',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <span aria-hidden="true" style={{ flexShrink: 0, marginTop: '1px' }}>✕</span>
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss error"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#942528',
            flexShrink: 0,
            padding: '0',
            fontSize: '16px',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}
