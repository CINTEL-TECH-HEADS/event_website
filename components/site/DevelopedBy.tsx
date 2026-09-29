'use client'

// "Developed by" — the tech team behind the site, shown just above the footer.
// Heads in the first row, members in the row below (slightly smaller cards).
// Each person is a React Bits TiltedCard: portrait photo with name, role and
// LinkedIn floating on it (the overlay sits at translateZ(30px), so it moves
// in 3D as the card tilts).

import { Linkedin } from 'lucide-react'
import TiltedCard from '@/components/reactbits/TiltedCard'
import { TECH_TEAM, type TechTeamMember } from '@/lib/club'

const ROLE_LABEL: Record<TechTeamMember['role'], string> = {
  head: 'CINTEL Tech Head',
  member: 'CINTEL Tech Member',
}

const SIZE = {
  head: { w: 280, h: 360, name: 'text-[26px]' },
  member: { w: 240, h: 310, name: 'text-[22px]' },
} as const

function MemberCard({ m, index }: { m: TechTeamMember; index: number }) {
  const s = SIZE[m.role]
  const w = `${s.w}px`
  const h = `${s.h}px`

  return (
    <li className="group">
      <TiltedCard
        imageSrc={m.photo}
        altText={m.name}
        containerHeight={h}
        containerWidth={w}
        imageHeight={h}
        imageWidth={w}
        rotateAmplitude={12}
        scaleOnHover={1.06}
        showMobileWarning={false}
        showTooltip={false}
        displayOverlayContent
        overlayContent={
          <div
            className="relative overflow-hidden rounded-[15px] ring-1 ring-white/15 transition-[box-shadow] duration-300 group-hover:shadow-[0_24px_60px_-12px_rgba(242,194,48,0.45)] group-hover:ring-2 group-hover:ring-primary-yellow/80"
            style={{ width: w, height: h }}
          >
            {/* Readability gradient behind the text */}
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

            <span className="absolute left-4 top-4 rounded-full bg-black/35 px-2.5 py-1 font-tech text-[10px] font-bold tracking-[0.2em] text-white/85 backdrop-blur-sm">
              {String(index + 1).padStart(2, '0')}
            </span>

            {m.linkedin && (
              <a
                href={m.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${m.name} on LinkedIn`}
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/35 text-white ring-1 ring-white/30 backdrop-blur-md transition-colors hover:bg-primary-yellow hover:text-[#161412] hover:ring-primary-yellow"
              >
                <Linkedin size={16} />
              </a>
            )}

            <div className="absolute inset-x-0 bottom-0 p-5 text-left">
              <p className={`break-words font-display ${s.name} uppercase leading-[0.95] text-white`}>{m.name}</p>
              <p className="mt-2 font-tech text-[10px] font-bold uppercase tracking-[0.24em] text-primary-yellow">
                {ROLE_LABEL[m.role]}
              </p>
            </div>
          </div>
        }
      />
    </li>
  )
}

export function DevelopedBy() {
  const heads = TECH_TEAM.filter((m) => m.role === 'head')
  const members = TECH_TEAM.filter((m) => m.role === 'member')

  return (
    <section aria-labelledby="developed-by-heading" className="relative z-10 mx-auto mt-24 max-w-[1240px] px-4 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <p className="flex items-center gap-3 font-tech text-[11px] font-bold uppercase tracking-[0.24em] text-primary-red">
          <span aria-hidden className="h-[2px] w-8 bg-primary-red" />
          CINTEL Tech Team
          <span aria-hidden className="h-[2px] w-8 bg-primary-red" />
        </p>
        <h2
          id="developed-by-heading"
          className="mt-3 font-display text-[clamp(36px,6vw,72px)] uppercase leading-[0.9] text-foreground"
        >
          Developed by
        </h2>
      </div>

      <ul className="mt-12 flex flex-wrap justify-center gap-10">
        {heads.map((m, i) => (
          <MemberCard key={m.name} m={m} index={i} />
        ))}
      </ul>

      {members.length > 0 && (
        <ul className="mt-10 flex flex-wrap justify-center gap-8">
          {members.map((m, i) => (
            <MemberCard key={m.name} m={m} index={heads.length + i} />
          ))}
        </ul>
      )}
    </section>
  )
}
