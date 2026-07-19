// Owner: FE2 - Real-time check-in counter using Supabase Realtime
'use client'

import { useEffect, useState } from 'react'
import {
  Activity,
  Users,
  CheckCircle2,
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
      <div className=" border border-[#243B72] bg-[#10224A] p-6 ">
        <div className="h-16 animate-pulse  bg-[#0B1736]" />
      </div>
    )
  }

  return (
    <div className=" border border-[#243B72] bg-[#10224A] p-6 ">

      {/* Top */}
      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-slate-400">
            Live Check-Ins
          </p>

          <p className="mt-3 text-5xl font-bold tracking-tight text-[#F5E62D]">
            {checkedIn}
          </p>

        </div>

        <span className=" bg-[#0B1736] p-3 text-[#F5E62D]">
          <Users size={18} />
        </span>

      </div>

      {/* Progress */}
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#0B1736]">

        <div
          className="h-full rounded-full bg-[#F5E62D] transition-all duration-500"
          style={{
            width: `${Math.min(
              checkedIn * 8,
              100
            )}%`,
          }}
        />

      </div>

      {/* Bottom */}
      <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">

        <Activity
          size={15}
          className="text-green-400"
        />

        Updates instantly as
        participants check in.

      </div>

      {checkedIn > 0 && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-400">

          <CheckCircle2
            size={14}
          />

          Event activity detected

        </div>
      )}

    </div>
  )
}