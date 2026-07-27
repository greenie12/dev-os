'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

type SidebarProps = {
  user: { email: string }
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: '◫' },
  { href: '/upload', label: 'Review Contract', icon: '↑' },
]

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <aside style={{
      width: '220px',
      flexShrink: 0,
      background: '#FFFFFF',
      borderRight: '1px solid #F0F0F1',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 16px 20px', borderBottom: '1px solid #F0F0F1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            background: '#115ACB',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}>C</span>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#070A0E' }}>ContractIQ</span>
        </div>
      </div>

      {/* Nav links */}
      <nav aria-label="Main navigation" style={{ padding: '16px 8px', flex: 1 }}>
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                color: isActive ? '#115ACB' : '#4A4C4F',
                background: isActive ? '#E7EFFC' : 'transparent',
                borderLeft: isActive ? '2px solid #115ACB' : '2px solid transparent',
                textDecoration: 'none',
                marginBottom: '2px',
              }}
            >
              <span style={{ fontSize: '16px' }}>{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div style={{ padding: '16px', borderTop: '1px solid #F0F0F1' }}>
        <div style={{
          fontSize: '12px',
          color: '#8F9193',
          marginBottom: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {user.email}
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '13px',
            color: '#4A4C4F',
            background: 'transparent',
            border: '1px solid #DADADB',
            borderRadius: '6px',
            cursor: signingOut ? 'not-allowed' : 'pointer',
            textAlign: 'left',
            opacity: signingOut ? 0.6 : 1,
          }}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
