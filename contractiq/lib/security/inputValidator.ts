import { MAX_FILE_SIZE_BYTES } from '@/lib/security/tokenLimiter'

// Re-exports every request-body schema from lib/utils/validation.ts so every
// app/api/* route can import its Zod schema from one place (this file), per
// security-foundation/SKILL.md's structure — the schemas themselves stay defined
// alongside the auth-form schemas that already lived there, rather than moved and
// re-authored here, to avoid two competing sources of truth for the same rules.
export {
  signInSchema,
  signUpSchema,
  processRequestSchema,
  chatRequestSchema,
  uploadContractTypeSchema,
  termEditSchema,
  feedbackRequestSchema,
} from '@/lib/utils/validation'

// This app only ever supports PDF (spec-upload-flow.md — text-layer PDFs only;
// pdf-parse-based extraction has no path for any other format). The blocklist
// below is defense-in-depth against a spoofed Content-Type: even though only
// "application/pdf" is allow-listed, checking the extension separately means a
// client can't rely on the MIME type alone (which it fully controls) to get past
// validation.
const BLOCKED_EXTENSIONS = ['.exe', '.js', '.mjs', '.cjs', '.php', '.zip', '.sh', '.bat', '.cmd', '.py', '.rb', '.ps1']
const ALLOWED_EXTENSIONS = ['.pdf']
const ALLOWED_MIME_TYPES = ['application/pdf']

export type FileValidationResult = { valid: true } | { valid: false; error: string }

export function validateFileUpload(file: { name: string; type: string; size: number }): FileValidationResult {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()

  // 1. Extension
  if (BLOCKED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: 'This file type is not allowed.' }
  }
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: 'Only PDF files are accepted.' }
  }

  // 2. MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only PDF files are accepted.' }
  }

  // 3. Size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: 'File exceeds 10 MB limit.' }
  }

  return { valid: true }
}
