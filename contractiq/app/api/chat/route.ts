import { requireAuth } from '@/lib/security/authGuard'
import { jsonError, jsonOk } from '@/lib/api/response'
import { chatRequestSchema } from '@/lib/security/inputValidator'
import { classifyQuery, getChatResponse } from '@/lib/openai/chat'
import { verifyContractOwnership } from '@/lib/security/chatSecurity'
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rateLimiter'
import { sanitizeForLLM } from '@/lib/security/promptInjectionGuard'
import { MAX_CHAT_HISTORY } from '@/lib/security/tokenLimiter'

export async function POST(request: Request) {
  const { supabase, user, response } = await requireAuth()
  if (response) return response

  const rateLimit = await checkRateLimit({ userId: user.id }, RATE_LIMITS.chat)
  if (rateLimit.limited) {
    return jsonError('RATE_LIMITED', 'Too many messages. Please slow down and try again shortly.', 429)
  }

  const body = await request.json().catch(() => null)
  const parsedBody = chatRequestSchema.safeParse(body)
  if (!parsedBody.success) {
    return jsonError('VALIDATION_ERROR', 'Message must be between 1 and 1000 characters.', 422)
  }
  const { contract_id: contractId, message } = parsedBody.data

  const injectionCheck = sanitizeForLLM(message)
  if (!injectionCheck.safe) {
    console.error({ context: 'prompt_injection_blocked', userId: user.id, contractId, matchedPattern: injectionCheck.matchedPattern })
    return jsonError('PROMPT_INJECTION', "This message couldn't be processed. Please rephrase and try again.", 400)
  }

  const contract = await verifyContractOwnership(supabase, contractId, user.id)
  if (!contract) return jsonError('NOT_FOUND', undefined, 404)
  if (contract.status !== 'complete') {
    return jsonError('CONTRACT_NOT_READY', 'Contract has not been processed yet.', 400)
  }

  const { data: session } = await supabase
    .from('chat_sessions')
    .upsert({ contract_id: contractId, user_id: user.id }, { onConflict: 'contract_id,user_id' })
    .select('id')
    .single()

  if (!session) {
    console.error({ context: 'chat_session_upsert_failed', contractId })
    return jsonError('INTERNAL_ERROR', 'Chat failed. Please try again in a few minutes.', 500)
  }

  const { data: existingMessages } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true })
    .limit(MAX_CHAT_HISTORY)

  const classification = classifyQuery(message)

  const { error: userInsertError } = await supabase
    .from('chat_messages')
    .insert({ session_id: session.id, role: 'user', content: message })

  if (userInsertError) {
    console.error({ error: userInsertError, context: 'chat_user_message_insert', contractId })
    return jsonError('INTERNAL_ERROR', 'Chat failed. Please try again in a few minutes.', 500)
  }

  let assistant: Awaited<ReturnType<typeof getChatResponse>>
  try {
    assistant = await getChatResponse(classification, contract.contract_text, existingMessages ?? [], message)
  } catch (error) {
    console.error({ error, context: 'openai_chat', contractId })
    return jsonError('OPENAI_ERROR', 'Chat failed. Please try again in a few minutes.', 500)
  }

  const { data: assistantMsg, error: assistantInsertError } = await supabase
    .from('chat_messages')
    .insert({
      session_id: session.id,
      role: 'assistant',
      content: assistant.content,
      page_citation: assistant.pageCitation,
      context_source: assistant.contextSource,
    })
    .select('id')
    .single()

  if (assistantInsertError || !assistantMsg) {
    console.error({ error: assistantInsertError, context: 'chat_assistant_message_insert', contractId })
    return jsonError('INTERNAL_ERROR', 'Chat failed. Please try again in a few minutes.', 500)
  }

  return jsonOk(
    {
      message_id: assistantMsg.id,
      content: assistant.content,
      page_citation: assistant.pageCitation,
      context_source: assistant.contextSource,
    },
    200
  )
}
