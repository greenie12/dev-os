import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { KeyTerm } from '@/lib/types/app.types'

async function fetchKeyTerms(contractId: string): Promise<KeyTerm[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('key_terms')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export function useKeyTerms(contractId: string | null) {
  return useSWR<KeyTerm[]>(
    contractId ? ['key_terms', contractId] : null,
    () => fetchKeyTerms(contractId!)
  )
}
