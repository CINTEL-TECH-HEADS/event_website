// Where an event links to in the dashboard: judges get the read-only judge
// view; everyone else opens the event's management page.
import type { EventWithStats } from '@/types'

export function dashboardEventHref(event: Pick<EventWithStats, 'id' | 'my_role'>): string {
  return event.my_role === 'judge'
    ? `/judge/${event.id}/participants`
    : `/dashboard/events/${event.id}`
}
