'use client'

import { useState } from 'react'
import FlexCarousel from '@/components/reactbits/FlexCarousel'
import { ARCHIVE_ALL } from '@/lib/club'

// Archive events that have a photo, newest period first.
const EVENTS = ARCHIVE_ALL.filter((e) => e.photo)
const ITEMS = EVENTS.map((e) => ({
  src: e.photo as string,
  alt: e.alt,
  title: e.title,
  subtitle: `${e.year} · ${e.kind}`.toUpperCase(),
}))

// Past events on a bending glass carousel (React Bits FlexCarousel). Drag or
// swipe to browse, click the centred photo to open it; the line and facts for
// the centred event sit underneath.
export function PastEventsCarousel() {
  const [active, setActive] = useState(0)
  const event = EVENTS[active] ?? EVENTS[0]
  if (!event) return null

  return (
    <div>
      <div className="relative h-[440px] sm:h-[560px]">
        <FlexCarousel
          items={ITEMS}
          preset="liquid"
          intro="rise"
          cardHeight={0.55}
          gap={14}
          radius={14}
          squeeze={0.2}
          focusOnClick
          captions
          // Don't hijack vertical page scrolling; drags, swipes and
          // horizontal trackpad scrolls still move it.
          captureWheel={false}
          onChange={(index: number) => setActive(index)}
        />
        <p className="pointer-events-none absolute right-4 top-3 hidden font-tech text-[11px] font-bold tracking-[0.2em] text-[#8F877A] md:block">
          DRAG TO BROWSE ↔
        </p>
      </div>
      <div key={event.title} className="landing-tick mx-auto mt-2 flex max-w-[640px] flex-col items-center gap-3 text-center">
        <p className="text-[15px] leading-[1.6] text-[#CFC7B8] [text-wrap:pretty]">{event.text}</p>
        {event.facts.length > 0 && (
          <ul className="flex flex-wrap justify-center gap-2">
            {event.facts.map((f) => (
              <li
                key={f}
                className="rounded-full border-2 border-primary-yellow px-3 py-1 font-tech text-[11px] font-bold uppercase tracking-[0.12em] text-primary-yellow"
              >
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
