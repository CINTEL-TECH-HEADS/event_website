import type { Event } from '@/types'

export type PublicEvent = Event & {
  confirmed_count: number
  waitlist_count?: number
}

// GET /api/events returns confirmed_count as a PostgREST aggregate
// ([{ count }]) — flatten it to a number.
function normalizeConfirmedCount(value: unknown): number {
  if (typeof value === 'number') return value
  if (Array.isArray(value)) {
    const first = value[0]
    if (first && typeof first === 'object' && 'count' in first) {
      const count = (first as { count?: unknown }).count
      return typeof count === 'number' ? count : 0
    }
  }
  return 0
}

export function normalizeEvent(event: PublicEvent): PublicEvent {
  return {
    ...event,
    confirmed_count: normalizeConfirmedCount((event as PublicEvent & { confirmed_count: unknown }).confirmed_count),
  }
}
