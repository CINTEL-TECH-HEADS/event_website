import Link from 'next/link'
import { Calendar, RefreshCcw, Award, Mail, LogIn } from 'lucide-react'
import { ThemeToggle } from '@/components/public/ThemeToggle'
import { AuthNav } from '@/components/public/AuthNav'
import { PlanetMark } from '@/components/brand/PlanetMark'
import { Sparkle } from '@/components/brand/Starburst'

const NAV_LINKS = [
  { href: '/events', label: 'Events', icon: Calendar, tone: 'bg-[#14120F] text-[#F5F0E3]' },
  { href: '/resend', label: 'Resend', icon: RefreshCcw, tone: 'bg-primary-yellow text-[#14120F]', hideOnSmall: true },
  { href: '/certificate', label: 'Certificate', icon: Award, tone: 'bg-primary-red text-white', hideOnSmall: true },
  { href: '/contact', label: 'Contact', icon: Mail, tone: 'bg-[#14120F] text-[#F5F0E3]' },
]

export default function PublicLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
     <div className="public-theme-shell relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b-2 border-border bg-background lg:border-b-4">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6 lg:h-24 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <PlanetMark className="h-11 w-11 shrink-0 transition duration-300 group-hover:rotate-6 sm:h-12 sm:w-12" />
            <div className="leading-none">
              <p className="relative inline-flex items-center font-display text-xl uppercase text-primary-red text-poster-outline sm:text-2xl">
                Cintel
                <Sparkle className="ml-1 h-3 w-3 text-primary-yellow sm:h-4 sm:w-4" />
              </p>
              <p className="mt-1 font-tech text-[9px] uppercase tracking-[0.3em] text-foreground-soft sm:text-[10px]">
                Student Association
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-1.5 sm:gap-2">
            {NAV_LINKS.map(({ href, label, icon: Icon, tone, hideOnSmall }) => (
              <Link
                key={href}
                href={href}
                className={`${hideOnSmall ? 'hidden sm:inline-flex' : 'inline-flex'} items-center gap-1.5 rounded-full border-2 border-border px-2.5 py-1.5 font-tech text-[10px] font-bold uppercase tracking-wider shadow-sm transition duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:px-4 sm:py-2 sm:text-xs ${tone}`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span className="hidden md:inline">{label}</span>
              </Link>
            ))}
            <AuthNav />
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="relative z-10 flex-1">{children}</main>

      <footer className="poster-panel relative z-10 mx-3 mb-3 overflow-hidden rounded-poster sm:mx-6 sm:mb-6 lg:mx-8">
        <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div className="flex items-center gap-3">
            <PlanetMark className="h-8 w-8 shrink-0" />
            <div className="leading-none">
              <p className="font-display text-sm uppercase text-primary-yellow">Cintel Student Association</p>
              <p className="mt-1.5 font-tech text-[10px] uppercase tracking-[0.3em] text-[#F5F0E3]/60">
                &copy; {new Date().getFullYear()} &mdash; All orbits reserved
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-tech text-[10px] uppercase tracking-[0.3em] text-[#F5F0E3]/80">
            <span>People</span>
            <Sparkle className="h-2.5 w-2.5 text-primary-yellow" />
            <span>Ideas</span>
            <Sparkle className="h-2.5 w-2.5 text-primary-red" />
            <span>Impact</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
