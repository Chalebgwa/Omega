import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Omega - Last Will & Testament',
  description: 'Personal messages for those you care about',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
