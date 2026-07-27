'use client'

import { useEffect, useRef, useState } from 'react'
import type { Contract, ContractStatus } from '@/lib/types/app.types'

type ContractTableProps = {
  contracts: Contract[]
  isLoading: boolean
  onRowClick: (contractId: string) => void
  onDeleteRequest: (contractId: string, contractName: string) => void
}

type SortColumn = 'file_name' | 'contract_type' | 'created_at'
type SortDirection = 'asc' | 'desc'

const STATUS_STYLES: Record<ContractStatus, { bg: string; border: string; text: string; label: string }> = {
  complete: { bg: '#E7F6E7', border: '#92D490', text: '#0D720A', label: 'Complete' },
  processing: { bg: '#E7EFFC', border: '#92B7F0', text: '#0D469E', label: 'Processing…' },
  pending: { bg: '#F0F0F1', border: '#C1C2C3', text: '#4A4C4F', label: 'Pending' },
  error: { bg: '#FAEBEB', border: '#EAA2A3', text: '#942528', label: 'Error' },
}

const COLUMNS: { key: SortColumn; label: string }[] = [
  { key: 'file_name', label: 'Contract name' },
  { key: 'contract_type', label: 'Type' },
  { key: 'created_at', label: 'Date uploaded' },
]

export default function ContractTable({ contracts, isLoading, onRowClick, onDeleteRequest }: ContractTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!openMenuRowId) return
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuRowId(null)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenMenuRowId(null)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [openMenuRowId])

  function handleSort(column: SortColumn) {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const sorted = [...contracts].sort((a, b) => {
    const dir = sortDirection === 'asc' ? 1 : -1
    if (sortColumn === 'created_at') {
      return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir
    }
    return a[sortColumn].localeCompare(b[sortColumn]) * dir
  })

  if (isLoading) {
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <caption className="sr-only">Contract history</caption>
        <tbody>
          {[0, 1, 2].map((i) => (
            <tr key={i}>
              {[0, 1, 2, 3, 4, 5].map((c) => (
                <td key={c} style={{ padding: '14px 12px' }}>
                  <div style={{ height: '16px', background: '#F0F0F1', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </table>
    )
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#FFFFFF', border: '1px solid #F0F0F1', borderRadius: '8px' }}>
      <caption className="sr-only">Contract history</caption>
      <thead>
        <tr style={{ borderBottom: '1px solid #F0F0F1' }}>
          {COLUMNS.map((col) => (
            <th
              key={col.key}
              role="columnheader"
              aria-sort={sortColumn === col.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              style={{ textAlign: 'left', padding: '12px', fontSize: '12px', fontWeight: 500, color: '#4A4C4F' }}
            >
              <button
                type="button"
                aria-label={`Sort by ${col.label}`}
                onClick={() => handleSort(col.key)}
                style={{ background: 'transparent', border: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: 0 }}
              >
                {col.label}
                {sortColumn === col.key && <span aria-hidden="true">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
              </button>
            </th>
          ))}
          <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', fontWeight: 500, color: '#4A4C4F' }}>Status</th>
          <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', fontWeight: 500, color: '#4A4C4F' }}>Pages</th>
          <th style={{ width: '40px' }} />
        </tr>
      </thead>
      <tbody>
        {sorted.map((contract) => {
          const status = STATUS_STYLES[contract.status]
          return (
            <tr
              key={contract.id}
              role="row"
              tabIndex={0}
              onClick={() => onRowClick(contract.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onRowClick(contract.id)
                }
              }}
              style={{ borderBottom: '1px solid #F0F0F1', cursor: 'pointer' }}
            >
              <td style={{ padding: '14px 12px', fontSize: '14px', color: '#070A0E', fontWeight: 500 }}>{contract.file_name}</td>
              <td style={{ padding: '14px 12px', fontSize: '13px', color: '#4A4C4F', textTransform: 'uppercase' }}>{contract.contract_type}</td>
              <td style={{ padding: '14px 12px', fontSize: '13px', color: '#4A4C4F' }}>
                {new Date(contract.created_at).toLocaleDateString()}
              </td>
              <td style={{ padding: '14px 12px' }}>
                <span className="badge" style={{ background: status.bg, border: `1px solid ${status.border}`, color: status.text }}>
                  {status.label}
                </span>
              </td>
              <td style={{ padding: '14px 12px', fontSize: '13px', color: '#4A4C4F' }}>{contract.page_count}</td>
              <td style={{ padding: '14px 12px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  aria-label={`Actions for ${contract.file_name}`}
                  aria-haspopup="menu"
                  aria-expanded={openMenuRowId === contract.id}
                  onClick={() => setOpenMenuRowId((prev) => (prev === contract.id ? null : contract.id))}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#4A4C4F', padding: '4px 8px' }}
                >
                  ⋮
                </button>
                {openMenuRowId === contract.id && (
                  <div
                    ref={menuRef}
                    role="menu"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '36px',
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
                        setOpenMenuRowId(null)
                        onDeleteRequest(contract.id, contract.file_name)
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
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
