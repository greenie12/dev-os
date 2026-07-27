import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ContractIQ — AI Contract Review',
  description:
    'Review any NDA or MSA in minutes. AI-powered key term extraction with confidence scoring, page attribution, and plain-English Q&A.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-grey-25 text-grey-900 font-inter antialiased">{children}</body>
    </html>
  )
}
