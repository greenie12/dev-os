type EmptyStateProps = {
  onCTAClick: () => void
}

export default function EmptyState({ onCTAClick }: EmptyStateProps) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #F0F0F1',
      borderRadius: '8px',
      padding: '64px 24px',
      textAlign: 'center',
    }}>
      <div aria-hidden="true" style={{ fontSize: '32px', marginBottom: '16px' }}>📄</div>
      <div style={{ fontSize: '16px', fontWeight: 500, color: '#070A0E', marginBottom: '8px' }}>
        No contracts reviewed yet
      </div>
      <p style={{ fontSize: '14px', color: '#4A4C4F', marginBottom: '24px', maxWidth: '360px', margin: '0 auto 24px' }}>
        Upload your first NDA or MSA to get AI-powered key term extraction with confidence scores and page citations.
      </p>
      <button type="button" className="btn-primary" onClick={onCTAClick} style={{ display: 'inline-flex', padding: '10px 20px', fontSize: '14px' }}>
        Review a Contract →
      </button>
    </div>
  )
}
