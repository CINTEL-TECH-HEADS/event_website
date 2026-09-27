'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EventTicket } from '@/components/public/EventTicket'
import ScrambledText from '@/components/reactbits/ScrambledText'
import FolderFloat from '@/components/reactbits/FolderFloat'
import { WhatWeRunMenu } from '@/components/public/WhatWeRunMenu'
import { ARCHIVE_ALL, CLUB, SOCIALS } from '@/lib/club'
import { ArchiveCard } from '@/components/public/ArchiveCard'
import { countdownParts, useNow, usePublicEvents } from '@/lib/use-public-events'
import { cn } from '@/lib/utils'

const instagram = SOCIALS.find((s) => s.label === 'Instagram')!

// Each lane is a folder; its papers link to /events filtered by that type.
const LANES = [
  {
    glyph: '</>',
    title: 'Build',
    text: 'DIGITHON, CTF, PyQuest, BugBusters, Game Jam.',
    colors: { folderColor: '#2A2622', frontColor: '#161412', labelColor: '#F5F0E3' },
    items: [
      { label: 'DIGITHON', value: 'hackathon' },
      { label: 'CTF', value: 'hackathon' },
      { label: 'PyQuest', value: 'hackathon' },
      { label: 'BugBusters', value: 'hackathon' },
      { label: 'Game Jam', value: 'fest' },
    ],
  },
  {
    glyph: '?!',
    title: 'Think',
    text: 'IDEATHON: pitch an idea to faculty and industry judges.',
    colors: { folderColor: '#C99A12', frontColor: '#F2C230', labelColor: '#161412' },
    items: [{ label: 'IDEATHON', value: 'hackathon' }],
  },
  {
    glyph: '●',
    title: 'Play',
    text: 'Sportiva, the department’s sports fest.',
    colors: { folderColor: '#A8183A', frontColor: '#D6294C', labelColor: '#FFFFFF' },
    items: [{ label: 'Sportiva', value: 'fest' }],
  },
  {
    glyph: '“”',
    title: 'Learn',
    text: 'Learn. Leap. Lead., talks and workshops.',
    colors: { folderColor: '#CFC3A8', frontColor: '#EAE1CF', labelColor: '#161412' },
    items: [
      { label: 'Learn. Leap. Lead.', value: 'talk' },
      { label: 'Talks', value: 'talk' },
      { label: 'Workshops', value: 'workshop' },
    ],
  },
]

const STEPS = [
  { title: 'Sign in with Google', text: 'One click. No separate account or password to remember.' },
  { title: 'Add your details once', text: 'Your college details are saved to your profile after the first time.' },
  { title: 'Solo or as a team', text: 'Create a team, find one that needs members, or join with a code.' },
  { title: 'Show your QR pass', text: 'Find it in My events. Paid events issue it once payment is verified.' },
]

const FAQS = [
  ['Who can register?', 'SRM IST students can register for any event. Students from other colleges can register for events marked Open to all colleges.'],
  ['Do I need a team?', 'Only for team events. You can create a team, join one with a code, or find a team that needs members.'],
  ['Are events free?', 'Most are. For paid events, your pass is issued once the payment is verified.'],
  ['Where is my pass?', 'In My events. Show the QR code at the venue.'],
  ['Can I cancel?', 'Ask the organizers through the Contact page; they can cancel a registration from the dashboard.'],
] as const

const TICKER_A = ['IDEATHONS', 'SPORTIVA', 'HACKATHONS', 'TALKS', 'GAME JAMS', 'WORKSHOPS']
const TICKER_B = ['REGISTER ONCE', 'SHOW YOUR QR', 'SOLO OR TEAM', 'SEE YOU THERE']

const TICKET_GRID = 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,460px),1fr))] justify-items-center gap-x-8 gap-y-12'

