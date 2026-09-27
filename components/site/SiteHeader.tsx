'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { AuthNav } from '@/components/public/AuthNav'
import { ThemeToggle } from '@/components/public/ThemeToggle'
import { PlanetMark } from '@/components/brand/PlanetMark'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/contact', label: 'Contact' },
]

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export function SiteHeader() {
  const pathname = usePathname() ?? '/'
  const [open, setOpen] = useState(false)

  // Close the mobile menu whenever the route changes.
  useEffect(() => setOpen(false), [pathname])

  return (
    <header className="sticky top-0 z-50 border-b-2 border-border bg-background/95 backdrop-blur lg:border-b-4">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <PlanetMark className="h-10 w-10 shrink-0 transition duration-300 group-hover:rotate-6" />
          <span className="leading-none">
            <span className="block font-display text-lg uppercase text-primary-red text-poster-outline">Cintel</span>
            <span className="block font-tech text-[10px] font-bold uppercase tracking-[0.25em] text-foreground-soft">Events</span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'rounded-full px-4 py-2 font-tech text-xs font-bold uppercase tracking-widest transition-colors duration-200',
                isActive(pathname, href)
                  ? 'bg-foreground text-background'
                  : 'text-foreground-soft hover:text-foreground'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <AuthNav />
          <ThemeToggle />
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
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'block rounded-xl px-3 py-3 font-tech text-sm font-bold uppercase tracking-widest',
                isActive(pathname, href) ? 'bg-panel-muted text-foreground' : 'text-foreground-soft'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
