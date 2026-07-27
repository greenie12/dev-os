export default function DisclaimerBanner() {
  return (
    <div
      role="note"
      aria-live="polite"
      style={{
        background: '#FFF9F0',
        borderBottom: '1px solid #FFE3BD',
        padding: '10px 24px',
        fontSize: '12px',
        color: '#B36800',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <span aria-hidden="true">⚠️</span>
      <span>
        <strong>Not legal advice.</strong> ContractIQ is an AI-assisted review tool.
        Always verify critical terms with a qualified lawyer before signing.
      </span>
    </div>
  )
}
