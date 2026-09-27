// Owner: FE2
import Link from 'next/link'
import { ThemeToggle } from '@/components/public/ThemeToggle'
import { PlanetMark } from '@/components/brand/PlanetMark'
import { CLUB } from '@/lib/club'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-theme-shell flex min-h-screen w-full flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <PlanetMark className="h-10 w-10 shrink-0" />
          <span className="leading-none">
            <span className="block font-display text-lg uppercase text-primary-red text-poster-outline">Cintel</span>
            <span className="block font-tech text-[10px] font-bold uppercase tracking-[0.25em] text-foreground-soft">Events</span>
          </span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">{children}</main>

      <footer className="px-4 py-6 text-center font-tech text-[11px] uppercase tracking-widest text-foreground-soft">
        {CLUB.name} · {CLUB.department}
      </footer>
    </div>
  )
}
