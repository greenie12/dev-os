import type { KeyTerm } from '@/lib/types/app.types'
import ConfidenceBadge from './ConfidenceBadge'
import SourceSentenceTooltip from './SourceSentenceTooltip'
import TermEditor from './TermEditor'

type TermRowProps = {
  term: KeyTerm
  onPageSelect: (page: number) => void
  isExpanded: boolean
  onToggleExpand: () => void
  isEditing: boolean
  onEditStart: () => void
  onEditSave: (newValue: string) => Promise<void>
  onEditCancel: () => void
}

export default function TermRow({
  term,
  onPageSelect,
  isExpanded,
  onToggleExpand,
  isEditing,
  onEditStart,
  onEditSave,
  onEditCancel,
}: TermRowProps) {
  return (
    <div style={{ padding: '16px 0', borderBottom: '1px solid #F0F0F1' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#070A0E' }}>{term.term_name}</span>
        <ConfidenceBadge score={term.confidence_score} />
      </div>

      {isEditing ? (
        <TermEditor term={term} onSave={onEditSave} onCancel={onEditCancel} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <span
            role="button"
            tabIndex={0}
            onClick={onEditStart}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onEditStart()
              }
            }}
            style={{ fontSize: '14px', color: '#25272B', cursor: 'pointer', flex: 1 }}
          >
            {term.value}
          </span>
          {term.value !== 'Not found' && (
            <button
              type="button"
              aria-label={`Go to page ${term.page_number}`}
              onClick={() => onPageSelect(term.page_number)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#115ACB',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                padding: 0,
              }}
            >
              Page {term.page_number} ↗
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={onToggleExpand}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#4A4C4F',
            fontSize: '12px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {isExpanded ? '▼' : '▶'} Why?
        </button>

        {term.is_edited && (
          <span style={{
            fontSize: '11px',
            fontWeight: 500,
            color: '#5E6062',
            background: '#F0F0F1',
            border: '1px solid #DADADB',
            borderRadius: '4px',
            padding: '1px 6px',
          }}>
            Edited
          </span>
        )}
      </div>

      <SourceSentenceTooltip sentence={term.source_sentence} isOpen={isExpanded} onClose={onToggleExpand} />
    </div>
  )
}
