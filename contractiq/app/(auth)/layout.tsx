export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FAFAFA',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#FFFFFF',
        border: '1px solid #F0F0F1',
        borderRadius: '12px',
        padding: '40px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            background: '#115ACB',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>C</span>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#070A0E' }}>ContractIQ</span>
        </div>
        {children}
      </div>
    </div>
  )
}
