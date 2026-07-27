import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { Contract } from '@/lib/types/app.types'

async function fetchContracts(): Promise<Contract[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export function useContracts() {
  return useSWR<Contract[]>('contracts', fetchContracts)
}
