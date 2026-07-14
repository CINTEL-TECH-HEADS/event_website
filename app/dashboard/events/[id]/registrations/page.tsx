// Owner: FE2 - Registrations page

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  ClipboardList,
  Users,
  CheckCircle2,
  Clock3,
  ScanLine,
} from 'lucide-react'

import { RegistrationTable } from '@/components/dashboard/RegistrationTable'
import QRScanner from '@/components/dashboard/QRScanner'
import { createBrowserClient } from '@/lib/supabase/client'

export default function RegistrationsPage() {
  const { id } =
    useParams<{ id: string }>()

  const [organizerId, setOrganizerId] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [showScanner, setShowScanner] =
    useState(false)

  const [scanMessage, setScanMessage] =
    useState<string | null>(null)

  const [stats, setStats] =
    useState({
      total: 0,
      confirmed: 0,
      waitlisted: 0,
    })

  useEffect(() => {
    async function init() {
      try {
        const supabase =
          createBrowserClient()

        const {
          data: { user },
        } =
          await supabase.auth.getUser()

        if (user) {
          setOrganizerId(user.id)
        }

        const res = await fetch(
          `/api/events/${id}/registrations`
        )

        const { data } =
          await res.json()

        const rows = data ?? []

        setStats({
          total: rows.length,
          confirmed:
            rows.filter(
              (r: any) =>
                r.status ===
                'confirmed'
            ).length,

          waitlisted:
            rows.filter(
              (r: any) =>
                r.status ===
                'waitlisted'
            ).length,
        })
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [id])

  async function handleScan(
    code: string
  ) {
    try {
      setScanMessage(
        'Processing scan...'
      )

      const res = await fetch(
        '/api/attendance/check-in',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            qr_code: code,
          }),
        }
      )

      const json =
        await res.json()

      if (json.error) {
        setScanMessage(
          json.error
        )
      } else {
        setScanMessage(
          'Check-in successful'
        )
      }
    } catch {
      setScanMessage(
        'Scan failed'
      )
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-slate-400">
        Loading registrations...
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Hero */}
      <section className="app-panel  px-6 py-7 sm:px-8">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <span className="inline-flex items-center gap-2 rounded-full bg-[#0B1736] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#F5E62D]">
              <ClipboardList size={14} />
              Registration Management
            </span>

            <h1 className="mt-5 text-3xl font-bold text-white">
              Manage attendees
              with clarity.
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
              Review registrations,
              verify participants,
              monitor waitlists,
              and manage event access.
            </p>

          </div>

          <button
            onClick={() =>
              setShowScanner(
                !showScanner
              )
            }
            className="inline-flex items-center justify-center gap-2  bg-[#F5E62D] px-5 py-3 text-sm font-semibold text-[#0B1736] transition hover:bg-[#FFF27A]"
          >
            <ScanLine size={16} />
            {showScanner
              ? 'Close Scanner'
              : 'Open Scanner'}
          </button>

        </div>

      </section>

      {/* Scanner */}
      {showScanner && (
        <section className="app-panel  p-5">

          <QRScanner
            onScan={handleScan}
            onError={(msg) =>
              setScanMessage(
                msg
              )
            }
          />

          {scanMessage && (
            <div className="mt-4  border border-[#243B72] bg-[#0B1736] px-4 py-3 text-sm text-slate-300">
              {scanMessage}
            </div>
          )}

        </section>
      )}

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-3">

        <div className="app-stat-card p-5">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-sm text-slate-400">
                Total Registrations
              </p>

              <p className="mt-3 text-4xl font-bold text-[#F5E62D]">
                {stats.total}
              </p>

            </div>

            <span className=" bg-[#0B1736] p-3 text-[#F5E62D]">
              <Users size={18} />
            </span>

          </div>

        </div>

        <div className="app-stat-card p-5">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-sm text-slate-400">
                Confirmed
              </p>

              <p className="mt-3 text-4xl font-bold text-green-400">
                {stats.confirmed}
              </p>

            </div>

            <span className=" bg-green-500/10 p-3 text-green-400">
              <CheckCircle2 size={18} />
            </span>

          </div>

        </div>

        <div className="app-stat-card p-5">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-sm text-slate-400">
                Waitlisted
              </p>

              <p className="mt-3 text-4xl font-bold text-[#93C5FD]">
                {stats.waitlisted}
              </p>

            </div>

            <span className=" bg-[#0B1736] p-3 text-[#93C5FD]">
              <Clock3 size={18} />
            </span>

          </div>

        </div>

      </section>

      {/* Table */}
      <section className="app-panel  p-5 sm:p-6">

        <RegistrationTable
          eventId={id}
          organizerId={organizerId}
        />

      </section>

    </div>
  )
}