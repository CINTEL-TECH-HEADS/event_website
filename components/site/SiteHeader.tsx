'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { AuthNav } from '@/components/public/AuthNav'
import { ThemeToggle } from '@/components/public/ThemeToggle'
import { countdownParts, useNow, usePublicEvents } from '@/lib/use-public-events'
import { cn } from '@/lib/utils'

export type NavItem = { href: string; label: string }

const DEFAULT_NAV: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
]

function isActive(pathname: string, href: string) {
  if (href.includes('#')) return false
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export function LiveDot() {
  return (
    <span className="relative h-2 w-2 flex-none" aria-hidden>
      <span className="landing-ping absolute inset-0 rounded-full bg-primary-red" />
      <span className="absolute inset-0 rounded-full bg-primary-red" />
    </span>
  )
}

// Dark strip above the header: the next open event and a live countdown.
function NextUpStrip() {
  const { nextUp } = usePublicEvents()
  const now = useNow()
  if (!nextUp) return null

  const [d, h, m, s] = countdownParts(nextUp.starts_at, now)
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <Link href={`/events/${nextUp.slug}`} className="block bg-[#161412] text-cream transition-colors hover:bg-[#221F1C]">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-[7px] font-tech text-xs font-bold tracking-[0.12em] sm:px-6">
        <LiveDot />
        <span className="text-primary-yellow">NEXT UP</span>
        <span className="truncate uppercase">{nextUp.title}</span>
        <span className="whitespace-nowrap rounded-full bg-primary-yellow px-2.5 py-[3px] text-[#161412]">
          {d}D {pad(h)}H {pad(m)}M {pad(s)}S
        </span>
        <span className="hidden whitespace-nowrap text-primary-yellow sm:inline">SEE EVENT →</span>
      </div>
    </Link>
  )
}

export function SiteHeader({ nav = DEFAULT_NAV }: { nav?: NavItem[] }) {
  const pathname = usePathname() ?? '/'
  const [open, setOpen] = useState(false)

  // Close the mobile menu whenever the route changes.
  useEffect(() => setOpen(false), [pathname])

  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-border bg-background">
      <NextUpStrip />
      <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-4 py-2.5 sm:px-6 lg:gap-7">
        <Link href="/" className="flex shrink-0 items-center" aria-label="CINTEL Events home">
          <img src="/brand/cintel-events-logo.png" alt="CINTEL Events" className="block h-12 w-auto sm:h-[68px]" />
        </Link>

        <nav className="hidden items-center gap-1.5 md:flex" aria-label="Main">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'rounded-full px-3.5 py-2 font-tech text-xs font-bold uppercase tracking-[0.14em] transition-colors duration-200',
                isActive(pathname, href) ? 'bg-foreground text-background' : 'text-foreground hover:bg-panel-muted'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          {/* On the narrowest phones the toggle moves into the menu so the bar fits. */}
          <div className="hidden sm:block">
            <ThemeToggle className="duration-300 hover:rotate-180" />
          </div>
          <AuthNav />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-panel text-foreground md:hidden"
          >
            {open ? <X className="h-4 w-4" strokeWidth={2.5} /> : <Menu className="h-4 w-4" strokeWidth={2.5} />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-t-2 border-border bg-panel px-4 py-3 md:hidden">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'block rounded-xl px-3 py-3 font-tech text-sm font-bold uppercase tracking-widest',
                isActive(pathname, href) ? 'bg-panel-muted text-foreground' : 'text-foreground-soft'
              )}
            >
              {label}
            </Link>
          ))}
          <div className="mt-2 flex items-center justify-between border-t-2 border-border px-3 pt-3 sm:hidden">
            <span className="font-tech text-sm font-bold uppercase tracking-widest text-foreground-soft">Theme</span>
            <ThemeToggle />
          </div>
        </nav>
      )}
    </header>
  )
}
