'use client'

import { useEffect, useMemo, useRef } from 'react'

type TextViewerProps = {
  contractText: string
  targetPage: number
  onPageChange: (page: number) => void
}

type Page = { number: number; text: string }

export default function TextViewer({ contractText, targetPage }: TextViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const pages = useMemo<Page[]>(() => {
    const parts = contractText.split(/\[PAGE (\d+)\]/g)
    // parts alternates: [preamble, "1", text1, "2", text2, ...]
    const result: Page[] = []
    for (let i = 1; i < parts.length; i += 2) {
      result.push({ number: Number(parts[i]), text: parts[i + 1]?.trim() ?? '' })
    }
    return result
  }, [contractText])

  useEffect(() => {
    if (!targetPage || !containerRef.current) return
    const el = containerRef.current.querySelector<HTMLElement>(`#page-${targetPage}`)
    if (!el) return

    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    el.classList.remove('page-highlight')
    // Force reflow so re-triggering the animation on repeated clicks of the same page works.
    void el.offsetWidth
    el.classList.add('page-highlight')
  }, [targetPage])

  return (
    <div ref={containerRef} style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      {pages.map((page) => (
        <section key={page.number} id={`page-${page.number}`} style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '12px', color: '#8F9193', marginBottom: '8px', fontWeight: 500 }}>
            [Page {page.number}]
          </div>
          <p style={{ fontSize: '14px', color: '#25272B', lineHeight: '22px', whiteSpace: 'pre-wrap', margin: 0 }}>
            {page.text}
          </p>
        </section>
      ))}
    </div>
  )
}
