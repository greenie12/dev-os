import Sidebar from '@/components/shared/Sidebar'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // middleware.ts already redirects unauthenticated requests away from every
  // route under this layout, so `user` is guaranteed here.
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FAFAFA' }}>
      <Sidebar user={{ email: user!.email! }} />
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