const hardShadow = (px: number, color = 'rgb(var(--border))') => ({ boxShadow: `${px}px ${px}px 0 ${color}` })

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// Scroll reveals: [data-reveal] animates itself, [data-reveal-kids] staggers
// its children. One observer lives for the page's lifetime; `deps` changes
// (e.g. events loading) only rescan for newly mounted elements, so reveals
// already waiting to play are never cancelled.
function useReveal(deps: unknown[]) {
  const scanRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const items: HTMLElement[] = []
    const timers: number[] = []
    // Wipes clip their own box, so watch the parent for those.
    const targets = new Map<Element, HTMLElement[]>()

    const show = (el: HTMLElement) => {
      void el.offsetWidth // commit the start state so the transition runs
      el.classList.add('rv-in')
      const delay = parseInt(el.style.getPropertyValue('--rv-delay') || '0', 10)
      timers.push(window.setTimeout(() => el.classList.remove('rv', 'rv-in'), (el.dataset.rv === 'wipe' ? 900 : 700) + delay + 50))
    }

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          io.unobserve(e.target)
          targets.get(e.target)?.forEach(show)
          targets.delete(e.target)
        }),
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )

    const add = (el: Element, kind: string, delay: number) => {
      if (!(el instanceof HTMLElement) || el.dataset.rvDone) return
      el.dataset.rvDone = '1'
      el.dataset.rv = kind
      el.style.setProperty('--rv-delay', `${delay}ms`)
      el.classList.add('rv')
      items.push(el)
      const target = kind === 'wipe' ? el.parentElement ?? el : el
      if (!targets.has(target)) {
        targets.set(target, [])
        io.observe(target)
      }
      targets.get(target)!.push(el)
    }

    scanRef.current = () => {
      document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => add(el, el.dataset.reveal!, 0))
      document.querySelectorAll<HTMLElement>('[data-reveal-kids]').forEach((box) =>
        Array.from(box.children).forEach((kid, i) => add(kid, box.dataset.revealKids!, i * 90))
      )
    }
    scanRef.current()

    return () => {
      scanRef.current = () => {}
      io.disconnect()
      timers.forEach(clearTimeout)
      items.forEach((el) => {
        el.classList.remove('rv', 'rv-in')
        delete el.dataset.rvDone
      })
    }
  }, [])

  useEffect(() => {
    scanRef.current()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// Counts up from 0 the first time the element scrolls into view.
function useCountUp() {
  const ref = useRef<HTMLElement>(null)
  const [p, setP] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const run = () => {
      const t0 = performance.now()
      const step = (t: number) => {
        const x = Math.min(1, (t - t0) / 1600)
        setP(1 - Math.pow(1 - x, 3))
        if (x < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }
    if (!('IntersectionObserver' in window)) {
      run()
      return
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es[0].isIntersecting) {
          run()
          io.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])
  return { ref, p }
}

function Deco({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <span aria-hidden className={cn('pointer-events-none absolute', className)} style={style} />
}

function Marquee({ words, sep, color, sepColor, reverse, seconds }: {
  words: string[]
  sep: string
  color: string
  sepColor: string
  reverse?: boolean
  seconds: number
}) {
  return (
    <div
      aria-hidden
      className={cn('landing-marquee', reverse && 'landing-marquee-reverse')}
      style={{ color, ['--marquee-duration' as string]: `${seconds}s` }}
    >
      {[0, 1].flatMap((k) =>
        words.map((w, i) => (
          <span key={`${k}-${i}`} className="inline-flex items-center gap-7 pr-7">
            {w}
            <span style={{ color: sepColor }}>{sep}</span>
          </span>
        ))
      )}
    </div>
  )
}

function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('font-tech text-[11px] font-bold uppercase tracking-[0.24em] text-primary-red', className)}>{children}</p>
  )
}

function H2({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 data-reveal="wipe" className={cn('mt-2 font-display text-[clamp(34px,5vw,56px)] font-normal leading-none', className)}>
      {children}
    </h2>
  )
}

export default function HomePage() {
  const { openEvents, completedEvents, nextUp, loading, error } = usePublicEvents()
  const now = useNow()
  const [openFaq, setOpenFaq] = useState(0)
  const stats = useCountUp()
  const router = useRouter()
  // Hover-to-open folders misfire on touch (the tap opens then toggles shut).
  const [canHover, setCanHover] = useState(true)
  useEffect(() => setCanHover(window.matchMedia('(hover: hover)').matches), [])
  useReveal([loading])

  const countdown = nextUp ? countdownParts(nextUp.starts_at, now) : null
  const hosted = completedEvents.length + ARCHIVE_ALL.length
  const statList = [
    { n: hosted, suffix: hosted >= 10 ? '+' : '', label: 'EVENTS HOSTED' },
    { n: openEvents.length, suffix: '', label: 'OPEN NOW' },
    { n: LANES.length, suffix: '', label: 'KINDS OF EVENTS' },
  ]

  return (
    <div className="-mb-16 overflow-x-clip">
      {/* Hero */}
      <section className="relative mx-auto max-w-[1240px] px-4 pb-12 pt-14 sm:px-6">
        <div className="relative flex flex-wrap items-center gap-2.5 font-tech text-[11px] font-bold uppercase tracking-[0.22em] text-primary-red">
          <span>
            {CLUB.name} · SRM IST {CLUB.campus}
          </span>
        </div>

        <div className="relative mt-5 grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h1 className="m-0 font-display text-[clamp(60px,10vw,148px)] font-normal leading-[0.88] text-foreground">
              <span data-reveal="left" className="block">BE</span>
              <span data-reveal="right" className="landing-outline block text-primary-yellow">
                THERE<span className="text-primary-red [-webkit-text-stroke:0] [text-shadow:none]">.</span>
              </span>
            </h1>
            <p data-reveal="up" className="mt-7 max-w-[520px] text-xl leading-normal text-foreground [text-wrap:pretty]">
              One place for everything {CLUB.shortName} runs, from builds and ideathons to Sportiva and talks. Sign in once,
              register in a couple of taps.
            </p>
            <div data-reveal="up" className="mt-7 flex flex-wrap gap-3">
              <a
                href="#events"
                className="inline-flex items-center gap-2.5 rounded-full border-[3px] border-border bg-primary-red px-[26px] py-[15px] font-bold tracking-[0.06em] text-white transition-[transform,box-shadow] duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:[box-shadow:6px_6px_0_rgb(var(--border))] [box-shadow:4px_4px_0_rgb(var(--border))]"
              >
                SEE UPCOMING →
              </a>
              <a
                href="#how"
                className="inline-flex items-center rounded-full border-[3px] border-border bg-panel px-[26px] py-[15px] font-bold tracking-[0.06em] text-foreground transition-colors hover:bg-primary-yellow hover:text-[#161412]"
              >
                HOW IT WORKS
              </a>
            </div>
          </div>

          {/* Next up card */}
          <div data-reveal="right" className="relative">
            <div className="absolute -top-[34px] right-[-10px] z-[2]">
              <div
                className="landing-wob relative grid h-[104px] w-[104px] place-items-center rounded-full border-[3px] border-[#161412] bg-primary-yellow text-[#161412]"
                style={hardShadow(4, '#161412')}
              >
                <div className="landing-spin absolute inset-2 rounded-full border-[2.5px] border-dashed border-[#161412]" />
                <div className="text-center font-display text-[13px] leading-[1.05]">
                  {nextUp ? 'REG' : 'SOON'}
                  <br />
                  {nextUp ? 'OPEN' : '✦'}
                </div>
              </div>
            </div>

            <div className="landing-dots relative overflow-hidden rounded-3xl border-[3px] border-[#161412] bg-[#161412] text-cream" style={hardShadow(8, '#D6294C')}>
              <div className="flex flex-col gap-3 px-7 pb-[22px] pt-7">
                <div className="flex items-center gap-2 font-tech text-[11px] font-bold tracking-[0.24em] text-primary-yellow">
                  <span className="landing-blink h-2 w-2 rounded-full bg-primary-yellow" />
                  NEXT UP
                </div>
                {loading ? (
                  <div className="space-y-3 py-1">
                    <div className="h-8 w-3/4 animate-pulse rounded bg-cream/10" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-cream/10" />
                  </div>
                ) : (
                  <>
                    <div className="font-display text-[clamp(26px,3.4vw,36px)] uppercase leading-[1.02]">
                      {nextUp ? nextUp.title : 'NOTHING SCHEDULED'}
                    </div>
                    <div className="font-tech text-[13px] uppercase text-[#CFC7B8]">
                      {nextUp
                        ? new Date(nextUp.starts_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) +
                          (nextUp.venue ? ` · ${nextUp.venue}` : '')
                        : 'STAY TUNED'}
                    </div>
                  </>
                )}
              </div>

              {!loading && nextUp && countdown && (
                <div className="px-7 pb-[26px]">
                  <div className="grid grid-cols-4 gap-2.5">
                    {countdown.map((v, i) => {
                      const txt = String(v).padStart(2, '0')
                      return (
                        <div key={i} className="overflow-hidden rounded-[14px] border-[2.5px] border-cream bg-primary-yellow px-1 pb-2 pt-3 text-center text-[#161412]">
                          <div className="font-display text-[clamp(28px,3.6vw,42px)] leading-none">
                            <span key={txt} className="landing-tick">{txt}</span>
                          </div>
                          <div className="mt-1.5 font-tech text-[10px] font-bold tracking-[0.18em]">{['DAYS', 'HRS', 'MIN', 'SEC'][i]}</div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3.5 border-t-2 border-dashed border-[#3a3632] pt-[18px]">
                    <span className="text-sm text-[#CFC7B8]">
                      {nextUp.registration_closes_at ? `Registration closes ${fmtDay(nextUp.registration_closes_at)}.` : 'Registration is open.'}
                    </span>
                    <Link
                      href={`/events/${nextUp.slug}`}
                      className="rounded-full border-[2.5px] border-cream bg-primary-red px-5 py-3 font-bold tracking-[0.06em] text-white transition-transform duration-100 hover:scale-105"
                    >
                      REGISTER →
                    </Link>
                  </div>
                </div>
              )}

              {!loading && !nextUp && (
                <div className="flex flex-col gap-3.5 px-7 pb-7">
                  <p className="text-[15px] leading-normal text-[#CFC7B8]">The next one drops soon. Follow along and you’ll hear first.</p>
                  <a href={instagram.href} target="_blank" rel="noopener noreferrer" className="font-tech text-xs font-bold uppercase tracking-[0.14em] text-primary-yellow">
                    FOLLOW {instagram.handle} →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tickers */}
      <div className="mx-[-10px] mt-9 flex flex-col">
        <div className="relative z-[2] -rotate-[1.2deg] overflow-hidden border-y-[3px] border-[#161412] bg-primary-yellow">
          <Marquee words={TICKER_A} sep="✦" color="#161412" sepColor="#D6294C" seconds={30} />
        </div>
        <div className="-mt-2.5 rotate-1 overflow-hidden border-b-[3px] border-[#161412] bg-[#161412]">
          <Marquee words={TICKER_B} sep="●" color="#F5F0E3" sepColor="#F2C230" seconds={39} reverse />
        </div>
      </div>

      {/* Upcoming events: tear-off tickets */}
      <section id="events" className="mx-auto max-w-[1240px] scroll-mt-32 px-4 pb-6 pt-[88px] sm:px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Kicker>On the calendar</Kicker>
            <H2>UPCOMING</H2>
            <ScrambledText
              className="mt-4 max-w-[520px] font-tech text-sm leading-relaxed text-foreground-soft"
              radius={90}
              duration={1.2}
              speed={0.5}
              scrambleChars=".:"
            >
              Every event is a ticket. Grab the stub and tear it off to register.
            </ScrambledText>
          </div>
          <Link href="/events" className="font-tech text-xs font-bold tracking-[0.18em] text-primary-red hover:text-foreground">
            ALL EVENTS →
          </Link>
        </div>

        {loading ? (
          <div className={TICKET_GRID}>
            {[0, 1].map((i) => (
              <div key={i} className="h-[230px] w-full max-w-[460px] animate-pulse rounded-[20px] bg-panel-muted" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[22px] border-[3px] border-border bg-danger px-6 py-5 text-center text-sm font-bold text-white">{error}</div>
        ) : openEvents.length > 0 ? (
          <div data-reveal-kids="up" className={TICKET_GRID}>
            {openEvents.map((e, i) => (
              <div key={e.id} className="w-full max-w-[460px]">
                <EventTicket event={e} now={now} index={i} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid items-center gap-7 rounded-[22px] border-[3px] border-dashed border-border bg-[repeating-linear-gradient(135deg,rgb(var(--background))_0_14px,rgb(var(--background-soft)/.5)_14px_28px)] p-8 sm:grid-cols-[auto_1fr_auto]">
            <div className="grid h-[72px] w-[72px] place-items-center rounded-[18px] border-[3px] border-[#161412] bg-primary-yellow font-display text-[32px] text-[#161412]" style={hardShadow(4, '#161412')}>
              0
            </div>
            <div>
              <p className="font-display text-[22px]">NOTHING OPEN RIGHT NOW</p>
              <p className="mt-1.5 text-base text-foreground-soft">New events are announced on Instagram first.</p>
            </div>
            <a
              href={instagram.href}
              target="_blank"
              rel="noopener noreferrer"
              className="justify-self-start whitespace-nowrap rounded-full border-[3px] border-[#161412] bg-[#161412] px-[22px] py-[13px] font-bold tracking-[0.06em] text-primary-yellow"
            >
              FOLLOW
            </a>
          </div>
        )}

        {!loading && !error && (
          <div className="mt-16">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <p className="font-display text-2xl uppercase">Past events</p>
              <Link href="/events#past" className="font-tech text-xs font-bold tracking-[0.18em] text-primary-red hover:text-foreground">
                SEE ALL {hosted} →
              </Link>
            </div>
            {completedEvents.length > 0 && (
              <div data-reveal-kids="up" className={cn(TICKET_GRID, 'mb-12')}>
                {completedEvents.slice(0, 3).map((e, i) => (
                  <div key={e.id} className="w-full max-w-[460px]">
                    <EventTicket event={e} now={now} index={i} past />
                  </div>
                ))}
              </div>
            )}
            <div data-reveal-kids="up" className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-8">
              {ARCHIVE_ALL.slice(0, completedEvents.length > 0 ? 3 : 6).map((e) => (
                <ArchiveCard key={e.title} event={e} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Lanes */}
      <section className="mx-auto max-w-[1240px] px-4 pb-6 pt-[88px] sm:px-6">
        <div className="mb-8 grid items-end gap-x-10 gap-y-6 md:grid-cols-2">
          <div>
            <Kicker>Something for everyone</Kicker>
            <H2>PICK YOUR LANE</H2>
          </div>
          <p className="max-w-[460px] text-[17px] leading-relaxed text-foreground-soft [text-wrap:pretty]">
            You don’t have to code to show up. Every event lands here, whatever it is.
          </p>
        </div>
        <div data-reveal-kids="pop" className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-x-4 gap-y-10 pt-28">
          {LANES.map((l) => (
            <div key={l.title} className="flex justify-center">
              <FolderFloat
                className="lane-folder"
                items={l.items}
                label={`${l.glyph} ${l.title}`}
                sublabel={l.text}
                trigger={canHover ? 'hover' : 'click'}
                closeOnSelect
                physics
                drift={0.5}
                onSelect={(type) => router.push(`/events?type=${type}`)}
                {...l.colors}
                paperColor="#F5F0E3"
                itemColor="#FFFFFF"
                itemTextColor="#161412"
                width={230}
                height={170}
                radius={18}
                spread={115}
                lift={26}
                tilt={8}
                flapAngle={34}
                restAngle={16}
                openDuration={520}
                stagger={45}
                bounce={0.3}
              />
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative mt-[88px] scroll-mt-24 overflow-hidden bg-[#161412] text-cream">
        <Deco className="landing-spin -right-[60px] -top-[60px] h-[220px] w-[220px] rounded-full border-[3px] border-dashed border-[#3a3632]" style={{ animationDuration: '40s' }} />
        <Deco className="landing-bob -left-[30px] bottom-10 h-[60px] w-[60px] border-[3px] border-primary-red" style={{ ['--r' as string]: '45deg', animationDuration: '6s' }} />
        <div className="relative mx-auto max-w-[1240px] px-4 py-20 sm:px-6">
          <div className="mb-12 grid items-end gap-x-10 gap-y-6 md:grid-cols-2">
            <div>
              <Kicker className="text-primary-yellow">How it works</Kicker>
              <H2>
                FOUR STEPS
                <br />
                <span className="text-primary-red">TO THE DOOR</span>
              </H2>
            </div>
            <p className="max-w-[460px] text-[17px] leading-relaxed text-[#CFC7B8] [text-wrap:pretty]">
              Your details are saved after your first event, so every registration after that takes seconds.
            </p>
          </div>
          <ol data-reveal-kids="left" className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,190px),1fr))] gap-[3px] overflow-hidden rounded-[22px] border-[3px] border-cream bg-cream">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex min-h-[230px] flex-col gap-3.5 bg-[#161412] p-7 transition-colors duration-200 hover:bg-[#2A2622]">
                <div className="flex items-center justify-between">
                  <span className="font-display text-5xl leading-none text-primary-yellow">{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-tech text-lg text-primary-red">→</span>
                </div>
                <p className="mt-auto text-[19px] font-bold">{s.title}</p>
                <p className="text-[15px] leading-[1.55] text-[#B8B0A2]">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Stats */}
      <section ref={stats.ref as React.RefObject<HTMLElement>} className="border-b-[3px] border-[#161412] bg-primary-yellow text-[#161412]">
        <div data-reveal-kids="up" className="mx-auto grid max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(min(100%,170px),1fr))] gap-6 px-4 py-12 sm:px-6">
          {statList.map((st) => (
            <div key={st.label} className="flex flex-col gap-1.5 border-l-[3px] border-[#161412] pl-[18px]">
              <span className="font-display text-[clamp(48px,6vw,72px)] leading-none">
                {loading ? '–' : Math.round(st.n * stats.p) + st.suffix}
              </span>
              <span className="font-tech text-xs font-bold tracking-[0.16em]">{st.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* What we run */}
      <section className="mx-auto max-w-[1240px] px-4 pb-6 pt-[88px] sm:px-6">
        <div className="mb-8">
          <Kicker>From {CLUB.shortName}</Kicker>
          <H2>WHAT WE RUN</H2>
        </div>
        <div data-reveal="up">
          <WhatWeRunMenu />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-[1240px] scroll-mt-32 px-4 py-[88px] sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <Kicker>Good to know</Kicker>
            <H2>QUESTIONS</H2>
            <p className="mt-[18px] max-w-[360px] text-base leading-relaxed text-foreground-soft">
              Still stuck? Write to{' '}
              <a href={`mailto:${CLUB.email}`} className="break-all text-primary-red hover:text-foreground">
                {CLUB.email}
              </a>
              .
            </p>
          </div>
          <div data-reveal-kids="right" className="flex flex-col gap-3">
            {FAQS.map(([q, a], i) => {
              const open = openFaq === i
              return (
                <div key={q} className="overflow-hidden rounded-[18px] border-[3px] border-border bg-panel">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? -1 : i)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 px-5 py-[18px] text-left text-[17px] font-bold text-foreground transition-colors hover:bg-background"
                  >
                    <span>{q}</span>
                    <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-full border-[2.5px] border-[#161412] bg-primary-yellow font-tech font-bold text-[#161412]">
                      {open ? '–' : '+'}
                    </span>
                  </button>
                  {open && <p className="landing-tick block px-5 pb-5 text-[15px] leading-relaxed text-foreground-soft">{a}</p>}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-y-[3px] border-[#161412] bg-primary-red">
        <Deco className="landing-bob right-[34%] top-5 h-10 w-10 rounded-full border-[3px] border-[#161412] bg-primary-yellow" style={{ animationDuration: '4s' }} />
        <Deco className="landing-spin -bottom-10 left-[46%] h-[120px] w-[120px] rounded-full border-[3px] border-dashed border-[#161412]" style={{ animationDuration: '20s' }} />
        <div className="relative mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-7 px-4 py-16 sm:px-6">
          <h2 data-reveal="wipe" className="m-0 max-w-[720px] font-display text-[clamp(34px,5.4vw,64px)] font-normal leading-[0.95] text-white">
            NEVER MISS
            <br />A <span className="text-primary-yellow">DROP.</span>
          </h2>
          <a
            href={instagram.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full border-[3px] border-[#161412] bg-primary-yellow px-[26px] py-4 font-bold uppercase tracking-[0.06em] text-[#161412] transition-[transform,box-shadow] duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:[box-shadow:7px_7px_0_#161412] [box-shadow:5px_5px_0_#161412]"
          >
            FOLLOW {instagram.handle} →
          </a>
        </div>
      </section>
    </div>
  )
}
