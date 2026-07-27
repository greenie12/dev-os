import type { ChatMessage, ChatContextSource } from '@/lib/types/app.types'

type MessageBubbleProps = {
  message: ChatMessage
  onPageSelect: (page: number) => void
}

const SOURCE_BADGE: Record<ChatContextSource, string> = {
  contract: '📄 Contract',
  history: '💬 Conversation',
  both: '📄💬 Contract + conversation',
}

const PAGE_CITATION_RE = /\[Page (\d+)\]/gi

function renderContentWithCitations(content: string, onPageSelect: (page: number) => void) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  PAGE_CITATION_RE.lastIndex = 0
  while ((match = PAGE_CITATION_RE.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }
    const page = parseInt(match[1], 10)
    parts.push(
      <button
        key={match.index}
        type="button"
        aria-label={`Go to page ${page}`}
        onClick={() => onPageSelect(page)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#115ACB',
          fontWeight: 500,
          cursor: 'pointer',
          padding: 0,
          font: 'inherit',
        }}
      >
        {match[0]}
      </button>
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < content.length) parts.push(content.slice(lastIndex))

  return parts
}

export default function MessageBubble({ message, onPageSelect }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const time = new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      <div
        aria-label={`${message.role} message`}
        style={{
          maxWidth: '85%',
          padding: '10px 14px',
          fontSize: '14px',
          lineHeight: '21px',
          background: isUser ? '#115ACB' : '#FFFFFF',
          color: isUser ? '#FFFFFF' : '#25272B',
          border: isUser ? 'none' : '1px solid #DADADB',
          borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
        }}
      >
        {isUser ? message.content : renderContentWithCitations(message.content, onPageSelect)}

        {!isUser && message.context_source && (
          <div style={{
            display: 'inline-flex',
            marginTop: '8px',
            fontSize: '11px',
            fontWeight: 500,
            color: '#4A4C4F',
            background: '#F0F0F1',
            borderRadius: '4px',
            padding: '2px 6px',
          }}>
            {SOURCE_BADGE[message.context_source]}
          </div>
        )}

        {/* Page citation only applies when the document was actually consulted —
            skip it for pure 'history' answers, which never cite a page. */}
        {!isUser && message.context_source !== 'history' && (
          <div style={{ marginTop: '4px', fontSize: '12px', color: '#8F9193' }}>
            {message.page_citation ? (
              <button
                type="button"
                onClick={() => onPageSelect(message.page_citation!)}
                style={{ background: 'transparent', border: 'none', color: '#8F9193', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline' }}
              >
                Source: Page {message.page_citation} ↗
              </button>
            ) : (
              <span style={{ color: '#8F9193' }}>Source: not cited</span>
            )}
          </div>
        )}
      </div>
      <span style={{ fontSize: '11px', color: '#8F9193', marginTop: '2px' }}>{time}</span>
    </div>
  )
}
