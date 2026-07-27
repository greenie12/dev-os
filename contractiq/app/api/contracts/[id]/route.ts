import { getAuthedContext } from '@/lib/api/auth'
import { jsonError } from '@/lib/api/response'

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getAuthedContext()
  if (!user) return jsonError('UNAUTHORIZED', undefined, 401)

  const { data: contract, error: fetchError } = await supabase
    .from('contracts')
    .select('id, user_id, file_path')
    .eq('id', params.id)
    .single()

  if (fetchError || !contract) return jsonError('CONTRACT_NOT_FOUND', undefined, 404)
  if (contract.user_id !== user.id) return jsonError('FORBIDDEN', undefined, 403)

  // Storage delete runs *before* the DB delete: if Storage fails, the contract row
  // (and its file_path) still exists to retry against. Reversing the order would risk
  // orphaning the Storage object with nothing left pointing at it to retry cleanup.
  if (contract.file_path) {
    const objectPath = contract.file_path.replace(/^contracts\//, '')
    const { error: storageError } = await supabase.storage.from('contracts').remove([objectPath])
    if (storageError) {
      console.error({ error: storageError, context: 'storage_delete', contractId: params.id })
    }
  }

  const { error: deleteError } = await supabase.from('contracts').delete().eq('id', params.id).eq('user_id', user.id)

  if (deleteError) {
    console.error({ error: deleteError, context: 'contract_delete', contractId: params.id })
    return jsonError('INTERNAL_ERROR', 'Delete failed. Please try again.', 500)
  }

  return new Response(null, { status: 204 })
}
