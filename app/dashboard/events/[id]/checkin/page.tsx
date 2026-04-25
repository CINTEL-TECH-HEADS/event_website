// Owner: FE2 - Check-In page
'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { QrCode, Zap } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { CheckInPanel } from '@/components/dashboard/CheckInPanel'
import { LiveStatsCounter } from '@/components/dashboard/LiveStatsCounter'

export default function CheckInPage() {
  const { id } = useParams<{ id: string }>()
  const [organizerId, setOrganizerId] = useState('')

  useEffect(() => {
    const getOrganizerId = async () => {
      const supabase = createBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setOrganizerId(user.id)
      }
    }

    getOrganizerId()
  }, [])

  if (!organizerId) {
    return <div className="text-sm text-slate-400">Loading check-in console...</div>
  }

  return (
    <div className="space-y-6">
      <section className="app-panel rounded-[2rem] px-6 py-7 sm:px-8">
        <span className="app-kicker">
          <QrCode size={14} />
          Event Day Check-In
        </span>
        <h1 className="app-heading mt-4">Fast, visible, and calm under pressure.</h1>
        <p className="app-subheading mt-3 max-w-2xl">
          Scan participant QR codes, confirm attendance instantly, and monitor the live counter
          without losing the pace of the queue.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="app-panel rounded-[2rem] p-5 sm:p-6">
          <CheckInPanel eventId={id} organizerId={organizerId} />
        </section>

        <aside className="space-y-4">
          <LiveStatsCounter eventId={id} />
          <div className="app-panel-muted rounded-[1.75rem] p-6">
            <div className="mb-3 flex items-center gap-3">
              <span className="rounded-2xl bg-blue-50 p-3 text-brand-600">
                <Zap size={18} />
              </span>
              <h2 className="text-lg font-semibold text-slate-900">Operator tips</h2>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-white/85 px-4 py-3">Scan only one QR at a time.</div>
              <div className="rounded-2xl bg-white/85 px-4 py-3">Green confirms success, red flags errors or duplicates.</div>
              <div className="rounded-2xl bg-white/85 px-4 py-3">Keep the device steady for faster detection.</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
