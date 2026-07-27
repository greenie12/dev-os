import type { ContractType } from '@/lib/types/app.types'
import { getStandardTerms } from '@/lib/constants/terms'

type PreProcessingPreviewProps = {
  contractType: ContractType
  customTerms: string[]
}

export default function PreProcessingPreview({ contractType, customTerms }: PreProcessingPreviewProps) {
  const standardTerms = getStandardTerms(contractType)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {standardTerms.map((term) => (
        <div key={term} style={{ fontSize: '14px', color: '#25272B', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span aria-hidden="true" style={{ color: '#8F9193' }}>•</span>
          {term}
        </div>
      ))}
      {customTerms.map((term) => (
        <div key={term} style={{ fontSize: '14px', color: '#25272B', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span aria-hidden="true" style={{ color: '#8F9193' }}>•</span>
          {term}
          <span style={{
            fontSize: '11px',
            fontWeight: 500,
            color: '#115ACB',
            background: '#E7EFFC',
            borderRadius: '4px',
            padding: '1px 6px',
          }}>
            Custom
          </span>
        </div>
      ))}
    </div>
  )
}
