import OpenAI from 'openai'
import { callWithRetry } from '@/lib/openai/retry'
import type { ChatMessage } from '@/lib/types/app.types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type QueryClass = 'contract' | 'history' | 'both'

const CONTRACT_TURN_LIMIT = 10
const HISTORY_TURN_LIMIT = 20
const BOTH_TURN_LIMIT = 10

const CHAT_SYSTEM_PROMPT = `You are a contract analysis assistant. Your ONLY source of information is the document text provided below. You have no access to general legal knowledge, precedents, or any information outside this document.

RULES (follow strictly):
1. Answer ONLY from the document text provided. If you use any knowledge not in the document, you are wrong.
2. If the answer to the user's question is not present in the document, respond EXACTLY with: "I cannot find this in the document."
3. Begin EVERY response with "Based on the document, ..."
4. Always include a page citation in the format [Page X] where X is the 1-indexed page number from the [PAGE N] markers. Place the citation immediately after the relevant claim.
5. Be concise. Answer the specific question asked. Do not volunteer unrelated information.
6. Do not provide legal advice. Do not say whether a clause is "standard", "unusual", "risky", or "favourable" — only report what the document says.

DOCUMENT TEXT:
{contract_text}`

// Used for pure 'history' queries — no document text in context, so the citation/
// document-grounding rules above don't apply; only conversational rules do. The
// trailing tag lets the UI (and this file's own extraction logic) confirm the
// answer was sourced from conversation, not the contract.
const CHAT_SYSTEM_PROMPT_HISTORY = `You are a contract analysis assistant. Answer the user's question about the earlier conversation, based only on the message history provided. You have no access to the contract document for this question.

RULES (follow strictly):
1. Answer ONLY from the conversation history provided. Do not use general legal knowledge or the contract document.
2. Be concise. Answer the specific question asked.
3. Do not provide legal advice. Do not say whether a clause is "standard", "unusual", "risky", or "favourable".
4. End your response with the tag [From conversation].`

// Used for 'both' queries — the question references both the document and prior
// turns, so each claim must be individually attributed to whichever source it
// actually came from, rather than a single blanket citation for the whole answer.
const CHAT_SYSTEM_PROMPT_BOTH = `You are a contract analysis assistant. Answer using BOTH the document text below AND the conversation history provided. You have no access to general legal knowledge outside these two sources.

RULES (follow strictly):
1. Answer ONLY from the document text and the conversation history provided.
2. Attribute every fact to its source immediately after stating it: claims from the document get a page citation in the format [Page X]; claims from the conversation get the tag [From conversation].
3. If a claim cannot be attributed to either source, do not include it.
4. Be concise. Answer the specific question asked.
5. Do not provide legal advice. Do not say whether a clause is "standard", "unusual", "risky", or "favourable" — only report what the sources say.

DOCUMENT TEXT:
{contract_text}`

export function classifyQuery(message: string): QueryClass {
  const historySignals = /\b(what did you say|earlier|before|previously|last time|you mentioned|you told me|you said)\b/i
  const contractSignals = /\b(contract|document|agreement|clause|section|page|NDA|MSA|party|term)\b/i

  const isHistory = historySignals.test(message)
  const isContract = contractSignals.test(message) || !isHistory

  if (isHistory && isContract) return 'both'
  if (isHistory) return 'history'
  return 'contract'
}

function systemPromptFor(classification: QueryClass, contractText: string): string {
  if (classification === 'history') return CHAT_SYSTEM_PROMPT_HISTORY
  const template = classification === 'both' ? CHAT_SYSTEM_PROMPT_BOTH : CHAT_SYSTEM_PROMPT
  return template.replace('{contract_text}', contractText)
}

function turnLimitFor(classification: QueryClass): number {
  if (classification === 'history') return HISTORY_TURN_LIMIT
  if (classification === 'both') return BOTH_TURN_LIMIT
  return CONTRACT_TURN_LIMIT
}

export function buildMessages(
  classification: QueryClass,
  contractText: string,
  history: Pick<ChatMessage, 'role' | 'content'>[],
  userMessage: string
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const systemContent = systemPromptFor(classification, contractText)
  const historyMessages = history.slice(-turnLimitFor(classification))

  return [
    { role: 'system', content: systemContent },
    ...historyMessages.map((m) => ({ role: m.role, content: m.content }) as OpenAI.Chat.ChatCompletionMessageParam),
    { role: 'user', content: userMessage },
  ]
}

export function extractPageCitation(content: string): number | null {
  const match = content.match(/\[Page (\d+)\]/i)
  return match ? parseInt(match[1], 10) : null
}

// Strip the model's raw attribution tags from the text shown to the user — the UI
// renders the same information as a dedicated source badge (see MessageBubble),
// so leaving "[From conversation]" inline would read as a stray AI artifact.
// Not anchored to end-of-string: the model doesn't reliably place it as the very
// last characters (e.g. it sometimes appends its own trailing period after the
// tag), so this matches the tag wherever it appears plus any trailing punctuation.
export function stripConversationTag(content: string): string {
  return content.replace(/\s*\[From conversation\]\.?/gi, '').trimEnd()
}

export async function getChatResponse(
  classification: QueryClass,
  contractText: string,
  history: Pick<ChatMessage, 'role' | 'content'>[],
  userMessage: string
): Promise<{ content: string; pageCitation: number | null; contextSource: QueryClass }> {
  const messages = buildMessages(classification, contractText, history, userMessage)

  const response = await callWithRetry(() =>
    openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.4,
      max_tokens: 1000,
      messages,
    })
  )

  const rawContent = response.choices[0]?.message?.content ?? 'I cannot find this in the document.'
  const content = stripConversationTag(rawContent)

  return { content, pageCitation: extractPageCitation(content), contextSource: classification }
}
