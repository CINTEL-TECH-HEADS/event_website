// Owner: FE2 - Real-time check-in counter using Supabase Realtime
'use client'

import { useEffect, useState } from 'react'
import {
  Activity,
  Users,
} from 'lucide-react'

import { createBrowserClient } from '@/lib/supabase/client'

interface Props {
  eventId: string
  // Bump after a check-in to refetch immediately (works even if Realtime is off).
  refreshSignal?: number
}

export function LiveStatsCounter({
  eventId,
  refreshSignal = 0,
}: Props) {
  const [checkedIn, setCheckedIn] =
    useState(0)

  const [loading, setLoading] =
    useState(true)

  // Confirmed registrations — the denominator for the progress bar.
  const [confirmed, setConfirmed] = useState(0)

  // Authoritative count from the API (admin-side, avoids RLS on a direct select).
  useEffect(() => {
    let mounted = true
    fetch(`/api/events/${eventId}/registrations`)
      .then((r) => r.json())
      .then(({ data }) => {
        if (!mounted) return
        const count = (data ?? []).filter((r: any) => {
          const a = Array.isArray(r.attendance) ? r.attendance[0] : r.attendance
          return !!a?.id
        }).length
        setCheckedIn(count)
        setConfirmed((data ?? []).filter((r: any) => r.status === 'confirmed').length)
        setLoading(false)
      })
      .catch(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [eventId, refreshSignal])

  // Bonus: live increment via Supabase Realtime, when the attendance table is
  // in the realtime publication. (The refetch above is the reliable path.)
  useEffect(() => {
    const supabase = createBrowserClient()
    let mounted = true
    const channel = supabase
      .channel(`attendance-${eventId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance', filter: `event_id=eq.${eventId}` },
        () => { if (mounted) setCheckedIn((p) => p + 1) }
      )
      .subscribe()
    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [eventId])

  if (loading) {
    return (
      <div className="app-stat-card p-6">
        <div className="h-16 animate-pulse bg-panel-muted" />
      </div>
    )
  }

  return (
    <div className="app-stat-card relative overflow-hidden p-6">

      {/* Top */}
      <div className="flex items-start justify-between">

        <div>

          <p className="font-tech text-xs font-bold uppercase tracking-[0.2em] text-foreground-soft">
            Checked in
          </p>

          <p className="mt-3 font-display text-4xl tracking-tight text-foreground sm:text-5xl">
            {checkedIn}
          </p>

        </div>

        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-border bg-primary-yellow text-[#121212]">
          <Users size={18} strokeWidth={2.5} />
        </span>

      </div>

      {confirmed > 0 && (
        <>
          <p className="mt-1 text-sm font-medium text-foreground-soft">
            of {confirmed} confirmed ({Math.round((Math.min(checkedIn, confirmed) / confirmed) * 100)}%)
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full border-2 border-border bg-panel-muted">
            <div
              className="h-full bg-accent transition-all duration-500 ease-out"
              style={{ width: `${Math.min((checkedIn / confirmed) * 100, 100)}%` }}
            />
          </div>
        </>
      )}

      <p className="mt-4 flex items-center gap-2 text-xs font-medium text-foreground-soft">
        <Activity size={14} className="text-success" />
        Updates as participants check in.
      </p>

    </div>
  )
}