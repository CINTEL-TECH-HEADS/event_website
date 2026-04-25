// Owner: FE2 - Registrations page

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  ClipboardList,
  Users,
  CheckCircle2,
  Clock3,
} from 'lucide-react'

import { RegistrationTable } from '@/components/dashboard/RegistrationTable'
import { createBrowserClient } from '@/lib/supabase/client'

export default function RegistrationsPage() {
  const { id } = useParams<{ id: string }>()

  const [organizerId, setOrganizerId] = useState('')
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    waitlisted: 0,
  })

  useEffect(() => {
    async function init() {
      try {
        const supabase = createBrowserClient()

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          setOrganizerId(user.id)
        }

        const res = await fetch(`/api/events/${id}/registrations`)
        const { data } = await res.json()

        const rows = data ?? []

        setStats({
          total: rows.length,
          confirmed: rows.filter((r: any) => r.status === 'confirmed').length,
          waitlisted: rows.filter((r: any) => r.status === 'waitlisted').length,
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [id])

  if (loading) {
    return (
      <div className="text-sm text-slate-400">
        Loading registrations...
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <section className="app-panel rounded-[2rem] px-6 py-7 sm:px-8">
        <span className="app-kicker">
          <ClipboardList size={14} />
          Registration Management
        </span>

        <h1 className="app-heading mt-4">
          Manage attendees with speed and clarity.
        </h1>

        <p className="app-subheading mt-3 max-w-2xl">
          Search participants, verify registrations,
          monitor waitlists, and export data anytime.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">

        <div className="app-stat-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Registrations</p>
              <p className="mt-3 text-4xl font-bold text-slate-900">
                {stats.total}
              </p>
            </div>

            <span className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <Users size={18} />
            </span>
          </div>
        </div>

        <div className="app-stat-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Confirmed</p>
              <p className="mt-3 text-4xl font-bold text-green-600">
                {stats.confirmed}
              </p>
            </div>

            <span className="rounded-2xl bg-green-50 p-3 text-green-600">
              <CheckCircle2 size={18} />
            </span>
          </div>
        </div>

        <div className="app-stat-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Waitlisted</p>
              <p className="mt-3 text-4xl font-bold text-amber-600">
                {stats.waitlisted}
              </p>
            </div>

            <span className="rounded-2xl bg-amber-50 p-3 text-amber-600">
              <Clock3 size={18} />
            </span>
          </div>
        </div>

      </section>

      <section className="app-panel rounded-[2rem] p-5 sm:p-6">
        <RegistrationTable
          eventId={id}
          organizerId={organizerId}
        />
      </section>

    </div>
  )
}