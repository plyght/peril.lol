import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Matcha - Earthy Minimal Ghostty Theme',
  description: 'An earthy, minimal Ghostty theme with soft pastel vibes 🍵',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/terminus-font@4.49.1/terminus-font.min.css" />
        <style>{`
          @font-face {
            font-family: 'Terminus';
            src: url('https://cdn.jsdelivr.net/npm/terminus-font@4.49.1/TerminusTTF-4.49.1.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
          
          body {
            font-family: 'Terminus', monospace;
          }

          ::selection {
            background-color: #4e5a4a;
            color: #ffffff;
          }
        `}</style>
      </head>
      <body className="bg-[#2e322d] text-[#e1ddcf]">{children}</body>
    </html>
  )
}

