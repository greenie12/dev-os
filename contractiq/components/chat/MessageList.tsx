'use client'

import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@/lib/types/app.types'
import MessageBubble from './MessageBubble'

type MessageListProps = {
  messages: ChatMessage[]
  isLoading: boolean
  onPageSelect: (page: number) => void
}

export default function MessageList({ messages, isLoading, onPageSelect }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div
      role="log"
      aria-label="Chat conversation"
      aria-live="polite"
      style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}
    >
      {messages.length === 0 && !isLoading && (
        <p style={{ fontSize: '13px', color: '#8F9193', textAlign: 'center', marginTop: '24px' }}>
          Ask a question about this contract to get started.
        </p>
      )}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} onPageSelect={onPageSelect} />
      ))}
      {isLoading && (
        <div style={{
          display: 'inline-flex',
          alignSelf: 'flex-start',
          padding: '12px 16px',
          background: '#FFFFFF',
          border: '1px solid #DADADB',
          borderRadius: '12px 12px 12px 2px',
        }}>
          <span className="chat-loading-dots" aria-label="Assistant is typing">· · ·</span>
        </div>
      )}
      <div ref={endRef} />
    </div>
  )
}
