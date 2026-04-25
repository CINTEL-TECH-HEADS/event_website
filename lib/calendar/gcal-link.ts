// lib/calendar/gcal-link.ts
// Generates a Google Calendar deep link from event data.
// No OAuth required — works on iOS, Android, and desktop.
// Opens the native Calendar app on mobile.
//
// Usage:
//   const url = generateGoogleCalendarLink({
//     title:    'Web Dev Workshop',
//     startsAt: '2026-04-28T10:00:00+05:30',
//     endsAt:   '2026-04-28T14:00:00+05:30',
//     venue:    'Lab 4, SRM',
//     description: 'Hands-on React workshop',
//   })

export function generateGoogleCalendarLink(event: {
  title: string
  description?: string
  venue?: string
  starts_at?: string
  ends_at?: string
}) {
  if (!event.starts_at || !event.ends_at) return '#'

  const start = new Date(event.starts_at)
  const end = new Date(event.ends_at)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '#'

  const formatDate = (date: Date) =>
    date
      .toISOString()
      .replace(/-|:/g, '')
      .replace(/\.\d{3}/, '')

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(start)}/${formatDate(end)}`,
    details: event.description ?? '',
    location: event.venue ?? '',
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}