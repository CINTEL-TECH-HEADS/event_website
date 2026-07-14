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
      <div className="text-sm text-slate-400">
        Loading check-in console...
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Hero */}
      <section className="app-panel  px-6 py-7 sm:px-8">

        <span className="inline-flex items-center gap-2 rounded-full bg-[#0B1736] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#F5E62D]">
          <QrCode size={14} />
          Event Day Check-In
        </span>

        <h1 className="mt-5 text-3xl font-bold text-white">
          Fast, accurate,
          and smooth entry
          management.
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          Scan participant QR codes,
          confirm attendance instantly,
          and monitor live event flow
          without slowing the queue.
        </p>

      </section>

      {/* Body */}
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">

        {/* Main Scanner */}
        <section className="app-panel  p-5 sm:p-6">

          <CheckInPanel
            eventId={id}
            organizerId={organizerId}
          />

        </section>

        {/* Side */}
        <aside className="space-y-4">

          <LiveStatsCounter
            eventId={id}
          />

          {/* Tips */}
          <div className="app-panel  p-6">

            <div className="mb-4 flex items-center gap-3">

              <span className=" bg-[#0B1736] p-3 text-[#F5E62D]">
                <Zap size={18} />
              </span>

              <div>

                <h2 className="text-lg font-semibold text-white">
                  Operator Tips
                </h2>

                <p className="text-xs text-slate-400">
                  Keep lines moving efficiently
                </p>

              </div>

            </div>

            <div className="space-y-3 text-sm text-slate-300">

              <div className=" border border-[#243B72] bg-[#0B1736] px-4 py-3">
                Scan only one QR code at a time.
              </div>

              <div className=" border border-[#243B72] bg-[#0B1736] px-4 py-3">
                Green means success.
                Red indicates duplicate
                or invalid entry.
              </div>

              <div className=" border border-[#243B72] bg-[#0B1736] px-4 py-3">
                Hold device steady
                for faster detection.
              </div>

            </div>

          </div>

          {/* Security */}
          <div className="app-panel  p-6">

            <div className="flex items-center gap-3">

              <span className=" bg-[#0B1736] p-3 text-[#93C5FD]">
                <ShieldCheck size={18} />
              </span>

              <div>

                <h3 className="font-semibold text-white">
                  Secure Validation
                </h3>

                <p className="text-sm text-slate-400">
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