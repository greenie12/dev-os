import { azure, extractResponseText } from '@/lib/azure'
import { NDA_TERMS, MSA_TERMS } from '@/lib/constants/terms'
import { callWithRetry } from '@/lib/azure/retry'
import type { ContractType } from '@/lib/types/app.types'

export type ExtractedTerm = {
  term_name: string
  value: string
  page_number: number | null
  confidence_score: number
  source_sentence: string
  is_manual: boolean
}

export class ExtractionParseError extends Error {
  constructor(message = 'AI response could not be parsed. Please try again.') {
    super(message)
    this.name = 'ExtractionParseError'
  }
}

const EXTRACTION_SYSTEM_PROMPT = `You are a legal contract analyst specialising in NDA and MSA contracts. Your task is to extract specific key terms from the contract text provided.

For each term, return a JSON object with exactly these fields:
- "term_name": string — the name of the term exactly as listed in the request
- "value": string — the extracted value, verbatim or directly quoted where possible. If the term is not present in the document, use "Not found"
- "page_number": integer — the 1-indexed page number where the value appears, indicated by [PAGE N] markers in the text. Use null if value is "Not found"
- "confidence_score": number — your confidence in the accuracy of this extraction, from 0 to 100. Use 0 if value is "Not found"
- "source_sentence": string — the exact verbatim sentence from the contract that contains the value. Use "" if value is "Not found"

RULES:
1. Only extract from the document text provided. Never use general legal knowledge to fill in values.
2. If a term is not explicitly stated in the document, return value = "Not found" with confidence_score = 0.
3. Quote verbatim where possible — do not paraphrase values.
4. page_number must match the [PAGE N] marker immediately preceding the relevant text.
5. confidence_score should reflect how clearly the term is stated (not how important it is).
6. Respond with ONLY the JSON object described below. No explanation, no markdown code fences, no surrounding text.

---

EXAMPLES:

Example 1 (NDA — Parties):
Input text snippet:
[PAGE 1]
This Non-Disclosure Agreement ("Agreement") is entered into as of March 1, 2024, between Acme Corp, a Delaware corporation ("Disclosing Party"), and Beta LLC, a California limited liability company ("Receiving Party").

Output:
{
  "term_name": "Parties",
  "value": "Acme Corp (Disclosing Party) and Beta LLC (Receiving Party)",
  "page_number": 1,
  "confidence_score": 98,
  "source_sentence": "This Non-Disclosure Agreement (\\"Agreement\\") is entered into as of March 1, 2024, between Acme Corp, a Delaware corporation (\\"Disclosing Party\\"), and Beta LLC, a California limited liability company (\\"Receiving Party\\")."
}

---

Example 2 (NDA — Term & Duration):
Input text snippet:
[PAGE 3]
The obligations of confidentiality set forth herein shall remain in effect for a period of three (3) years from the Effective Date of this Agreement.

Output:
{
  "term_name": "Term & Duration",
  "value": "3 years from Effective Date",
  "page_number": 3,
  "confidence_score": 95,
  "source_sentence": "The obligations of confidentiality set forth herein shall remain in effect for a period of three (3) years from the Effective Date of this Agreement."
}

---

Example 3 (NDA — IP Ownership — Not found):
Input text snippet: (no IP ownership clause present in document)

Output:
{
  "term_name": "IP Ownership",
  "value": "Not found",
  "page_number": null,
  "confidence_score": 0,
  "source_sentence": ""
}

---

Example 4 (MSA — Liability Cap):
Input text snippet:
[PAGE 9]
In no event shall either party's aggregate liability to the other exceed the total fees paid or payable by Client to Service Provider during the twelve (12) months immediately preceding the event giving rise to the claim.

Output:
{
  "term_name": "Liability Cap",
  "value": "Aggregate liability capped at 12 months of fees paid",
  "page_number": 9,
  "confidence_score": 92,
  "source_sentence": "In no event shall either party's aggregate liability to the other exceed the total fees paid or payable by Client to Service Provider during the twelve (12) months immediately preceding the event giving rise to the claim."
}

---

Example 5 (MSA — Termination Clause):
Input text snippet:
[PAGE 11]
Either party may terminate this Agreement upon thirty (30) days prior written notice to the other party. Either party may terminate this Agreement immediately upon written notice if the other party commits a material breach of this Agreement and fails to cure such breach within fifteen (15) days of receiving written notice thereof.

Output:
{
  "term_name": "Termination Clause",
  "value": "30 days written notice; immediate for uncured material breach (15-day cure period)",
  "page_number": 11,
  "confidence_score": 94,
  "source_sentence": "Either party may terminate this Agreement upon thirty (30) days prior written notice to the other party."
}

---

Example 6 (MSA — Late Payment Penalty — low confidence):
Input text snippet:
[PAGE 5]
Overdue amounts may be subject to interest charges at the maximum rate permitted by applicable law.

Output:
{
  "term_name": "Late Payment Penalty",
  "value": "Interest at maximum rate permitted by applicable law (rate not specified)",
  "page_number": 5,
  "confidence_score": 62,
  "source_sentence": "Overdue amounts may be subject to interest charges at the maximum rate permitted by applicable law."
}`

