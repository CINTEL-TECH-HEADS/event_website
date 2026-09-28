'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TearTicket from '@/components/reactbits/TearTicket'
import ScrambledText from '@/components/reactbits/ScrambledText'
import { EVENT_TYPE_LABELS, REGISTRATION_MODE_LABELS } from '@/lib/club'
import type { PublicEvent } from '@/lib/public-events'
import { cn } from '@/lib/utils'

const W = 460
const H = 230
const STUB = 140

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function daysTo(iso: string, now: number) {
  const d = Math.ceil((new Date(iso).getTime() - now) / 864e5)
  return d <= 0 ? 'TODAY' : d === 1 ? 'TOMORROW' : `IN ${d} DAYS`
}

// An event as a tear-off ticket. Open events: tear the stub (drag it, or
// focus it and press Enter) to go to registration. Past events render
// already torn, stamped as ended.
export function EventTicket({ event, now, past = false, index = 0 }: {
  event: PublicEvent
  now: number
  past?: boolean
  index?: number
}) {
  const router = useRouter()
  const href = `/events/${event.slug}`
  const kind = EVENT_TYPE_LABELS[event.event_type] ?? event.event_type
  const mode = REGISTRATION_MODE_LABELS[event.registration_mode] ?? event.registration_mode

  return (
    <TearTicket
      className="event-ticket"
      image={event.banner_url ?? undefined}
      imageAlt=""
      scrim
      imageRadius={12}
      defaultTorn={past}
      onTear={() => router.push(href)}
      ariaLabel={`Tear off the stub to register for ${event.title}`}
      width={W}
      height={H}
      stubSize={STUB}
      radius={20}
      holes={11}
      holeSize={7}
      notch={6}
      roughness={1.2}
      tearAngle={30}
      stretch={30}
      resistance={0.45}
      rotate={index % 2 ? 2 : -2}
      tilt
      tiltMax={9}
      tiltReach={260}
      parallax={6}
      perspective={1000}
      background="#161412"
      stubBackground="#F2C230"
      color="#F5F0E3"
      border
      borderColor="#161412"
      borderWidth={3}
      recenter
      stub={
        <div className="flex h-full flex-col justify-between p-4 pl-5 text-[#161412]">
          <p className="font-tech text-[10px] font-bold tracking-[0.2em]">ADMIT ONE</p>
          <div>
            <p className="font-display text-[34px] leading-none">{fmtDay(event.starts_at).split(' ')[0]}</p>
            <p className="font-display text-lg uppercase leading-none">{fmtDay(event.starts_at).split(' ')[1]}</p>
          </div>
          <p className="font-tech text-[10px] font-bold leading-snug tracking-[0.14em]">
            TEAR TO
            <br />
            REGISTER →
          </p>
        </div>
      }
    >
      <div className={cn('flex h-full flex-col gap-2.5 p-[22px]', event.banner_url && 'justify-end')}>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-cream px-2.5 py-[5px] font-tech text-[10px] font-bold uppercase tracking-[0.16em] text-[#161412]">
            {kind}
          </span>
          <span
            className={cn(
              'whitespace-nowrap rounded-full px-2.5 py-[5px] font-tech text-[10px] font-bold tracking-[0.14em]',
              past ? 'bg-[#3a3632] text-cream' : 'bg-primary-red text-white'
            )}
          >
            {past ? 'ENDED' : daysTo(event.starts_at, now)}
          </span>
          {event.open_to_external && (
            <span className="whitespace-nowrap rounded-full bg-primary-yellow px-2.5 py-[5px] font-tech text-[10px] font-bold tracking-[0.14em] text-[#161412]">
              OPEN TO ALL COLLEGES
            </span>
          )}
        </div>
        <Link href={href} className="font-display text-[26px] uppercase leading-none text-primary-yellow hover:text-cream">
          {event.title}
        </Link>
        {event.description && !event.banner_url && (
          <ScrambledText
            className="text-sm leading-normal text-[#CFC7B8] [&_p]:line-clamp-2"
            radius={70}
            duration={1.2}
            speed={0.5}
            scrambleChars=".:"
          >
            {event.description}
          </ScrambledText>
        )}
        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 font-tech text-[11px] text-cream">
          {event.venue && <span className="whitespace-nowrap">◉ {event.venue}</span>}
          <span className="whitespace-nowrap">◆ {mode}</span>
        </div>
      </div>
      {past && (
        <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 rotate-[-14deg] rounded-lg border-[3px] border-primary-red px-2.5 py-1 font-display text-xl text-primary-red opacity-90">
          USED
        </span>
      )}
    </TearTicket>
  )
}
