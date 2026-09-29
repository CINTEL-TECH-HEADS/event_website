// Owner: FE2 - Check-In page
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  QrCode,
  Zap,
} from 'lucide-react'

import { createBrowserClient } from '@/lib/supabase/client'
import { CheckInPanel } from '@/components/dashboard/CheckInPanel'
import { LiveStatsCounter } from '@/components/dashboard/LiveStatsCounter'
import { AttendanceList } from '@/components/dashboard/AttendanceList'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'

export default function CheckInPage() {
  const { id } =
    useParams<{ id: string }>()

  const [organizerId, setOrganizerId] =
    useState('')

  const [refreshSignal, setRefreshSignal] =
    useState(0)

  useEffect(() => {
    async function getOrganizerId() {
      const supabase =
        createBrowserClient()

      const {
        data: { user },
      } =
        await supabase.auth.getUser()

      if (user) {
        setOrganizerId(user.id)
      }
    }

    getOrganizerId()
  }, [])

  if (!organizerId) {
    return (
      <div className="text-sm font-medium text-foreground-soft">
        Loading…
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Hero */}
      <DashboardPageHeader
        icon={QrCode}
        kicker="Check-in"
        title="Event-day check-in"
        description={'Scan a QR pass to check people in. For teams, tick who is here. The attendance list below shows everyone and lets you fix it later.'}
      />

      {/* Body */}
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">

        {/* Main Scanner */}
        <section className="app-panel p-5 sm:p-6">

          <CheckInPanel
            eventId={id}
            organizerId={organizerId}
            onCheckIn={() => setRefreshSignal((n) => n + 1)}
          />

        </section>

        {/* Side */}
        <aside className="space-y-4">

          <LiveStatsCounter
            eventId={id}
            refreshSignal={refreshSignal}
          />

          <div className="rounded-2xl border-2 border-border bg-panel p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-display text-sm uppercase tracking-wide text-foreground">
              <Zap size={16} className="text-brand" /> Scanning tips
            </h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm font-medium text-foreground-soft">
              <li>Scan one QR pass at a time and hold the device steady.</li>
              <li>Green means checked in. Red means already checked in or not a valid pass.</li>
              <li>Team pass: tick the members who are here. Scan it again when someone arrives later.</li>
            </ul>
          </div>

        </aside>

      </div>

      <AttendanceList
        eventId={id}
        refreshSignal={refreshSignal}
        onChange={() => setRefreshSignal((n) => n + 1)}
      />

    </div>
  )
}