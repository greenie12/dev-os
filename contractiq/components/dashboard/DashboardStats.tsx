type DashboardStatsProps = {
  total: number
  ndaCount: number
  msaCount: number
  isLoading: boolean
}

export default function DashboardStats({ total, ndaCount, msaCount, isLoading }: DashboardStatsProps) {
  const stats = [
    { label: 'Total reviewed', value: total },
    { label: 'NDAs', value: ndaCount },
    { label: 'MSAs', value: msaCount },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '32px' }}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          role="region"
          aria-label={`${stat.label}: ${isLoading ? 'loading' : stat.value}`}
          style={{ background: '#FFFFFF', border: '1px solid #F0F0F1', borderRadius: '8px', padding: '20px 24px' }}
        >
          {isLoading ? (
            <div style={{ width: '48px', height: '36px', background: '#F0F0F1', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ) : (
            <div style={{ fontSize: '28px', fontWeight: 600, color: '#115ACB', lineHeight: '36px' }}>{stat.value}</div>
          )}
          <div style={{ fontSize: '12px', color: '#4A4C4F', marginTop: '2px' }}>{stat.label}</div>
        </div>
      ))}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  )
}
