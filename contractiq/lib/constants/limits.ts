// Shared between client-side validation (UploadDropzone) and server-side
// validation (app/api/upload/route.ts) so the two can't drift apart.
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
export const MAX_PAGE_COUNT = 20
export const MIN_WORD_COUNT = 100 // below this, treat as a scanned/image PDF
