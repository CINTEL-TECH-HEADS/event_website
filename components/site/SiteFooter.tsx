import Link from 'next/link'
import { CLUB, SOCIALS } from '@/lib/club'
import { DevelopedBy } from '@/components/site/DevelopedBy'

const LINKS = [
  { href: '/events', label: 'All events' },
  { href: '/participant/portal', label: 'My events' },
  { href: '/contact', label: 'Contact' },
  { href: '/login', label: 'Organizer sign-in' },
]

export function SiteFooter() {
  return (
    <>
    <DevelopedBy />
    <footer id="contact" className="relative z-10 mt-16 bg-[#161412] text-cream">
      <div className="mx-auto max-w-[1240px] px-4 pb-7 pt-16 sm:px-6">
        <div className="flex flex-wrap items-center gap-[18px]">
          <img src="/brand/cintel-mark.png" alt="" className="block h-[clamp(56px,8vw,96px)] w-auto" />
          <p className="font-display text-[clamp(40px,8vw,104px)] leading-[0.9] text-primary-yellow">
            {CLUB.shortName}
            <span className="text-primary-red">.</span>
          </p>
        </div>

        <div className="mt-10 grid gap-8 border-t-2 border-[#3a3632] pt-8 sm:grid-cols-2 lg:grid-cols-3">
          <p className="text-[15px] leading-relaxed text-[#CFC7B8]">
            {CLUB.name}
            <br />
            {CLUB.department}, {CLUB.institution}, {CLUB.campus}.
          </p>

          <div className="flex flex-col gap-2.5 text-[15px]">
            <p className="font-tech text-[11px] font-bold uppercase tracking-[0.24em] text-primary-yellow">Site</p>
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-cream transition-colors hover:text-primary-yellow">
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 text-[15px]">
            <p className="font-tech text-[11px] font-bold uppercase tracking-[0.24em] text-primary-yellow">Reach us</p>
            <a href={`mailto:${CLUB.email}`} className="break-all text-cream transition-colors hover:text-primary-yellow">
              {CLUB.email}
            </a>
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cream transition-colors hover:text-primary-yellow"
              >
                {s.label} · {s.handle}
              </a>
            ))}
          </div>
        </div>

        <p className="mt-12 font-tech text-[11px] uppercase tracking-[0.2em] text-[#8F877A]">
          &copy; {new Date().getFullYear()} {CLUB.name}
        </p>
      </div>
    </footer>
    </>
  )
}
