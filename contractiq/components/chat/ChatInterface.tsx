'use client'

import { useState } from 'react'
import { useChatSession } from '@/hooks/useChatSession'
import { extractApiErrorMessage } from '@/lib/utils/apiErrors'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import ErrorBanner from '@/components/shared/ErrorBanner'

type ChatInterfaceProps = {
  contractId: string
  onPageSelect: (page: number) => void
}

export default function ChatInterface({ contractId, onPageSelect }: ChatInterfaceProps) {
  const { messages, loading, refetch } = useChatSession(contractId)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend(message: string) {
    setError(null)
    setIsSending(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_id: contractId, message }),
      })
      if (!res.ok) {
        setError(await extractApiErrorMessage(res))
        return
      }
      await refetch()
    } catch {
      setError('Something went wrong. Check your connection and try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {error && (
        <div style={{ padding: '12px 16px 0' }}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}
      <MessageList messages={messages} isLoading={loading || isSending} onPageSelect={onPageSelect} />
      <ChatInput onSend={handleSend} disabled={isSending} />
    </div>
  )
}
