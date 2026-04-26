//FE1 event grid component used on the public events page. This is a client component since it has search and filter state, but it receives all events as a prop from the server component page. The server component fetches all events with their confirmed/waitlist counts using a single optimized query, so we don't have to worry about N+1 queries here when rendering the grid.

'use client'

import { useState } from 'react'
import type {
  Event,
  EventType,
} from '@/types'

import { EventCard } from './EventCard'

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

        <div className="rounded-3xl border border-white/10 bg-[#112240] p-6">

          <p className="text-[12px] font-semibold uppercase tracking-[0.35em] text-amber-200">
            Browse Controls
          </p>

          <p className="mt-4 text-[16px] leading-8 text-slate-100">
            Search events,
            filter formats,
            and instantly
            explore what’s live.
          </p>

          <div className="mt-6 border-t border-white/10 pt-5">

            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
              Showing
            </p>

            <p className="mt-2 text-5xl font-bold text-white">
              {
                filteredEvents.length
              }
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Matching Events
            </p>

          </div>

        </div>

        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-[#0d1b31] p-6 space-y-6">

          <div>

            <p className="text-[12px] font-semibold uppercase tracking-[0.35em] text-slate-400">
              Search
            </p>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search workshops, hackathons..."
              className="mt-3 w-full rounded-2xl border border-white/10 bg-[#07101f] px-5 py-4 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400"
            />

          </div>

          <div>

            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.35em] text-slate-400">
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
                    className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition ${
                      type ===
                      filter
                        ? 'bg-[#F5E62D] text-black'
                        : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
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
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center">

          <h2 className="text-xl font-semibold text-white">
            No Matching Events
          </h2>

          <p className="mt-2 text-slate-400">
            Try another
            keyword or
            filter.
          </p>

        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

          {filteredEvents.map(
            (event) => (
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
                />
              </div>
            )
          )}

        </div>
      )}

    </div>
  )
}