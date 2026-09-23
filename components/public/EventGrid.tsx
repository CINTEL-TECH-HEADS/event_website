//FE1 event grid component used on the public events page. This is a client component since it has search and filter state, but it receives all events as a prop from the server component page. The server component fetches all events with their confirmed/waitlist counts using a single optimized query, so we don't have to worry about N+1 queries here when rendering the grid.

'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import type {
  Event,
  EventType,
} from '@/types'

import { EventCard } from './EventCard'
import { Sparkle } from '@/components/brand/Starburst'

type PublicEvent =
  Event & {
    confirmed_count: number
    waitlist_count?: number
  }

const FILTERS: Array<
  'all' | EventType
> = [
  'all',
  'workshop',
  'seminar',
  'fest',
  'hackathon',
  'talk',
  'other',
]

export function EventGrid({
  events,
}: {
  events: PublicEvent[]
}) {
  const [search, setSearch] =
    useState('')

  const [type, setType] =
    useState<
      'all' | EventType
    >('all')

  const normalizedSearch =
    search
      .trim()
      .toLowerCase()

  const filteredEvents =
    events.filter(
      (event) => {
        const matchesSearch =
          normalizedSearch.length ===
            0 ||
          event.title
            .toLowerCase()
            .includes(
              normalizedSearch
            )

        const matchesType =
          type === 'all' ||
          event.event_type ===
            type

        return (
          matchesSearch &&
          matchesType
        )
      }
    )

  return (
    <div className="space-y-8">

      {/* Controls */}
      <div className="grid gap-5 lg:grid-cols-3">

        <div className="poster-panel relative overflow-hidden p-6">
          <div className="halftone pointer-events-none absolute inset-0 opacity-[0.12]" />
          <Sparkle className="absolute right-4 top-4 h-5 w-5 text-primary-yellow" />

          <p className="relative font-tech text-[11px] font-bold uppercase tracking-[0.3em] text-primary-yellow">
            Browse Controls
          </p>

          <p className="relative mt-4 text-base font-medium leading-7 text-[#F5F0E3]">
            Search events, filter formats, and instantly explore what&rsquo;s live.
          </p>

          <div className="relative mt-6 border-t-2 border-[#F5F0E3]/20 pt-5">

            <p className="font-tech text-[10px] font-bold uppercase tracking-widest text-[#F5F0E3]/70">
              Showing
            </p>

            <p className="mt-2 font-display text-4xl text-[#F5F0E3]">
              {
                filteredEvents.length
              }
            </p>

            <p className="mt-1 font-tech text-xs font-bold uppercase tracking-widest text-[#F5F0E3]/70">
              Matching Events
            </p>

          </div>

        </div>

        <div className="app-panel space-y-6 p-6 lg:col-span-2">

          <div>

            <p className="font-tech text-[11px] font-bold uppercase tracking-[0.3em] text-foreground-soft">
              Search
            </p>

            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-soft" strokeWidth={2.5} />
              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search workshops, hackathons..."
                className="app-input pl-11"
              />
            </div>

          </div>

          <div>

            <p className="mb-3 font-tech text-[11px] font-bold uppercase tracking-[0.3em] text-foreground-soft">
              Filter by Type
            </p>

            <div className="flex flex-wrap gap-2">

              {FILTERS.map(
                (
                  filter
                ) => (
                  <button
                    key={
                      filter
                    }
                    type="button"
                    onClick={() =>
                      setType(
                        filter
                      )
                    }
                    className={`rounded-full border-2 border-border px-4 py-2 font-tech text-xs font-bold uppercase tracking-wider shadow-sm transition duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                      type ===
                      filter
                        ? 'bg-warning text-foreground'
                        : 'bg-panel text-foreground-soft hover:bg-panel-muted'
                    }`}
                  >
                    {
                      filter
                    }
                  </button>
                )
              )}

            </div>

          </div>

        </div>

      </div>

      {/* Events */}
      {filteredEvents.length ===
      0 ? (
        <div className="app-empty-state">

          <h2 className="text-xl font-black uppercase text-foreground">
            No Matching Events
          </h2>

          <p className="mt-2 font-medium text-foreground-soft">
            Try another
            keyword or
            filter.
          </p>

        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

          {filteredEvents.map(
            (event, index) => (
              <div
                key={
                  event.id
                }
                className="h-full"
              >
                <EventCard
                  event={
                    event
                  }
                  accentIndex={index}
                />
              </div>
            )
          )}

        </div>
      )}

    </div>
  )
}
