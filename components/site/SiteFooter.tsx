import Link from 'next/link'
import { Mail } from 'lucide-react'
import { PlanetMark } from '@/components/brand/PlanetMark'
import { CLUB, SOCIALS } from '@/lib/club'

const LINKS = [
  { href: '/events', label: 'All events' },
  { href: '/participant/portal', label: 'My events' },
  { href: '/contact', label: 'Contact' },
  { href: '/login', label: 'Organizer sign-in' },
]

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-16 border-t-4 border-border bg-[#14120F] text-[#F5F0E3]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1.2fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <PlanetMark className="h-10 w-10 shrink-0" />
            <p className="font-display text-base uppercase leading-tight text-primary-yellow">{CLUB.name}</p>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-6 text-[#F5F0E3]/75">
            {CLUB.department}, {CLUB.institution}, {CLUB.campus}.
          </p>
        </div>

        <div>
          <p className="font-tech text-[11px] font-bold uppercase tracking-[0.25em] text-primary-yellow">Site</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[#F5F0E3]/80 transition-colors hover:text-primary-yellow">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-tech text-[11px] font-bold uppercase tracking-[0.25em] text-primary-yellow">Reach us</p>
          <a
            href={`mailto:${CLUB.email}`}
            className="mt-4 flex items-start gap-2 break-all text-sm text-[#F5F0E3]/80 transition-colors hover:text-primary-yellow"
          >
            <Mail className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.5} />
            {CLUB.email}
          </a>
          <ul className="mt-3 space-y-2.5 text-sm">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F5F0E3]/80 transition-colors hover:text-primary-yellow"
                >
                  {s.label} <span className="text-[#F5F0E3]/50">· {s.handle}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t-2 border-[#F5F0E3]/15">
        <p className="mx-auto max-w-6xl px-4 py-5 font-tech text-[11px] uppercase tracking-widest text-[#F5F0E3]/55 sm:px-6 lg:px-8">
          &copy; {new Date().getFullYear()} {CLUB.name}
        </p>
      </div>
    </footer>
  )
}
