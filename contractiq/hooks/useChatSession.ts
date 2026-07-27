import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage } from '@/lib/types/app.types'

export function useChatSession(contractId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  const load = useCallback(async () => {
    if (!contractId) return
    const supabase = createClient()
    setLoading(true)

    // No session exists until the first message is sent (created server-side in
    // app/api/chat/route.ts), so a brand-new contract legitimately has 0 rows here.
    const { data: session } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('contract_id', contractId)
      .maybeSingle()

    const sid = session?.id ?? null
    setSessionId(sid)

    if (sid) {
      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sid)
        .order('created_at', { ascending: true })
        .limit(200)
      setMessages(msgs ?? [])

      if (channelRef.current) supabase.removeChannel(channelRef.current)
      channelRef.current = supabase
        .channel(`chat:${sid}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${sid}` },
          (payload) => {
            const incoming = payload.new as ChatMessage
            // Our own send already appends via refetch(), so a Realtime echo of the
            // same row (or another tab's message) is deduped by id here.
            setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]))
          }
        )
        .subscribe()
    }

    setLoading(false)
  }, [contractId])

  useEffect(() => {
    load()
    const supabase = createClient()
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [load])

  return { messages, sessionId, loading, refetch: load }
}
