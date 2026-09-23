import type { Event } from '@/types'
import { spotsLeft } from '@/lib/utils'

type PublicEvent = Event & {
  confirmed_count: number
  waitlist_count?: number
}

export function CapacityBadge({ event }: { event: PublicEvent }) {
  const spots = spotsLeft(event.capacity, event.confirmed_count)

  if (spots === null) return null

  if (spots === 0) {
    return <span className="app-badge app-badge-danger">Full &mdash; join waitlist</span>
  }

  if (spots <= 10) {
    return <span className="app-badge app-badge-warning">Only {spots} spots left</span>
  }

  return <span className="app-badge app-badge-neutral">{spots} spots remaining</span>
}
