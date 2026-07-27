'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import PDFViewer from '@/components/pdf/PDFViewer'
import TextViewer from '@/components/pdf/TextViewer'
import KeyTermsPanel from '@/components/review/KeyTermsPanel'
import ChatInterface from '@/components/chat/ChatInterface'
import DeleteConfirmModal from '@/components/shared/DeleteConfirmModal'
import type { Contract, KeyTerm } from '@/lib/types/app.types'

type ReviewClientProps = {
  contract: Contract
  initialTerms: KeyTerm[]
  initialSignedUrl: string | null
}

type Tab = 'terms' | 'chat'

export default function ReviewClient({ contract, initialTerms, initialSignedUrl }: ReviewClientProps) {
  const router = useRouter()
  const [terms, setTerms] = useState(initialTerms)
  const [targetPage, setTargetPage] = useState(1)
  const [signedUrl, setSignedUrl] = useState(initialSignedUrl)
  const [pdfFailed, setPdfFailed] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('terms')
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [menuOpen])

  async function handlePdfLoadError() {
    // Signed URL may have expired (1-hour TTL) — try refreshing once before falling
    // back to the text viewer, per spec-results-page.md.
    try {
      const res = await fetch(`/api/contracts/${contract.id}/signed-url`)
      const data = await res.json()
      if (data.signedUrl && data.signedUrl !== signedUrl) {
        setSignedUrl(data.signedUrl)
        return
      }
    } catch {
      // fall through to text viewer
    }
    setPdfFailed(true)
  }

  function handleTermUpdated(updated: KeyTerm) {
    setTerms((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
  }

  async function handleConfirmDelete() {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/contracts/${contract.id}`, { method: 'DELETE' })
      if (res.ok || res.status === 204) {
        router.push('/dashboard')
        return
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const showPdf = Boolean(signedUrl) && !pdfFailed

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Header — file name + overflow menu (delete) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid #F0F0F1',
        background: '#FFFFFF',
      }}>
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#070A0E' }}>{contract.file_name}</span>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            aria-label="More actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#4A4C4F', padding: '4px 8px' }}
          >
            ⋮
          </button>
          {menuOpen && (
            <div
              role="menu"
              style={{
                position: 'absolute',
                right: 0,
                top: '32px',
                background: '#FFFFFF',
                border: '1px solid #DADADB',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                zIndex: 10,
                minWidth: '160px',
              }}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  setDeleteModalOpen(true)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  background: 'transparent',
                  border: 'none',
                  color: '#942528',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Delete contract
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel — PDF / Text viewer */}
        <div style={{ flex: '0 0 55%', borderRight: '1px solid #F0F0F1', background: '#FFFFFF', overflow: 'hidden' }}>
          {showPdf ? (
            <PDFViewer
              url={signedUrl as string}
              targetPage={targetPage}
              onPageChange={() => {}}
              onLoadError={handlePdfLoadError}
            />
          ) : (
            <TextViewer contractText={contract.contract_text} targetPage={targetPage} onPageChange={() => {}} />
          )}
        </div>

        {/* Right panel — tabbed: Key terms / Chat */}
        <div style={{ flex: '0 0 45%', display: 'flex', flexDirection: 'column', background: '#FAFAFA' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #F0F0F1', background: '#FFFFFF' }}>
            {(['terms', 'chat'] as Tab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: activeTab === tab ? '#115ACB' : '#4A4C4F',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #115ACB' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {tab === 'terms' ? 'Key Terms' : 'Chat'}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'hidden', display: activeTab === 'terms' ? 'block' : 'none' }}>
            <div style={{ height: '100%', overflow: 'auto', padding: '16px 24px' }}>
              {terms.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#8F9193' }}>No key terms extracted for this contract.</p>
              ) : (
                <KeyTermsPanel
                  contractId={contract.id}
                  terms={terms}
                  onPageSelect={setTargetPage}
                  onTermUpdated={handleTermUpdated}
                />
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'hidden', display: activeTab === 'chat' ? 'block' : 'none' }}>
            <ChatInterface contractId={contract.id} onPageSelect={setTargetPage} />
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        contractName={contract.file_name}
        isOpen={deleteModalOpen}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  )
}
