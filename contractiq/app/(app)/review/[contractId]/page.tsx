import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DisclaimerBanner from '@/components/shared/DisclaimerBanner'
import ReviewClient from '@/components/review/ReviewClient'
import type { Contract, KeyTerm } from '@/lib/types/app.types'

const SIGNED_URL_EXPIRY_SECONDS = 3600

type ReviewPageProps = {
  params: { contractId: string }
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const supabase = createClient()

  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', params.contractId)
    .single()

  if (!contract) notFound()

  // Used by the 90-day Storage retention job (database.sql §7) — not the deadline
  // itself, just the clock it measures against.
  await supabase.from('contracts').update({ last_accessed_at: new Date().toISOString() }).eq('id', params.contractId)

  let signedUrl: string | null = null
  if (contract.file_path) {
    const objectPath = contract.file_path.replace(/^contracts\//, '')
    const { data } = await supabase.storage.from('contracts').createSignedUrl(objectPath, SIGNED_URL_EXPIRY_SECONDS)
    signedUrl = data?.signedUrl ?? null
  }

  const { data: terms } = await supabase
    .from('key_terms')
    .select('*')
    .eq('contract_id', params.contractId)
    .order('created_at', { ascending: true })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <DisclaimerBanner />
      <ReviewClient
        contract={contract as Contract}
        initialTerms={(terms ?? []) as KeyTerm[]}
        initialSignedUrl={signedUrl}
      />
    </div>
  )
}
