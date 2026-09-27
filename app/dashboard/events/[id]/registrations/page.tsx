// Owner: FE2 - Registrations page

'use client'

import { useCallback, useEffect, useState } from 'react'
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
import { parseUuidFromQr } from '@/lib/qr/parse'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'

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

  const [scanResult, setScanResult] =
    useState<any | null>(null)

  const [refreshSignal, setRefreshSignal] =
    useState(0)

  const [stats, setStats] =
    useState({
      total: 0,
      confirmed: 0,
      waitlisted: 0,
      attended: 0,
    })

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${id}/registrations`)
      const { data } = await res.json()
      const rows = data ?? []
      setStats({
        total: rows.length,
        confirmed: rows.filter((r: any) => r.status === 'confirmed').length,
        waitlisted: rows.filter((r: any) => r.status === 'waitlisted').length,
        attended: rows.filter((r: any) => {
          const a = Array.isArray(r.attendance) ? r.attendance[0] : r.attendance
          return !!a?.id
        }).length,
      })
    } catch (error) {
      console.error(error)
    }
  }, [id])

  useEffect(() => {
    async function init() {
      try {
        const supabase = createBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setOrganizerId(user.id)
        await loadStats()
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [loadStats])

  async function handleScan(
    code: string
  ) {
    // The QR encodes `${APP_URL}/checkin/<uuid>` — extract the registration id.
    const registrationId = parseUuidFromQr(code)
    if (!registrationId) {
      setScanMessage('Invalid QR code.')
      return
    }

    try {
      setScanMessage('Processing scan...')

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: registrationId,
          event_id: id,
        }),
      })

      const json = await res.json()

      if (json.error) {
        setScanMessage(json.error)
        setScanResult(null)
      } else {
        setScanMessage(null)
        // Show the verified participant and refresh the table + stats live.
        setScanResult(json.data)
        setRefreshSignal((n) => n + 1)
        loadStats()
      }
    } catch {
      setScanMessage('Scan failed')
      setScanResult(null)
    }
  }

  if (loading) {
    return (
      <div className="text-sm font-medium text-foreground-soft">
        Loading registrations...
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <DashboardPageHeader
        icon={ClipboardList}
        kicker="Registrations"
        title="Registrations"
        description="Everyone registered for this event, including the waitlist. Expand a row to see answers and team members."
        actions={
          <button
            onClick={() => setShowScanner(!showScanner)}
            className="app-button-primary inline-flex items-center justify-center gap-2 px-5 py-3 text-sm"
          >
            <ScanLine size={16} />
            {showScanner ? 'Close scanner' : 'Open scanner'}
          </button>
        }
      />

      {/* Scanner */}
      {showScanner && (
        <section className="app-panel p-5">

          <QRScanner
            onScan={handleScan}
            onError={(msg) =>
              setScanMessage(
                msg
              )
            }
          />

          {scanMessage && (
            <div className="mt-4 rounded-xl border-2 border-border bg-panel-muted px-4 py-3 text-sm font-medium text-foreground">
              {scanMessage}
            </div>
          )}

          {/* Verified participant */}
          {scanResult && (
            <div className="mt-4 rounded-xl border-2 border-border border-l-8 border-l-success bg-panel p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-success">
                <CheckCircle2 size={16} /> Checked in
              </div>
              <p className="text-lg font-bold text-foreground">{scanResult.leader_name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm font-medium text-foreground-soft">
                <span className="app-badge app-badge-neutral">
                  {scanResult.registration_type === 'team' ? 'Team' : 'Solo'}
                </span>
                {scanResult.team_name && <span>Team: <strong className="text-foreground">{scanResult.team_name}</strong></span>}
                {scanResult.checked_in_at && (
                  <span>at {new Date(scanResult.checked_in_at).toLocaleString('en-IN')}</span>
                )}
              </div>
              {scanResult.members?.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-foreground-soft">Members</p>
                  <ul className="space-y-0.5 text-sm font-medium text-foreground-soft">
                    {scanResult.members.map((m: any, i: number) => (
                      <li key={i}>{m.full_name} <span>{m.email}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </section>
      )}

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-4">

        <div className="app-stat-card p-5">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-widest text-foreground-soft">
                Total Registrations
              </p>

              <p className="mt-3 font-display text-4xl text-brand">
                {stats.total}
              </p>

            </div>

            <span className="rounded-xl border-2 border-border bg-panel-muted p-3 text-brand">
              <Users size={18} />
            </span>

          </div>

        </div>

        <div className="app-stat-card p-5">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-widest text-foreground-soft">
                Confirmed
              </p>

              <p className="mt-3 font-display text-4xl text-success">
                {stats.confirmed}
              </p>

            </div>

            <span className="rounded-xl border-2 border-border bg-panel-muted p-3 text-success">
              <CheckCircle2 size={18} />
            </span>

          </div>

        </div>

        <div className="app-stat-card p-5">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-widest text-foreground-soft">
                Waitlisted
              </p>

              <p className="mt-3 font-display text-4xl text-accent">
                {stats.waitlisted}
              </p>

            </div>

            <span className="rounded-xl border-2 border-border bg-panel-muted p-3 text-accent">
              <Clock3 size={18} />
            </span>

          </div>

        </div>

        <div className="app-stat-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-foreground-soft">Checked in</p>
              <p className="mt-3 font-display text-4xl text-success">{stats.attended}</p>
            </div>
            <span className="rounded-xl border-2 border-border bg-panel-muted p-3 text-success">
              <ScanLine size={18} />
            </span>
          </div>
        </div>

      </section>

      {/* Table */}
      <section className="app-panel p-5 sm:p-6">

        <RegistrationTable
          eventId={id}
          organizerId={organizerId}
          refreshSignal={refreshSignal}
        />

      </section>

    </div>
  )
}