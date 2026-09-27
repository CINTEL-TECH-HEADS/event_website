'use client'

import { useEffect, useState } from 'react'
import { isRegistrationOpen } from '@/lib/utils'
import { normalizeEvent, type PublicEvent } from '@/lib/public-events'

// One GET /api/events per page load, shared by the header's "Next up" strip
// and the home page.
let pending: Promise<PublicEvent[]> | null = null

function fetchEvents() {
  pending ??= fetch('/api/events')
    .then((res) => res.json())
    .then(({ data }) => ((data ?? []) as PublicEvent[]).map(normalizeEvent))
    .catch((err) => {
      pending = null
      throw err
    })
  return pending
}

export function usePublicEvents() {
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchEvents()
      .then((data) => active && setEvents(data))
      .catch((err) => {
        console.error('Failed to load events:', err)
        if (active) setError('Unable to load events right now.')
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const openEvents = events
    .filter(isRegistrationOpen)
    .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at))
  // Most recent first.
  const completedEvents = events
    .filter((e) => !isRegistrationOpen(e))
    .sort((a, b) => +new Date(b.starts_at) - +new Date(a.starts_at))

  return { events, openEvents, completedEvents, nextUp: openEvents[0], loading, error }
}

// Ticks once a second; for countdowns.
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

export function countdownParts(target: string, now: number) {
  const diff = Math.max(0, new Date(target).getTime() - now)
  return [
    Math.floor(diff / 864e5),
    Math.floor(diff / 36e5) % 24,
    Math.floor(diff / 6e4) % 60,
    Math.floor(diff / 1e3) % 60,
  ] as const
}
