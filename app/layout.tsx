import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cintel — Events',
  description: 'Premium student events and registration platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.className} bg-[#020617] text-slate-200 antialiased selection:bg-amber-500/30 selection:text-amber-200`}>
        {children}
      </body>
    </html>
  )
}
