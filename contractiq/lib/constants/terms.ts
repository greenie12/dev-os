import type { ContractType } from '@/lib/types/app.types'

// Shared by the upload flow's PreProcessingPreview (what we tell the user we'll
// extract) and lib/azure/extract.ts (what we actually ask the Azure agent to
// extract) — spec-upload-flow.md and spec-extraction.md both define these lists
// and they must stay identical, so they live in one place.
export const NDA_TERMS = [
  'Parties',
  'Effective Date',
  'Confidentiality Obligations',
  'Permitted Disclosures',
  'Term & Duration',
  'Governing Law',
  'Jurisdiction',
  'IP Ownership',
  'Non-Solicitation',
  'Breach & Remedy',
] as const

export const MSA_TERMS = [
  'Parties',
  'Service Scope',
  'Payment Terms',
  'Invoice Schedule',
  'Late Payment Penalty',
  'Liability Cap',
  'Indemnification',
  'IP Ownership',
  'Termination Clause',
  'Governing Law',
  'Dispute Resolution',
  'Notice Period',
] as const

export function getStandardTerms(contractType: ContractType): readonly string[] {
  return contractType === 'nda' ? NDA_TERMS : MSA_TERMS
}

export const MAX_CUSTOM_TERMS = 5
export const MAX_CUSTOM_TERM_LENGTH = 100
