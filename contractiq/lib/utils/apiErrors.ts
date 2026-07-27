// Maps API error codes (the `error` field every app/api/* route returns) to the
// user-facing copy specified across the specs. Falls back to the route's own
// `message` field, then a generic string, so a new/unlisted code never renders blank.
const ERROR_MESSAGES: Record<string, string> = {
  FILE_TOO_LARGE: 'File exceeds the 10 MB limit. Please upload a smaller PDF.',
  TOO_MANY_PAGES: 'Contract exceeds 20 page limit. Longer contracts are not supported yet.',
  SCANNED_PDF: 'Scanned PDFs are not supported yet. Please upload a text-layer PDF.',
  CONTRACT_TOO_LONG: 'This contract is too long. Contracts over 15,000 tokens are not supported yet.',
  INVALID_CONTRACT_TYPE: 'Please select a contract type (NDA or MSA).',
  INVALID_FILE_TYPE: 'Only PDF files are accepted.',
  PARSE_FAILURE: 'AI analysis failed. Please try again.',
  OPENAI_ERROR: 'Analysis failed. Please try again in a few minutes.',
  RATE_LIMITED: 'Too many analyses. Please wait a moment.',
  TOO_MANY_CUSTOM_TERMS: 'Maximum 5 custom terms allowed.',
  CONTRACT_NOT_FOUND: 'This contract could not be found.',
  ALREADY_PROCESSED: 'This contract has already been processed.',
  CONTRACT_NOT_READY: 'Contract has not been processed yet.',
  MESSAGE_TOO_LONG: 'Message must be under 1000 characters.',
  UNAUTHORIZED: 'Please sign in again.',
  VALIDATION_ERROR: 'That request was not valid. Please check your input and try again.',
  PROMPT_INJECTION: "This request couldn't be processed. Please rephrase and try again.",
  FORBIDDEN: "You don't have access to this.",
  NOT_FOUND: 'This could not be found.',
}

export async function extractApiErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json()
    // Prefer the route's own message when it sent one (e.g. a rate-limit response
    // with a dynamic retry-after) over the generic per-code default below.
    return body.message ?? ERROR_MESSAGES[body.error] ?? 'Something went wrong. Check your connection and try again.'
  } catch {
    return 'Something went wrong. Check your connection and try again.'
  }
}
