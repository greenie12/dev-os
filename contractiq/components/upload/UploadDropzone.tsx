'use client'

import { useRef, useState } from 'react'
import { MAX_FILE_SIZE_BYTES } from '@/lib/constants/limits'

type UploadDropzoneProps = {
  onFileSelected: (file: File) => void
  onValidationError: (message: string) => void
  disabled: boolean
  selectedFile: File | null
}

export default function UploadDropzone({ onFileSelected, onValidationError, disabled, selectedFile }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function validateAndEmit(file: File) {
    if (file.type !== 'application/pdf') {
      onValidationError('Only PDF files are accepted.')
      return
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      onValidationError('File exceeds the 10 MB limit. Please upload a smaller PDF.')
      return
    }
    onFileSelected(file)
  }

  function openPicker() {
    if (!disabled) inputRef.current?.click()
  }

  return (
    <div
      role="region"
      aria-label="PDF upload area"
      tabIndex={disabled ? -1 : 0}
      onClick={openPicker}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openPicker()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        if (disabled) return
        const file = e.dataTransfer.files?.[0]
        if (file) validateAndEmit(file)
      }}
      style={{
        border: `2px dashed ${isDragging ? '#B6CFF5' : '#DADADB'}`,
        borderRadius: '8px',
        padding: '48px 24px',
        textAlign: 'center',
        background: isDragging ? '#E7EFFC' : '#FAFAFA',
        marginBottom: '24px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        outline: 'none',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) validateAndEmit(file)
          e.target.value = ''
        }}
        style={{ display: 'none' }}
      />
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>📤</div>
      {selectedFile ? (
        <>
          <div style={{ fontSize: '16px', fontWeight: 500, color: '#070A0E', marginBottom: '4px' }}>
            {selectedFile.name}
          </div>
          <p style={{ fontSize: '12px', color: '#8F9193' }}>
            {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB · click to replace
          </p>
        </>
      ) : (
        <>
          <div style={{ fontSize: '16px', fontWeight: 500, color: '#070A0E', marginBottom: '8px' }}>
            Drag and drop your PDF here
          </div>
          <p style={{ fontSize: '14px', color: '#4A4C4F', marginBottom: '16px' }}>
            or click to browse files
          </p>
          <p style={{ fontSize: '12px', color: '#8F9193' }}>
            Text-layer PDFs only · Max 10 MB · Max 20 pages · NDA or MSA contracts
          </p>
        </>
      )}
    </div>
  )
}
