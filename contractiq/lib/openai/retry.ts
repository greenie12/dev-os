// Shared transient-failure retry for OpenAI calls (network errors, 5xx, rate limits).
// Used by both extraction and chat — see lib/openai/extract.ts and lib/openai/chat.ts.
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function callWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === retries - 1) break
      const status = (error as { status?: number } | undefined)?.status
      await sleep(status === 429 ? 5000 : 1000 * Math.pow(2, attempt))
    }
  }
  throw lastError
}
