import { getAuthedContext } from '@/lib/api/auth'
import { jsonError, jsonOk } from '@/lib/api/response'

const SIGNED_URL_EXPIRY_SECONDS = 3600

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getAuthedContext()
  if (!user) return jsonError('UNAUTHORIZED', undefined, 401)

  const { data: contract } = await supabase
    .from('contracts')
    .select('file_path')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!contract) return jsonError('CONTRACT_NOT_FOUND', undefined, 404)
  if (!contract.file_path) return jsonOk({ signedUrl: null }, 200)

  // file_path is stored with a "contracts/" (bucket-name) prefix; the Storage API
  // wants the object path *within* the bucket — see app/api/upload/route.ts.
  const objectPath = contract.file_path.replace(/^contracts\//, '')
  const { data, error } = await supabase.storage.from('contracts').createSignedUrl(objectPath, SIGNED_URL_EXPIRY_SECONDS)

  if (error || !data) {
    console.error({ error, context: 'signed_url', contractId: params.id })
    return jsonOk({ signedUrl: null }, 200)
  }

  return jsonOk({ signedUrl: data.signedUrl }, 200)
}
