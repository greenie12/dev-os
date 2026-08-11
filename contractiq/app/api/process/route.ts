import { requireAuth } from '@/lib/security/authGuard'
import { jsonError, jsonOk } from '@/lib/api/response'
import { processRequestSchema } from '@/lib/security/inputValidator'
import { extractKeyTerms, ExtractionParseError } from '@/lib/azure/extract'
import { verifyContractOwnership } from '@/lib/security/chatSecurity'
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rateLimiter'
import { sanitizeForLLM } from '@/lib/security/promptInjectionGuard'

// The Azure agent can take 20-30s to respond. The Edge runtime's shorter timeout
// would cut the request off, so this route is forced onto the Node.js runtime.
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  const { supabase, user, response } = await requireAuth()
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsedBody = processRequestSchema.safeParse(body)
  if (!parsedBody.success) {
    return jsonError('VALIDATION_ERROR', 'Maximum 5 custom terms allowed, each under 100 characters.', 422)
  }
  const { contract_id: contractId, custom_terms: customTerms = [] } = parsedBody.data

  // Custom terms are free text the user typed — they get embedded directly into
  // the extraction prompt (lib/azure/extract.ts), so they need the same
  // injection check as any other user-supplied text bound for an LLM call.
  for (const term of customTerms) {
    const check = sanitizeForLLM(term)
    if (!check.safe) {
      return jsonError('PROMPT_INJECTION', 'One of the custom terms could not be processed. Please rephrase and try again.', 400)
    }
  }

  const contract = await verifyContractOwnership(supabase, contractId, user.id)
  if (!contract) return jsonError('CONTRACT_NOT_FOUND', undefined, 404)
  if (contract.status === 'complete') return jsonError('ALREADY_PROCESSED', undefined, 400)

  // 5 extraction calls per user per hour — see lib/security/rateLimiter.ts.
  // Supersedes the old is_rate_limited() DB function (database.sql) so every
  // rate-limited endpoint shares one consistent mechanism.
  const rateLimit = await checkRateLimit({ userId: user.id }, RATE_LIMITS.process)
  if (rateLimit.limited) {
    return jsonError('RATE_LIMITED', 'Too many analyses. Please wait a moment.', 429)
  }

  await supabase.from('contracts').update({ status: 'processing' }).eq('id', contractId)

  let extracted
  try {
    extracted = await extractKeyTerms(contract.contract_type, contract.contract_text, customTerms)
  } catch (error) {
    await supabase.from('contracts').update({ status: 'error' }).eq('id', contractId)

    if (error instanceof ExtractionParseError) {
      return jsonError('PARSE_FAILURE', error.message, 422)
    }
    console.error({ error, context: 'azure_extraction', contractId })
    const azureMessage = error instanceof Error ? error.message : 'Unknown Azure agent error'
    return jsonError('AZURE_ERROR', azureMessage, 500)
  }

  const rows = extracted.map((term) => ({
    contract_id: contractId,
    user_id: user.id,
    term_name: term.term_name,
    value: term.value,
    original_ai_value: term.value,
    page_number: term.page_number ?? 1,
    confidence_score: term.confidence_score,
    source_sentence: term.source_sentence,
    is_manual: term.is_manual,
  }))

  const { data: insertedTerms, error: insertError } = await supabase.from('key_terms').insert(rows).select()

  if (insertError) {
    await supabase.from('contracts').update({ status: 'error' }).eq('id', contractId)
    console.error({ error: insertError, context: 'key_terms_insert', contractId })
    return jsonError('INTERNAL_ERROR', 'Analysis failed. Please try again.', 500)
  }

  await supabase.from('contracts').update({ status: 'complete' }).eq('id', contractId)

  return jsonOk({ terms: insertedTerms }, 200)
}
