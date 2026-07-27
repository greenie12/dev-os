import { requireAuth } from '@/lib/security/authGuard'
import { jsonError, jsonOk } from '@/lib/api/response'
import { extractContractText } from '@/lib/pdf/parse'
import { estimateTokenCount, MAX_CONTRACT_TOKENS } from '@/lib/utils/tokens'
import { MAX_PAGE_COUNT, MIN_WORD_COUNT } from '@/lib/constants/limits'
import { validateFileUpload, uploadContractTypeSchema } from '@/lib/security/inputValidator'
import { sanitizeForLLM } from '@/lib/security/promptInjectionGuard'
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rateLimiter'
import type { ContractType } from '@/lib/types/app.types'

export async function POST(request: Request) {
  const { supabase, user, response } = await requireAuth()
  if (response) return response

  const rateLimit = await checkRateLimit({ userId: user.id }, RATE_LIMITS.upload)
  if (rateLimit.limited) {
    return jsonError('RATE_LIMITED', 'Too many uploads today. Please try again tomorrow.', 429)
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    // request.formData() throws (rather than rejecting gracefully) when Content-Type
    // isn't multipart/form-data or url-encoded at all — e.g. no body, or a JSON body
    // sent to this endpoint by mistake. Without this catch, that becomes an uncaught
    // exception and a bare 500.
    return jsonError('VALIDATION_ERROR', 'Expected multipart/form-data with a file and contract_type.', 422)
  }

  const file = formData.get('file') as File | null
  const contractTypeInput = formData.get('contract_type')

  const parsedType = uploadContractTypeSchema.safeParse(contractTypeInput)
  if (!parsedType.success) {
    return jsonError('VALIDATION_ERROR', "Contract type must be 'nda' or 'msa'.", 422)
  }
  const contractType: ContractType = parsedType.data

  if (!file) {
    return jsonError('VALIDATION_ERROR', 'A PDF file is required.', 422)
  }

  const fileCheck = validateFileUpload(file)
  if (!fileCheck.valid) {
    return jsonError('INVALID_FILE_TYPE', fileCheck.error, 400)
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  let extracted: { text: string; pageCount: number }
  try {
    extracted = await extractContractText(buffer)
  } catch (error) {
    console.error({ error, context: 'pdf_parse', userId: user.id })
    return jsonError('INVALID_FILE_TYPE', 'Could not read this PDF. It may be corrupted.', 400)
  }

  if (extracted.pageCount > MAX_PAGE_COUNT) {
    return jsonError('TOO_MANY_PAGES', 'Contract exceeds 20 page limit.', 400)
  }

  const wordCount = extracted.text.trim().split(/\s+/).filter(Boolean).length
  if (wordCount < MIN_WORD_COUNT) {
    return jsonError('SCANNED_PDF', 'Scanned PDFs are not supported yet. Please upload a text-layer PDF.', 400)
  }

  const tokenCount = estimateTokenCount(extracted.text)
  if (tokenCount > MAX_CONTRACT_TOKENS) {
    return jsonError(
      'CONTRACT_TOO_LONG',
      'This contract is too long for the current version. Contracts over 15,000 tokens are not supported yet.',
      400
    )
  }

  // Defense-in-depth: a malicious PDF's text could embed instructions aimed at the
  // extraction/chat prompts that will read this contract_text on every future call.
  // Caught here, once, at upload time — not re-checked on every later read.
  const injectionCheck = sanitizeForLLM(extracted.text)
  if (!injectionCheck.safe) {
    console.error({ context: 'prompt_injection_blocked', userId: user.id, matchedPattern: injectionCheck.matchedPattern })
    return jsonError('PROMPT_INJECTION', "This document couldn't be processed. Please contact support if you believe this is an error.", 400)
  }

  const { data: contract, error: insertError } = await supabase
    .from('contracts')
    .insert({
      user_id: user.id,
      file_name: file.name,
      file_size_bytes: file.size,
      contract_type: contractType,
      contract_text: extracted.text,
      status: 'pending',
      page_count: extracted.pageCount,
      token_count: tokenCount,
    })
    .select('id')
    .single()

  if (insertError || !contract) {
    console.error({ error: insertError, context: 'contract_insert', userId: user.id })
    return jsonError('INTERNAL_ERROR', 'Upload failed. Please try again.', 500)
  }

  // Storage upload is non-blocking — failure only degrades the results page to
  // the text viewer (spec-upload-flow.md). Do not await this before responding.
  void uploadToStorage(supabase, user.id, contract.id, file.name, buffer)
    .then((filePath) => {
      if (filePath) {
        return supabase.from('contracts').update({ file_path: filePath }).eq('id', contract.id)
      }
    })
    .catch((error) => console.error({ error, context: 'storage_upload_unhandled', contractId: contract.id }))

  return jsonOk({ contract_id: contract.id, page_count: extracted.pageCount, contract_type: contractType }, 200)
}

async function uploadToStorage(
  supabase: Awaited<ReturnType<typeof requireAuth>>['supabase'],
  userId: string,
  contractId: string,
  fileName: string,
  buffer: Buffer
): Promise<string | null> {
  const objectPath = `${userId}/${contractId}/${fileName}`
  const { error } = await supabase.storage
    .from('contracts')
    .upload(objectPath, buffer, { contentType: 'application/pdf', upsert: false })

  if (error) {
    console.error({ error, context: 'storage_upload', contractId })
    return null
  }
  // Stored with the bucket-name prefix per engineering-doc.md §7 file_path convention;
  // callers that pass this back into the Storage API (signed URLs, delete) must strip
  // the leading "contracts/" segment first — see app/api/contracts/[id]/signed-url and
  // app/api/contracts/[id]/route.ts.
  return `contracts/${objectPath}`
}
