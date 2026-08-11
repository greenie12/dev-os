// Hard pattern-based filter applied before ANY user-supplied or document-derived
// text reaches the Azure agent. This is defense-in-depth on top of the system
// prompts' own "answer only from X" instructions (lib/azure/extract.ts,
// lib/azure/chat.ts) — a system prompt is a strong suggestion the model usually
// follows, not a hard boundary; this filter is the hard boundary.
//
// Applied to:
//   - contract_text, once, at upload time (app/api/upload/route.ts) — a malicious
//     PDF could embed "ignore previous instructions" style text that later gets
//     fed into every extraction and chat call for that contract.
//   - the user's chat message, on every turn (app/api/chat/route.ts).

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /override\s+your\s+rules/i,
  /reveal\s+(your\s+)?system\s+prompt/i,
  /print\s+your\s+instructions/i,
  /expose\s+env(ironment)?\s+variables?/i,
  /show\s+(me\s+)?(the\s+)?api\s+keys?/i,
  /you\s+are\s+now\s+a\b/i,
  /^\s*act\s+as\s+/i,
  /pretend\s+you\s+are/i,
  /\bjailbreak\b/i,
  /\bDAN\s+mode\b/i,
  /developer\s+mode/i,
]

export type InjectionCheckResult = { safe: true } | { safe: false; matchedPattern: string }

export function sanitizeForLLM(text: string): InjectionCheckResult {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return { safe: false, matchedPattern: pattern.source }
    }
  }
  return { safe: true }
}
