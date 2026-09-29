// Owner: FE2 - Registrations table with search, filters, and bulk actions
'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import { ChevronDown, Mail, Search, Users } from 'lucide-react'
import { RegistrationStatus, RegistrationWithDetails } from '@/types'

interface Props {
  eventId: string
  organizerId: string
  // Bump to force a reload (e.g. after a live check-in).
  refreshSignal?: number
}

// Renders a file/image answer (a storage path) by fetching a signed URL.
function FileAnswer({ path }: { path: string }) {
  const [state, setState] = useState<{ url: string; kind: string } | null>(null)
  useEffect(() => {
    let on = true
    fetch(`/api/uploads/file?path=${encodeURIComponent(path)}`)
      .then((r) => r.json())
      .then((j) => on && j.data && setState({ url: j.data.url, kind: j.data.kind }))
      .catch(() => {})
    return () => { on = false }
  }, [path])

  if (!state) return <p className="text-xs font-medium text-foreground-soft">Loading file…</p>
  if (state.kind === 'image') {
    return (
      <a href={state.url} target="_blank" rel="noopener noreferrer">
        <img src={state.url} alt="upload" className="mt-1 max-h-28 rounded-lg border-2 border-border" />
      </a>
    )
  }
  return (
    <a href={state.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-brand hover:underline">
      Download file
    </a>
  )
}

// Attendance embeds as a single object (unique per registration), not an array.
function attendanceRow(reg: any): { id: string; checked_in_at?: string } | null {
  const a = Array.isArray(reg?.attendance) ? reg.attendance[0] : reg?.attendance
  return a?.id ? a : null
}

type StatusFilter =
  | ''
  | 'confirmed'
  | 'waitlisted'
  | 'cancelled'

type TypeFilter =
  | ''
  | 'solo'
  | 'team'

export function RegistrationTable({
  eventId,
  organizerId,
  refreshSignal = 0,
}: Props) {
  const [
    registrations,
    setRegistrations,
  ] = useState<
    RegistrationWithDetails[]
  >([])

  const [loading, setLoading] =
    useState(true)

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('')

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>('')

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState<TypeFilter>('')

  const [selected, setSelected] =
    useState<Set<string>>(
      new Set()
    )

  const [
    expandedId,
    setExpandedId,
  ] = useState<string | null>(
    null
  )

  const [
    processing,
    setProcessing,
  ] = useState(false)

  const loadRegistrations =
    useCallback(
      async () => {
        setLoading(true)

        const params =
          new URLSearchParams({
            event_id:
              eventId,
            ...(statusFilter && {
              status:
                statusFilter,
            }),
            ...(searchQuery && {
              search:
                searchQuery,
            }),
            ...(typeFilter && {
              type:
                typeFilter,
            }),
          })

        try {
          const res =
            await fetch(
              `/api/events/${eventId}/registrations?${params}`
            )

          const {
            data,
          } =
            await res.json()

          setRegistrations(
            data ?? []
          )
        } catch (error) {
          console.error(
            'Failed to load registrations:',
            error
          )
        } finally {
          setLoading(false)
        }
      },
      [
        eventId,
        searchQuery,
        statusFilter,
        typeFilter,
      ]
    )

  useEffect(() => {
    loadRegistrations()
    // refreshSignal is intentionally a dep so a live check-in re-fetches.
  }, [loadRegistrations, refreshSignal])

  const [offering, setOffering] = useState<string | null>(null)
  async function offerSpot(registrationId: string) {
    setOffering(registrationId)
    const { error } = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, registration_id: registrationId }),
    }).then((r) => r.json())
    setOffering(null)
    if (error) { alert(error); return }
    loadRegistrations()
  }

  const getStatusBadge = (
    status: RegistrationStatus
  ) => {
    const styles: Record<
      string,
      string
    > = {
      confirmed:
        'app-badge-success',
      waitlisted:
        'app-badge-warning',
      cancelled:
        'app-badge-danger',
      attended:
        'app-badge-neutral border-brand text-brand',
    }

    return (
      styles[status] ??
      'app-badge-neutral'
    )
  }

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-border bg-panel p-5">
        <div className="h-12 animate-pulse rounded-xl bg-panel-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Filters */}
      <section className="rounded-2xl border-2 border-border bg-panel p-4">

        <div className="grid gap-3 lg:grid-cols-[1.6fr_0.8fr_0.8fr]">

          <label className="relative block">

            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-soft"
            />

            <input
              type="text"
              placeholder="Search by name or email..."
              value={
                searchQuery
              }
              onChange={(
                e
              ) =>
                setSearchQuery(
                  e.target
                    .value
                )
              }
              className="app-input pl-11"
            />

          </label>

          <select
            value={
              statusFilter
            }
            onChange={(
              e
            ) =>
              setStatusFilter(
                e.target
                  .value as StatusFilter
              )
            }
            className="app-select"
          >
            <option value="">
              All Statuses
            </option>
            <option value="confirmed">
              Confirmed
            </option>
            <option value="waitlisted">
              Waitlisted
            </option>
            <option value="cancelled">
              Cancelled
            </option>
          </select>

          <select
            value={
              typeFilter
            }
            onChange={(
              e
            ) =>
              setTypeFilter(
                e.target
                  .value as TypeFilter
              )
            }
            className="app-select"
          >
            <option value="">
              All Types
            </option>
            <option value="solo">
              Solo
            </option>
            <option value="team">
              Team
            </option>
          </select>

        </div>

      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border-2 border-border bg-panel sm:border-4">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-panel-muted font-tech text-xs font-bold uppercase tracking-wider text-foreground">

              <tr>
                <th className="px-4 py-4 text-left">
                  ID
                </th>

                <th className="px-4 py-4 text-left">
                  Name
                </th>

                <th className="px-4 py-4 text-left">
                  Email
                </th>

                <th className="px-4 py-4 text-left">
                  Type
                </th>

                <th className="px-4 py-4 text-left">
                  Status
                </th>

                <th className="px-4 py-4 text-left">
                  Attendance
                </th>

                <th className="px-4 py-4 text-left">
                  Date
                </th>
              </tr>

            </thead>

            <tbody>

              {registrations.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-6"
                  >
                    <div className="app-empty-state p-8 text-center">
                      No registrations
                      match the
                      current
                      filters.
                    </div>
                  </td>
                </tr>
              ) : (
                registrations.map(
                  (
                    registration
                  ) => (
                    <Fragment
                      key={
                        registration.id
                      }
                    >

                      <tr
                        className="cursor-pointer border-b-2 border-border transition duration-200 ease-out hover:bg-panel-muted"
                        onClick={() =>
                          setExpandedId(
                            expandedId ===
                              registration.id
                              ? null
                              : registration.id
                          )
                        }
                      >

                        <td className="px-4 py-4 font-mono text-xs font-medium text-foreground-soft">
                          {
                            registration.display_id
                          }
                        </td>

                        <td className="px-4 py-4 font-bold text-foreground">
                          {
                            registration.leader_name
                          }
                        </td>

                        <td className="px-4 py-4 text-sm font-medium text-accent">
                          {
                            registration.leader_email
                          }
                        </td>

                        <td className="px-4 py-4">
                          <span className="app-badge app-badge-neutral">
                            {registration.registration_type ===
                            'solo'
                              ? 'Solo'
                              : 'Team'}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`app-badge ${getStatusBadge(
                                registration.status as RegistrationStatus
                              )}`}
                            >
                              {registration.status}
                            </span>
                            {(registration as any).payment_status === 'pending' && (
                              <span className="app-badge app-badge-warning">Payment pending</span>
                            )}
                            {(registration as any).payment_status === 'paid' && (
                              <span className="app-badge app-badge-success">Paid</span>
                            )}
                            {registration.status === 'waitlisted' && (
                              (registration as any).offer_status === 'offered' ? (
                                <span className="app-badge app-badge-neutral border-brand text-brand">Offered</span>
                              ) : (registration as any).offer_status === 'declined' ? (
                                <span className="app-badge app-badge-neutral">Declined</span>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); offerSpot(registration.id) }}
                                  disabled={offering === registration.id}
                                  className="rounded-full border-2 border-brand px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand transition duration-200 ease-out hover:bg-brand hover:text-white disabled:opacity-50"
                                >
                                  {offering === registration.id ? 'Offering…' : 'Offer spot'}
                                </button>
                              )
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {attendanceRow(registration) ? (
                            <span className="app-badge app-badge-success">
                              {registration.registration_type === 'team'
                                ? `✓ ${(registration.members ?? []).filter((m: any) => m.checked_in_at).length}/${registration.members?.length ?? 0} present`
                                : '✓ Checked in'}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-foreground-soft">—</span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm font-medium text-foreground-soft">
                          {new Date(
                            registration.registered_at
                          ).toLocaleDateString(
                            'en-IN'
                          )}
                        </td>

                      </tr>

                      {expandedId ===
                        registration.id && (
                        <tr className="bg-panel-muted">
                          <td colSpan={7} className="p-4">
                            {(() => {
                              const r = registration as any
                              const att = attendanceRow(r)
                              const attended = !!att
                              const hasCert = (r.certificates?.length ?? 0) > 0
                              const checkedInAt = att?.checked_in_at
                              return (
                                <div className="grid gap-4 rounded-xl border-2 border-border bg-panel p-4 lg:grid-cols-2">
                                  {/* Contact + status */}
                                  <div className="space-y-2 text-sm">
                                    <div className="mb-2 flex items-center gap-2 font-bold uppercase tracking-wide text-foreground">
                                      <ChevronDown size={15} className="text-brand" /> Participant
                                    </div>
                                    <p className="font-medium text-foreground-soft"><span className="font-bold text-foreground">Name:</span> {r.leader_name}</p>
                                    <p className="font-medium text-foreground-soft"><span className="font-bold text-foreground">Email:</span> {r.leader_email}</p>
                                    {r.leader_phone && <p className="font-medium text-foreground-soft"><span className="font-bold text-foreground">Phone:</span> {r.leader_phone}</p>}
                                    <p className="font-medium text-foreground-soft"><span className="font-bold text-foreground">ID:</span> <span className="font-mono">{r.display_id}</span></p>
                                    {r.team_name && <p className="font-medium text-foreground-soft"><span className="font-bold text-foreground">Team:</span> {r.team_name}</p>}
                                    {r.group_code && <p className="font-medium text-foreground-soft"><span className="font-bold text-foreground">Group code:</span> <span className="font-mono">{r.group_code}</span></p>}
                                    <p className="font-medium text-foreground-soft">
                                      <span className="font-bold text-foreground">Attendance:</span>{' '}
                                      {attended
                                        ? <span className="text-success">Checked in{checkedInAt ? ` · ${new Date(checkedInAt).toLocaleString('en-IN')}` : ''}</span>
                                        : <span>Not checked in</span>}
                                    </p>
                                    <p className="font-medium text-foreground-soft">
                                      <span className="font-bold text-foreground">Certificate:</span>{' '}
                                      {hasCert ? <span className="text-warning">Generated</span> : <span>—</span>}
                                    </p>
                                  </div>

                                  {/* Team members */}
                                  <div className="text-sm">
                                    <div className="mb-2 flex items-center gap-2 font-bold uppercase tracking-wide text-foreground">
                                      <Users size={15} className="text-brand" /> Members ({r.members?.length ?? 0})
                                    </div>
                                    {r.members?.length ? (
                                      <ul className="space-y-1">
                                        {r.members.map((m: any) => (
                                          <li key={m.id} className="font-medium text-foreground-soft">
                                            {m.full_name} <span>{m.email}</span>
                                            {m.is_leader && <span className="ml-1 text-xs font-bold uppercase tracking-wide text-warning">Creator</span>}
                                            {m.checked_in_at && <span className="ml-1 text-xs font-bold uppercase tracking-wide text-success">Present</span>}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="font-medium text-foreground-soft">Solo registration</p>
                                    )}
                                  </div>

                                  {/* Custom answers */}
                                  {r.answers?.length > 0 && (
                                    <div className="lg:col-span-2">
                                      <div className="mb-2 text-sm font-bold uppercase tracking-wide text-foreground">Responses</div>
                                      <div className="grid gap-2 sm:grid-cols-2">
                                        {r.answers.map((a: any) => (
                                          <div key={a.id} className="rounded-lg border-2 border-border bg-panel-muted px-3 py-2">
                                            <p className="text-xs font-bold uppercase tracking-widest text-foreground-soft">{a.form_fields?.label ?? 'Field'}</p>
                                            {typeof a.answer === 'string' && a.answer.startsWith('submissions/') ? (
                                              <FileAnswer path={a.answer} />
                                            ) : (
                                              <p className="text-sm font-medium text-foreground">{a.answer}</p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })()}
                          </td>
                        </tr>
                      )}

                    </Fragment>
                  )
                )
              )}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  )
}