// Owner: FE2 - Registrations table with search, filters, and bulk actions
'use client'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { ChevronDown, Mail, Search, Users } from 'lucide-react'
import { RegistrationStatus, RegistrationWithDetails } from '@/types'

interface Props {
  eventId: string
  organizerId: string
}

type StatusFilter = '' | 'confirmed' | 'waitlisted' | 'cancelled'
type TypeFilter = '' | 'solo' | 'team'

export function RegistrationTable({ eventId, organizerId }: Props) {
  const [registrations, setRegistrations] = useState<RegistrationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const loadRegistrations = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      event_id: eventId,
      ...(statusFilter && { status: statusFilter }),
      ...(searchQuery && { search: searchQuery }),
      ...(typeFilter && { type: typeFilter }),
    })

    try {
      const res = await fetch(`/api/events/${eventId}/registrations?${params}`)
      const { data } = await res.json()
      setRegistrations(data ?? [])
    } catch (error) {
      console.error('Failed to load registrations:', error)
    } finally {
      setLoading(false)
    }
  }, [eventId, searchQuery, statusFilter, typeFilter])

  useEffect(() => {
    loadRegistrations()
  }, [loadRegistrations])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(registrations.map((registration) => registration.id)))
      return
    }

    setSelected(new Set())
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const nextSelected = new Set(selected)
    if (checked) {
      nextSelected.add(id)
    } else {
      nextSelected.delete(id)
    }
    setSelected(nextSelected)
  }

  const handleMarkAttended = async () => {
    if (selected.size === 0) {
      return
    }

    setProcessing(true)
    try {
      const res = await fetch('/api/attendance/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_ids: Array.from(selected),
          organizer_id: organizerId,
          event_id: eventId,
        }),
      })

      if (res.ok) {
        setSelected(new Set())
        await loadRegistrations()
      }
    } catch (error) {
      console.error('Failed to mark attended:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleCancel = async () => {
    if (selected.size === 0) {
      return
    }

    setProcessing(true)
    try {
      for (const registrationId of Array.from(selected)) {
        await fetch(`/api/registrations/${registrationId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'cancelled'
  })
})
      }
      setSelected(new Set())
      await loadRegistrations()
    } catch (error) {
      console.error('Failed to cancel registrations:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (selected.size === 0) {
      return
    }

    setProcessing(true)
    try {
      for (const registrationId of Array.from(selected)) {
        await fetch('/api/resend-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registration_id: registrationId }),
        })
      }
      setSelected(new Set())
    } catch (error) {
      console.error('Failed to resend confirmations:', error)
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: RegistrationStatus) => {
    const styles: Record<string, string> = {
      confirmed: 'app-badge-success',
      waitlisted: 'app-badge-warning',
      cancelled: 'app-badge-danger',
      attended: 'app-badge-brand',
    }

    return styles[status] || 'app-badge-neutral'
  }

  if (loading) {
    return (
      <div className="app-panel rounded-[1.75rem] p-5">
        <div className="app-shimmer h-12 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <section className="app-panel rounded-[1.75rem] p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1.6fr_0.8fr_0.8fr]">
          <label className="relative block">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="app-input pl-11"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="app-select"
          >
            <option value="">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="app-select"
          >
            <option value="">All Types</option>
            <option value="solo">Solo</option>
            <option value="team">Team</option>
          </select>
        </div>
      </section>

      {selected.size > 0 && (
        <section className="app-panel rounded-[1.5rem] border-blue-200 bg-blue-50/80 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-brand-700">{selected.size} registrations selected</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleMarkAttended} disabled={processing} className="app-button-success px-4 py-2">
                Mark Attended
              </button>
              <button onClick={handleResendConfirmation} disabled={processing} className="app-button-secondary px-4 py-2">
                <Mail size={15} />
                Resend Confirmation
              </button>
              <button onClick={handleCancel} disabled={processing} className="app-button-danger px-4 py-2">
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="app-table-wrap">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th className="w-12">
                  <input
                    type="checkbox"
                    checked={selected.size === registrations.length && registrations.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Attended</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="app-empty-state m-3">
                      No registrations match the current filters.
                    </div>
                  </td>
                </tr>
              ) : (
                registrations.map((registration) => (
                  <Fragment key={registration.id}>
                    <tr
                      className={`app-table-row-interactive cursor-pointer ${
                        selected.has(registration.id) ? 'bg-blue-50/70' : ''
                      }`}
                      onClick={() =>
                        setExpandedId(expandedId === registration.id ? null : registration.id)
                      }
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(registration.id)}
                          onChange={(e) =>
                            handleSelectOne(registration.id, e.target.checked)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="font-mono text-xs text-slate-400">{registration.display_id}</td>
                      <td className="font-bold text-white tracking-wide">{registration.leader_name}</td>
                      <td className="text-sm text-amber-400">{registration.leader_email}</td>
                      <td>
                        <span className="app-badge app-badge-neutral">
                          {registration.registration_type === 'solo' ? 'Solo' : 'Team'}
                        </span>
                      </td>
                      <td>
                        <span className={`app-badge ${getStatusBadge(registration.status as RegistrationStatus)}`}>
                          {registration.status}
                        </span>
                      </td>
                      <td className="text-sm text-slate-500">
                        {new Date(registration.registered_at).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        {registration.attendance ? (
                          <span className="app-badge app-badge-brand">Checked in</span>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                    </tr>

                    {expandedId === registration.id && (
                      <tr className="bg-black/30">
                        <td colSpan={8}>
                          <div className="grid gap-4 rounded-[1.2rem] bg-black/60 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] lg:grid-cols-2">
                            <div>
                              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                                <Users size={15} className="text-amber-400" />
                                Team & Members
                              </div>
                              {registration.registration_type === 'team' &&
                              registration.members.length > 0 ? (
                                <div className="space-y-2 text-sm text-slate-300">
                                  <p className="font-medium text-amber-400">
                                    {registration.team_name || 'Unnamed team'}
                                  </p>
                                  {registration.members.map((member: any) => (
                                    <div
                                      key={member.id}
                                      className="rounded-xl border border-white/5 bg-black/40 px-3 py-2"
                                    >
                                      {member.full_name}
                                      {member.is_leader && (
                                        <span className="ml-2 text-[0.65rem] uppercase tracking-widest font-bold text-amber-500">
                                          Leader
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500">Solo registration</p>
                              )}
                            </div>

                            <div>
                              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                                <ChevronDown size={15} className="text-amber-400" />
                                Custom Field Answers
                              </div>
                              {registration.answers?.length ?? 0 ? (
                                <div className="space-y-2 text-sm text-slate-300">
                                  {registration.answers?.map((answer: any) => (
                                    <div key={answer.id} className="rounded-xl border border-white/5 bg-black/40 px-3 py-2">
                                      <span className="font-medium text-amber-400">
                                        {answer.field_id}
                                      </span>
                                      : {answer.answer}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500">No custom field answers.</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