function buildUserPrompt(contractType: ContractType, termList: string, contractText: string): string {
  return `CONTRACT TYPE: ${contractType}

TERMS TO EXTRACT:
${termList}

CONTRACT TEXT:
${contractText}

Return a JSON object with key "terms" containing an array of extracted term objects following the schema above. Extract all terms listed, in order. Do not add or omit any term.`
}

// The agent endpoint has no forced JSON-mode equivalent to
// response_format: json_object, so the model occasionally wraps its answer in a
// ```json fence despite the "no markdown" instruction — strip that before parsing.
function stripCodeFence(content: string): string {
  const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i)
  return (fenceMatch ? fenceMatch[1] : content).trim()
}

function tryParseTerms(content: string | null | undefined): { terms: unknown[] } | null {
  if (!content) return null
  try {
    const parsed = JSON.parse(stripCodeFence(content))
    return Array.isArray(parsed?.terms) ? parsed : null
  } catch {
    return null
  }
}

export async function extractKeyTerms(
  contractType: ContractType,
  contractText: string,
  customTerms: string[]
): Promise<ExtractedTerm[]> {
  const standardTerms = contractType === 'nda' ? NDA_TERMS : MSA_TERMS
  const customLabels = customTerms.map((t) => `[Custom] ${t}`)
  const termList = [...standardTerms, ...customLabels].map((t) => `- ${t}`).join('\n')

  // The agent rejects a separate instructions/system field, so the extraction
  // rules and the actual request are bundled into one input message.
  const input = `${EXTRACTION_SYSTEM_PROMPT}\n\n---\n\n${buildUserPrompt(contractType, termList, contractText)}`

  // Transient-failure retry (3 attempts, exponential backoff). If this throws,
  // the caller (app/api/process/route.ts) reports 500 AZURE_ERROR.
  const response = await callWithRetry(() =>
    // The OpenAI SDK's TS types require `model` on responses.create(), but Azure
    // rejects it once an agent is specified. Cast to any to satisfy the compiler
    // without sending a model field at runtime.
    (azure.responses as any).create({
      input: [{ role: 'user', content: input }],
    })
  )

  let parsed = tryParseTerms(extractResponseText(response))

  if (!parsed) {
    // Single re-prompt for malformed-but-successful responses — not wrapped in
    // callWithRetry, since retrying identical input against a non-deterministic
    // failure mode with backoff wouldn't help; a corrective instruction might.
    // The agent only accepts a single user message per call (no assistant-role
    // history), so the correction is a fresh message restating the request plus
    // an explicit JSON-only instruction, rather than a follow-up turn.
    const retryInput = `${input}\n\nYour previous response was not valid JSON. Return ONLY the JSON object with key "terms" containing the array. No explanation, no markdown code fences, no surrounding text.`

    const retryResponse = await (azure.responses as any)
      .create({ input: [{ role: 'user', content: retryInput }] })
      .catch(() => null)

    parsed = retryResponse ? tryParseTerms(extractResponseText(retryResponse)) : null

    if (!parsed) {
      throw new ExtractionParseError()
    }
  }

  return validateAndNormalize(parsed.terms, customTerms)
}

function validateAndNormalize(terms: unknown[], customTerms: string[]): ExtractedTerm[] {
  return terms.map((raw) => {
    const t = raw as Record<string, unknown>
    const isNotFound = t.value === 'Not found'
    const rawName = String(t.term_name ?? '')
    const isManual = rawName.startsWith('[Custom] ') || customTerms.includes(rawName)
    const termName = rawName.replace(/^\[Custom\]\s*/, '')

    const sourceSentence = isNotFound ? '' : String(t.source_sentence ?? '')
    let confidenceScore = isNotFound ? 0 : Math.min(100, Math.max(0, Number(t.confidence_score) || 0))
    if (!isNotFound && sourceSentence === '') {
      confidenceScore = 30 // model found a value but couldn't cite a source sentence
    }

    return {
      term_name: termName,
      value: String(t.value ?? 'Not found'),
      page_number: isNotFound ? null : Number(t.page_number) || 1,
      confidence_score: confidenceScore,
      source_sentence: sourceSentence,
      is_manual: isManual,
    }
  })
}
