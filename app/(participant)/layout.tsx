import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from '@/components/public/ThemeToggle'
import { SessionGuard } from '@/components/auth/SessionGuard'
import { Sparkle } from '@/components/brand/Starburst'

// Never statically cache authenticated participant content
export const dynamic = 'force-dynamic'

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="participant-theme-shell relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">

      <SessionGuard />

      {/* Masthead band — poster ink-black bar */}
      <header className="participant-header sticky top-0 z-50 border-b-2 border-border bg-[#14120F] text-[#F5F0E3] sm:border-b-4">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/participant/portal" className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#F5F0E3] bg-primary-yellow text-sm font-black text-[#14120F]">
              <Image
                src="/Logo.png"
                alt="Cintel Logo"
                width={40}
                height={40}
                className="h-full w-full rounded-full object-cover"
              />
            </span>
            <div className="leading-none">
              <p className="participant-brand inline-flex items-center gap-1 font-display text-sm uppercase tracking-[0.1em] text-primary-yellow">
                Cintel Events
                <Sparkle className="h-2.5 w-2.5 text-primary-yellow" />
              </p>
              <p className="mt-1 font-tech text-[9px] font-bold uppercase tracking-[0.3em] text-[#F5F0E3]/60">Participant Portal</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1.5 text-sm sm:gap-2">
            <Link
              href="/"
              className="participant-nav-link rounded-full border-2 border-transparent px-3 py-2 font-tech text-[10px] font-bold uppercase tracking-wider text-[#F5F0E3]/80 transition duration-200 hover:border-[#F5F0E3]/40 hover:text-[#F5F0E3] sm:px-4 sm:text-xs"
            >
              Home
            </Link>
            <Link
              href="/participant/portal"
              className="participant-nav-link rounded-full border-2 border-transparent px-3 py-2 font-tech text-[10px] font-bold uppercase tracking-wider text-[#F5F0E3]/80 transition duration-200 hover:border-[#F5F0E3]/40 hover:text-[#F5F0E3] sm:px-4 sm:text-xs"
            >
              My Events
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 bg-background">
        {children}
      </main>

    </div>
  )
}
