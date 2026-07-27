'use client'

import { useEffect, useId, useRef } from 'react'

type DeleteConfirmModalProps = {
  contractName: string
  isOpen: boolean
  isDeleting: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export default function DeleteConfirmModal({ contractName, isOpen, isDeleting, onConfirm, onCancel }: DeleteConfirmModalProps) {
  const titleId = useId()
  const descId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) cancelRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isDeleting) {
        onCancel()
        return
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled)')
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isDeleting, onCancel])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(7, 10, 14, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={() => !isDeleting && onCancel()}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '420px',
          width: '90%',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}
      >
        <h2 id={titleId} style={{ fontSize: '18px', fontWeight: 600, color: '#070A0E', margin: '0 0 8px 0' }}>
          Delete &ldquo;{contractName}&rdquo;?
        </h2>
        <p id={descId} style={{ fontSize: '14px', color: '#4A4C4F', lineHeight: '21px', margin: '0 0 24px 0' }}>
          This permanently deletes the contract, all extracted key terms, chat history, and the uploaded PDF. This cannot be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#4A4C4F',
              background: 'transparent',
              border: '1px solid #DADADB',
              borderRadius: '6px',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            aria-busy={isDeleting}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#FFFFFF',
              background: '#D13438',
              border: 'none',
              borderRadius: '6px',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.7 : 1,
            }}
          >
            {isDeleting ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  )
}
