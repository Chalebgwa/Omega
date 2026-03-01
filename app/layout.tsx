import './globals.css'
import type { Metadata } from 'next'
import { Fraunces, Manrope } from 'next/font/google'

const omegaSans = Manrope({
  subsets: ['latin'],
  variable: '--font-sans-omega',
})

const omegaSerif = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif-omega',
})

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
    <html lang="en" className={`${omegaSans.variable} ${omegaSerif.variable}`}>
      <body>{children}</body>
    </html>
  )
}
