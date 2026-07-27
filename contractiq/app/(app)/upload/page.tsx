'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ContractTypeSelector from '@/components/upload/ContractTypeSelector'
import UploadDropzone from '@/components/upload/UploadDropzone'
import PreProcessingPreview from '@/components/upload/PreProcessingPreview'
import CustomTermInput from '@/components/upload/CustomTermInput'
import ProcessingProgress from '@/components/upload/ProcessingProgress'
import ErrorBanner from '@/components/shared/ErrorBanner'
import { extractApiErrorMessage } from '@/lib/utils/apiErrors'
import type { ContractType } from '@/lib/types/app.types'

type Phase = 'form' | 'uploading' | 'preview' | 'processing'

export default function UploadPage() {
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>('form')
  const [contractType, setContractType] = useState<ContractType | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [contractId, setContractId] = useState<string | null>(null)
  const [customTerms, setCustomTerms] = useState<string[]>([])
  const [processStep, setProcessStep] = useState<2 | 3>(2)
  const [error, setError] = useState<string | null>(null)

  const canUpload = contractType !== null && file !== null && phase === 'form'

  async function handleUpload() {
    if (!contractType || !file) return
    setError(null)
    setPhase('uploading')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('contract_type', contractType)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        setError(await extractApiErrorMessage(res))
        setPhase('form')
        return
      }
      const data = await res.json()
      setContractId(data.contract_id)
      setPhase('preview')
    } catch {
      setError('Something went wrong. Check your connection and try again.')
      setPhase('form')
    }
  }

  async function handleProcess() {
    if (!contractId) return
    setError(null)
    setProcessStep(2)
    setPhase('processing')

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_id: contractId, custom_terms: customTerms }),
      })
      if (!res.ok) {
        setError(await extractApiErrorMessage(res))
        setPhase('preview')
        return
      }
      setProcessStep(3)
      router.push(`/review/${contractId}`)
    } catch {
      setError('Something went wrong. Check your connection and try again.')
      setPhase('preview')
    }
  }

  return (
    <div style={{ padding: '40px 48px', maxWidth: '720px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 500, color: '#070A0E', marginBottom: '4px' }}>
          Review a Contract
        </h1>
        <p style={{ fontSize: '14px', color: '#4A4C4F' }}>
          Upload an NDA or MSA and get AI-powered key term extraction in under 30 seconds.
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: '24px' }}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {(phase === 'form' || phase === 'uploading') && (
        <>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#070A0E', marginBottom: '8px' }}>
              Contract type
            </label>
            <ContractTypeSelector value={contractType} onChange={setContractType} disabled={phase === 'uploading'} />
          </div>

          <UploadDropzone
            selectedFile={file}
            onFileSelected={setFile}
            onValidationError={setError}
            disabled={phase === 'uploading'}
          />

          {phase === 'uploading' ? (
            <ProcessingProgress step={1} />
          ) : (
            <button
              type="button"
              className="btn-primary"
              disabled={!canUpload}
              onClick={handleUpload}
              style={{ opacity: canUpload ? 1 : 0.5, cursor: canUpload ? 'pointer' : 'not-allowed' }}
            >
              Upload &amp; Preview
            </button>
          )}
        </>
      )}

      {phase === 'preview' && contractType && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 500, color: '#070A0E', marginBottom: '12px' }}>
              We&apos;ll extract these key terms
            </h2>
            <PreProcessingPreview contractType={contractType} customTerms={customTerms} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#070A0E', marginBottom: '8px' }}>
              Add custom terms (optional)
            </label>
            <CustomTermInput
              terms={customTerms}
              onAdd={(term) => setCustomTerms((prev) => [...prev, term])}
              onRemove={(index) => setCustomTerms((prev) => prev.filter((_, i) => i !== index))}
            />
          </div>

          <button type="button" className="btn-primary" onClick={handleProcess} style={{ alignSelf: 'flex-start' }}>
            Process Contract
          </button>
        </div>
      )}

      {phase === 'processing' && <ProcessingProgress step={processStep} />}
    </div>
  )
}
