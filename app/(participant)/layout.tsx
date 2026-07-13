import Link from 'next/link'
import { Blocks } from 'lucide-react'
import { ThemeToggle } from '@/components/public/ThemeToggle'

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="participant-theme-shell relative min-h-screen bg-[#020617]">

      {/* Full page solid background */}
      <div className="participant-solid-bg fixed inset-0 z-0 bg-[#020617]" />

      {/* Top gradient overlay */}
      <div className="participant-top-glow pointer-events-none fixed left-0 right-0 top-0 z-[1] h-[600px]" />

      {/* Bottom right glow */}
      <div className="participant-bottom-glow pointer-events-none fixed bottom-0 right-0 z-[1] h-[600px] w-[600px]" />

      {/* Grid overlay */}
      <div className="participant-grid-overlay pointer-events-none fixed inset-0 z-[1]" />

      {/* Header */}
      <header className="participant-header relative z-10 flex items-center justify-between border-b border-white/5 bg-slate-900/70 px-6 py-4 backdrop-blur-xl">
        <Link href="/participant/portal" className="flex items-center gap-2 no-underline">
          <Blocks size={16} color="#f59e0b" />
          <span className="participant-brand font-black tracking-tight text-white">Cintel</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/participant/portal" className="participant-nav-link text-sm text-slate-400 no-underline">
            My Events
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 min-h-[calc(100vh-57px)]">
        {children}
      </main>

    </div>
  )
}
