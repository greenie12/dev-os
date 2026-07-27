'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useContracts } from '@/hooks/useContracts'
import DashboardStats from '@/components/dashboard/DashboardStats'
import ContractTable from '@/components/dashboard/ContractTable'
import EmptyState from '@/components/dashboard/EmptyState'
import DeleteConfirmModal from '@/components/shared/DeleteConfirmModal'
import ErrorBanner from '@/components/shared/ErrorBanner'

export default function DashboardPage() {
  const router = useRouter()
  const { data: contracts, isLoading, mutate } = useContracts()
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = contracts?.length ?? 0
  const ndaCount = contracts?.filter((c) => c.contract_type === 'nda').length ?? 0
  const msaCount = contracts?.filter((c) => c.contract_type === 'msa').length ?? 0

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/contracts/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) {
        setError("Couldn't delete this contract. Please try again.")
        return
      }
      setDeleteTarget(null)
      await mutate()
    } catch {
      setError("Couldn't delete this contract. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 500, color: '#070A0E', marginBottom: '4px' }}>Dashboard</h1>
          <p style={{ fontSize: '14px', color: '#4A4C4F' }}>Your contract review history</p>
        </div>
        <a href="/upload" className="btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }}>
          Review a Contract
        </a>
      </div>

      {error && (
        <div style={{ marginBottom: '24px' }}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <DashboardStats total={total} ndaCount={ndaCount} msaCount={msaCount} isLoading={isLoading} />

      {!isLoading && total === 0 ? (
        <EmptyState onCTAClick={() => router.push('/upload')} />
      ) : (
        <ContractTable
          contracts={contracts ?? []}
          isLoading={isLoading}
          onRowClick={(id) => router.push(`/review/${id}`)}
          onDeleteRequest={(id, name) => setDeleteTarget({ id, name })}
        />
      )}

      <DeleteConfirmModal
        contractName={deleteTarget?.name ?? ''}
        isOpen={deleteTarget !== null}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
