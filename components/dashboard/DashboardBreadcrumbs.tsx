'use client'

// Back link + breadcrumb trail for dashboard pages. Derives labels from the URL
// so every subpage (Event Details, Create Event, Registrations, Certificates,
// Notifications, …) gets navigation without per-page wiring. Hidden on the root.

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight } from 'lucide-react'

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  events: 'Events',
  new: 'New Event',
  registrations: 'Registrations',
  certificates: 'Certificates',
  notifications: 'Notifications',
  checkin: 'Check-In',
  export: 'Export',
  duplicates: 'Duplicates',
  audit: 'Audit Log',
}

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

function labelFor(segment: string) {
  if (isUuid(segment)) return 'Event'
  return LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1)
}

export function DashboardBreadcrumbs() {
  const pathname = usePathname()
  const router = useRouter()

  const segments = pathname.split('/').filter(Boolean) // e.g. ['dashboard','events','<id>','registrations']
  // Nothing to show on the dashboard root.
  if (segments.length <= 1) return null

  const crumbs = segments.map((seg, i) => ({
    label: labelFor(seg),
    href: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }))

  return (
    <div className="mb-5 flex items-center gap-3">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-panel px-3 py-1.5 font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft shadow-sm transition-all duration-200 ease-out hover:text-foreground active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        <ArrowLeft size={15} />
        Back
      </button>

      <nav className="flex flex-wrap items-center gap-1.5 font-tech text-xs font-bold uppercase tracking-wide text-foreground-soft">
        {crumbs.map((c) => (
          <span key={c.href} className="flex items-center gap-1.5">
            {c.isLast ? (
              <span className="text-foreground">{c.label}</span>
            ) : (
              <Link href={c.href} className="transition-colors duration-200 hover:text-accent">
                {c.label}
              </Link>
            )}
            {!c.isLast && <ChevronRight size={13} className="text-border" />}
          </span>
        ))}
      </nav>
    </div>
  )
}
