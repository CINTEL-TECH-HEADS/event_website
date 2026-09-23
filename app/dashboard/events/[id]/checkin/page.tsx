// Owner: FE2 - Check-In page
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  QrCode,
  Zap,
  ShieldCheck,
} from 'lucide-react'

import { createBrowserClient } from '@/lib/supabase/client'
import { CheckInPanel } from '@/components/dashboard/CheckInPanel'
import { LiveStatsCounter } from '@/components/dashboard/LiveStatsCounter'

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
        Loading check-in console...
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Hero */}
      <section className="app-panel px-6 py-7 sm:px-8">

        <span className="app-kicker">
          <QrCode size={14} />
          Event Day Check-In
        </span>

        <h1 className="app-heading mt-5">
          Fast, accurate,
          and smooth entry
          management.
        </h1>

        <p className="app-subheading mt-3 max-w-2xl">
          Scan participant QR codes,
          confirm attendance instantly,
          and monitor live event flow
          without slowing the queue.
        </p>

      </section>

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

          {/* Tips */}
          <div className="app-panel p-6">

            <div className="mb-4 flex items-center gap-3">

              <span className="rounded-xl border-2 border-border bg-panel-muted p-3 text-brand">
                <Zap size={18} />
              </span>

              <div>

                <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
                  Operator Tips
                </h2>

                <p className="text-xs font-bold uppercase tracking-widest text-foreground-soft">
                  Keep lines moving efficiently
                </p>

              </div>

            </div>

            <div className="space-y-3 text-sm font-medium text-foreground-soft">

              <div className="rounded-xl border-2 border-border bg-panel-muted px-4 py-3">
                Scan only one QR code at a time.
              </div>

              <div className="rounded-xl border-2 border-border bg-panel-muted px-4 py-3">
                Green means success.
                Red indicates duplicate
                or invalid entry.
              </div>

              <div className="rounded-xl border-2 border-border bg-panel-muted px-4 py-3">
                Hold device steady
                for faster detection.
              </div>

            </div>

          </div>

          {/* Security */}
          <div className="app-panel p-6">

            <div className="flex items-center gap-3">

              <span className="rounded-xl border-2 border-border bg-panel-muted p-3 text-accent">
                <ShieldCheck size={18} />
              </span>

              <div>

                <h3 className="text-sm font-black uppercase tracking-tight text-foreground">
                  Secure Validation
                </h3>

                <p className="text-sm font-medium text-foreground-soft">
                  Every scan is verified instantly.
                </p>

              </div>

            </div>

          </div>

        </aside>

      </div>

    </div>
  )
}