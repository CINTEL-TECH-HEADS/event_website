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
        className="inline-flex items-center gap-1.5 border border-[#243B72] bg-[#10224A] px-3 py-1.5 text-sm font-semibold text-slate-300 transition hover:border-[#F5E62D] hover:text-white"
      >
        <ArrowLeft size={15} />
        Back
      </button>

      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
        {crumbs.map((c) => (
          <span key={c.href} className="flex items-center gap-1.5">
            {c.isLast ? (
              <span className="font-semibold text-slate-200">{c.label}</span>
            ) : (
              <Link href={c.href} className="transition hover:text-[#F5E62D]">
                {c.label}
              </Link>
            )}
            {!c.isLast && <ChevronRight size={13} className="text-slate-600" />}
          </span>
        ))}
      </nav>
    </div>
  )
}
