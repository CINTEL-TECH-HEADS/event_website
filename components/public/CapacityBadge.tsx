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
    return <span className="text-sm font-semibold text-rose-300">Full - join waitlist</span>
  }

  if (spots <= 10) {
    return <span className="text-sm font-semibold text-amber-200">Only {spots} spots left</span>
  }

  return <span className="text-sm font-semibold text-blue-200">{spots} spots remaining</span>
}
