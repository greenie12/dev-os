import OpenAI from 'openai'

// Preview api-version for the Agents "responses" endpoint. Azure rotates preview
// versions periodically — if a call starts failing with "API version not
// supported", look up the current value in the Azure AI Foundry REST API
// reference and update this constant (see skills/azure-ai-foundry/SKILL.md).
const AZURE_API_VERSION = '2025-05-15-preview'

// AZURE_AGENT_ENDPOINT (copied from the agent's own page in AI Foundry, not the
// project overview) already ends in /responses. The OpenAI SDK appends /responses
// itself when responses.create() is called, so that suffix is stripped here —
// otherwise every request doubles the path and Azure returns 405.
function resolveBaseUrl(): string {
  const endpoint = process.env.AZURE_AGENT_ENDPOINT ?? ''
  return endpoint.endsWith('/responses') ? endpoint.slice(0, -'/responses'.length) : endpoint
}

// Azure requires the key in both the standard Authorization header (set via
// apiKey) and a custom api-key header — one or the other alone yields 401.
export const azure = new OpenAI({
  apiKey: process.env.AZURE_API_KEY,
  baseURL: resolveBaseUrl(),
  defaultQuery: { 'api-version': AZURE_API_VERSION },
  defaultHeaders: { 'api-key': process.env.AZURE_API_KEY ?? '' },
})

// The Responses API shape varies by SDK version — prefer the output_text
// convenience field, fall back to walking the output array's message content.
export function extractResponseText(response: unknown): string {
  const r = response as { output_text?: string; output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> }
  if (typeof r?.output_text === 'string' && r.output_text.length > 0) {
    return r.output_text
  }
  for (const item of r?.output ?? []) {
    if (item?.type === 'message' && Array.isArray(item.content)) {
      const textPart = item.content.find((c) => c?.type === 'output_text' || c?.type === 'text')
      if (typeof textPart?.text === 'string') return textPart.text
    }
  }
  return ''
}
