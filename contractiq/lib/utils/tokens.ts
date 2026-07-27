// Approximate token counter — ~4 characters per token, per engineering-doc.md §6/§8.
// Good enough to enforce the 15,000-token contract-length cap without a real tokenizer.
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4)
}

export const MAX_CONTRACT_TOKENS = 15000
