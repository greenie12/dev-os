'use client'

import { useState } from 'react'
import type { KeyTerm } from '@/lib/types/app.types'
import TermRow from './TermRow'
import FeedbackBar from './FeedbackBar'
import { extractApiErrorMessage } from '@/lib/utils/apiErrors'

type KeyTermsPanelProps = {
  contractId: string
  terms: KeyTerm[]
  onPageSelect: (page: number) => void
  onTermUpdated: (term: KeyTerm) => void
}

export default function KeyTermsPanel({ contractId, terms, onPageSelect, onTermUpdated }: KeyTermsPanelProps) {
  const [activeTermId, setActiveTermId] = useState<string | null>(null)
  const [editingTermId, setEditingTermId] = useState<string | null>(null)

  async function handleEditSave(term: KeyTerm, newValue: string) {
    const res = await fetch(`/api/terms/${term.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: newValue }),
    })
    if (!res.ok) {
      throw new Error(await extractApiErrorMessage(res))
    }
    const updated = await res.json()
    onTermUpdated({ ...term, value: updated.value, is_edited: updated.is_edited })
    setEditingTermId(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div>
        {terms.map((term) => (
          <TermRow
            key={term.id}
            term={term}
            onPageSelect={onPageSelect}
            isExpanded={activeTermId === term.id}
            onToggleExpand={() => setActiveTermId((prev) => (prev === term.id ? null : term.id))}
            isEditing={editingTermId === term.id}
            onEditStart={() => setEditingTermId(term.id)}
            onEditCancel={() => setEditingTermId(null)}
            onEditSave={(newValue) => handleEditSave(term, newValue)}
          />
        ))}
      </div>
      <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #F0F0F1' }}>
        <FeedbackBar contractId={contractId} />
      </div>
    </div>
  )
}
