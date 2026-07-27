import { createAdminClient } from '@/lib/supabase/admin'
import { jsonError, jsonOk } from '@/lib/api/response'

const RETENTION_DAYS = 90

// Invoked only by the pg_cron job in database.sql §7 — never by a user or the
// frontend. Removes stale PDFs from Storage; the contract row, contract_text,
// key_terms, and chat history are all untouched (see spec-data-retention.md —
// this is deliberately NOT contract deletion).
export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return jsonError('FORBIDDEN', undefined, 403)
  }

  const supabaseAdmin = createAdminClient()
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: staleContracts } = await supabaseAdmin
    .from('contracts')
    .select('id, file_path')
    .not('file_path', 'is', null)
    .lt('last_accessed_at', cutoff)

  let processed = 0
  for (const contract of staleContracts ?? []) {
    const objectPath = (contract.file_path as string).replace(/^contracts\//, '')
    const { error } = await supabaseAdmin.storage.from('contracts').remove([objectPath])

    if (!error) {
      await supabaseAdmin.from('contracts').update({ file_path: null }).eq('id', contract.id)
      processed += 1
    } else {
      console.error({ error, context: 'cleanup_storage', contractId: contract.id })
      // Leave file_path as-is — retried on the next daily run.
    }
  }

  return jsonOk({ processed }, 200)
}
