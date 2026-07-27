'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'

type PDFViewerProps = {
  url: string
  targetPage: number
  onPageChange: (page: number) => void
  onLoadError: () => void
}

const MIN_ZOOM = 0.5
const MAX_ZOOM = 2

export default function PDFViewer({ url, targetPage, onPageChange, onLoadError }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const pdfRef = useRef<PDFDocumentProxy | null>(null)
  const renderedPages = useRef<Set<number>>(new Set())

  const [totalPages, setTotalPages] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)

  const renderPage = useCallback(async (pageNumber: number, scale: number) => {
    const pdf = pdfRef.current
    const canvas = pageRefs.current.get(pageNumber)?.querySelector('canvas')
    if (!pdf || !canvas) return

    const page = await pdf.getPage(pageNumber)
    const viewport = page.getViewport({ scale })
    canvas.width = viewport.width
    canvas.height = viewport.height

    const context = canvas.getContext('2d')
    if (!context) return

    await page.render({ canvasContext: context, viewport }).promise
  }, [])

  // Load the document.
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

        const pdf = await pdfjsLib.getDocument(url).promise
        if (cancelled) return

        pdfRef.current = pdf
        setTotalPages(pdf.numPages)
        setIsLoaded(true)
      } catch (error) {
        console.error({ error, context: 'pdf_load' })
        if (!cancelled) onLoadError()
      }
    }

    load()
    return () => {
      cancelled = true
      pdfRef.current?.destroy()
      renderedPages.current.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  // Lazily render pages as they scroll into view (± 1 page buffer).
  useEffect(() => {
    if (!isLoaded || !containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const pageNumber = Number((entry.target as HTMLElement).dataset.page)
          if (entry.isIntersecting) {
            if (entry.intersectionRatio > 0.5) {
              setCurrentPage(pageNumber)
              onPageChange(pageNumber)
            }
            const toRender = [pageNumber - 1, pageNumber, pageNumber + 1].filter((p) => p >= 1 && p <= totalPages)
            for (const p of toRender) {
              if (!renderedPages.current.has(p)) {
                renderedPages.current.add(p)
                renderPage(p, zoom)
              }
            }
          }
        }
      },
      { root: containerRef.current, threshold: [0, 0.5] }
    )

    for (const el of Array.from(pageRefs.current.values())) observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, totalPages, zoom])

  // Re-render already-rendered pages when zoom changes.
  useEffect(() => {
    if (!isLoaded) return
    for (const p of Array.from(renderedPages.current)) renderPage(p, zoom)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, isLoaded])

  // Scroll to targetPage + highlight.
  useEffect(() => {
    if (!isLoaded || !targetPage) return
    const el = pageRefs.current.get(targetPage)
    if (!el) return

    if (!renderedPages.current.has(targetPage)) {
      renderedPages.current.add(targetPage)
      renderPage(targetPage, zoom)
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    el.classList.remove('page-highlight')
    void el.offsetWidth
    el.classList.add('page-highlight')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPage, isLoaded])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      containerRef.current?.scrollBy({ top: e.key === 'ArrowDown' ? 120 : -120, behavior: 'smooth' })
    } else if (e.key === 'PageDown' || e.key === 'PageUp') {
      e.preventDefault()
      const next = e.key === 'PageDown' ? Math.min(currentPage + 1, totalPages) : Math.max(currentPage - 1, 1)
      pageRefs.current.get(next)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderBottom: '1px solid #F0F0F1',
        background: '#FFFFFF',
      }}>
        <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.1))} style={toolbarButtonStyle}>
          −
        </button>
        <span style={{ fontSize: '12px', color: '#4A4C4F', width: '40px', textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.1))} style={toolbarButtonStyle}>
          +
        </button>
        <button type="button" aria-label="Reset zoom" onClick={() => setZoom(1)} style={{ ...toolbarButtonStyle, width: 'auto', padding: '0 8px' }}>
          Reset
        </button>
        {isLoaded && (
          <span style={{ fontSize: '12px', color: '#8F9193', marginLeft: 'auto' }}>
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#F0F0F1' }}
      >
        {!isLoaded && (
          <div style={{ textAlign: 'center', color: '#8F9193', fontSize: '14px', paddingTop: '48px' }}>
            Loading PDF…
          </div>
        )}
        {isLoaded &&
          Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <div
              key={pageNumber}
              data-page={pageNumber}
              id={`pdf-page-${pageNumber}`}
              ref={(el) => {
                if (el) pageRefs.current.set(pageNumber, el)
                else pageRefs.current.delete(pageNumber)
              }}
              role="img"
              aria-label={`Page ${pageNumber} of ${totalPages}`}
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '16px',
                background: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                minHeight: '400px',
              }}
            >
              <canvas />
            </div>
          ))}
      </div>
    </div>
  )
}

const toolbarButtonStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #DADADB',
  borderRadius: '6px',
  background: '#FFFFFF',
  color: '#25272B',
  fontSize: '14px',
  cursor: 'pointer',
}
