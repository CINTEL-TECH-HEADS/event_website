import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from '@/components/public/ThemeToggle'
import { SessionGuard } from '@/components/auth/SessionGuard'

// Never statically cache authenticated participant content
export const dynamic = 'force-dynamic'

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="participant-theme-shell relative flex min-h-screen flex-col overflow-hidden bg-[#07101d] text-slate-100">

      <SessionGuard />

      {/* Full page solid background */}
      <div className="participant-solid-bg fixed inset-0 z-0 bg-[#07101d]" />

      {/* Grid overlay — matches homescreen */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px,24px_24px]" />

      {/* Amber top glow — matches homescreen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),transparent)]" />

      {/* Header — mirrors the public shell */}
      <header className="participant-header sticky top-0 z-50 border-b border-white/10 bg-[#07101d]/94 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/participant/portal" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center border border-amber-300/40 bg-amber-300 text-sm font-bold text-slate-950">
              <Image
                src="/Logo.png"
                alt="Cintel Logo"
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            </span>
            <div>
              <p className="participant-brand text-sm font-semibold tracking-[0.18em] text-white">CINTEL EVENTS</p>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">PARTICIPANT PORTAL</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="participant-nav-link border border-transparent px-4 py-2 font-medium text-slate-300 transition hover:border-amber-300/25 hover:bg-white/5 hover:text-white "
            >
              Home
            </Link>
            <Link
              href="/participant/portal"
              className="participant-nav-link border border-transparent px-4 py-2 font-medium text-slate-300 transition hover:border-amber-300/25 hover:bg-white/5 hover:text-white "
            >
              My Events
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1">
        {children}
      </main>

    </div>
  )
}
