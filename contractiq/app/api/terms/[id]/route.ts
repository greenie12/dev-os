import { requireAuth } from '@/lib/security/authGuard'
import { jsonError, jsonOk } from '@/lib/api/response'
import { termEditSchema } from '@/lib/security/inputValidator'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user, response } = await requireAuth()
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsedBody = termEditSchema.safeParse(body)
  if (!parsedBody.success) {
    return jsonError('VALIDATION_ERROR', parsedBody.error.issues[0].message, 422)
  }
  const { value } = parsedBody.data

  const { data: term } = await supabase
    .from('key_terms')
    .select('value, is_edited, user_id')
    .eq('id', params.id)
    .single()

  if (!term) return jsonError('TERM_NOT_FOUND', undefined, 404)
  if (term.user_id !== user.id) return jsonError('FORBIDDEN', undefined, 403)

  const updatePayload: { value: string; is_edited: boolean; original_ai_value?: string } = {
    value,
    is_edited: true,
  }
  // Only capture the original AI value on the *first* edit — subsequent edits must not
  // overwrite it, or the feedback-loop signal (what did the model originally say) is lost.
  if (!term.is_edited) {
    updatePayload.original_ai_value = term.value
  }

  const { error } = await supabase.from('key_terms').update(updatePayload).eq('id', params.id)
  if (error) {
    console.error({ error, context: 'term_update', termId: params.id })
    return jsonError('INTERNAL_ERROR', 'Failed to save. Try again.', 500)
  }

  return jsonOk({ id: params.id, value, is_edited: true }, 200)
}
