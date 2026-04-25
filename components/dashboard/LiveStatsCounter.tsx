// Owner: FE2 - Real-time check-in counter using Supabase Realtime
'use client'
import { useEffect, useState } from 'react'
import { Activity, Users } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'

interface Props {
  eventId: string
}

export function LiveStatsCounter({ eventId }: Props) {
  const [checkedIn, setCheckedIn] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserClient()
    let mounted = true

    const channel = supabase
      .channel(`attendance-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          if (mounted) {
            setCheckedIn((previous) => previous + 1)
          }
        }
      )
      .subscribe()

    supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .then(({ count }) => {
        if (mounted) {
          setCheckedIn(count ?? 0)
          setLoading(false)
        }
      })

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [eventId])

  if (loading) {
    return (
      <div className="app-stat-card p-6">
        <div className="app-shimmer h-14 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="app-stat-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Checked In</p>
          <p className="mt-3 text-5xl font-bold tracking-tight text-brand-600">{checkedIn}</p>
        </div>
        <span className="rounded-2xl bg-blue-50 p-3 text-brand-600">
          <Users size={18} />
        </span>
      </div>
      <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
        <Activity size={15} className="text-green-500" />
        Updates in real time as check-ins happen.
      </div>
    </div>
  )
}
