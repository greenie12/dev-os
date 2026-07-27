import { requireAuth } from '@/lib/security/authGuard'
import { jsonError, jsonOk } from '@/lib/api/response'
import { feedbackRequestSchema } from '@/lib/security/inputValidator'

export async function POST(request: Request) {
  const { supabase, user, response } = await requireAuth()
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsedBody = feedbackRequestSchema.safeParse(body)
  if (!parsedBody.success) {
    return jsonError('VALIDATION_ERROR', parsedBody.error.issues[0].message, 422)
  }
  const { contract_id: contractId, rating, comment } = parsedBody.data

  const { data: contract } = await supabase
    .from('contracts')
    .select('id')
    .eq('id', contractId)
    .eq('user_id', user.id)
    .single()

  if (!contract) return jsonError('CONTRACT_NOT_FOUND', undefined, 400)

  const { data: feedback, error } = await supabase
    .from('user_feedback')
    .upsert({ user_id: user.id, contract_id: contractId, rating, comment: comment ?? null }, { onConflict: 'user_id,contract_id' })
    .select('id')
    .single()

  if (error) {
    console.error({ error, context: 'feedback_upsert', contractId })
    return jsonError('INTERNAL_ERROR', 'Could not submit feedback. Please try again.', 500)
  }

  return jsonOk({ feedback_id: feedback.id }, 201)
}
