export type ContractType = 'nda' | 'msa'
export type ContractStatus = 'pending' | 'processing' | 'complete' | 'error'
export type ChatRole = 'user' | 'assistant'
export type FeedbackRating = 'up' | 'down'
export type ChatContextSource = 'contract' | 'history' | 'both'

export type Contract = {
  id: string
  user_id: string
  file_name: string
  file_size_bytes: number | null
  contract_type: ContractType
  contract_text: string
  file_path: string | null
  status: ContractStatus
  page_count: number
  token_count: number
  created_at: string
  updated_at: string
  last_accessed_at: string
}

export type KeyTerm = {
  id: string
  contract_id: string
  user_id: string
  term_name: string
  value: string
  original_ai_value: string
  page_number: number
  confidence_score: number
  source_sentence: string
  is_manual: boolean
  is_edited: boolean
  created_at: string
}

export type ChatSession = {
  id: string
  contract_id: string
  user_id: string
  created_at: string
}

export type ChatMessage = {
  id: string
  session_id: string
  role: ChatRole
  content: string
  page_citation: number | null
  context_source: ChatContextSource | null
  created_at: string
}

export type UserFeedback = {
  id: string
  user_id: string
  contract_id: string
  rating: FeedbackRating
  comment: string | null
  created_at: string
}

export type ExtractionResult = {
  term_name: string
  value: string
  page_number: number
  confidence_score: number
  source_sentence: string
}
