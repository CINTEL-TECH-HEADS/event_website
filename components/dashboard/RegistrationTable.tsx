// Owner: FE2 - Registrations table with search, filters, and bulk actions
'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import { ChevronDown, Mail, Search, Users } from 'lucide-react'
import { RegistrationStatus, RegistrationWithDetails } from '@/types'

interface Props {
  eventId: string
  organizerId: string
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
  }, [loadRegistrations])

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
        'app-badge-brand',
    }

    return (
      styles[status] ??
      'app-badge-neutral'
    )
  }

  if (loading) {
    return (
      <div className="rounded-[1.75rem] border border-[#243B72] bg-[#10224A] p-5 shadow-xl">
        <div className="h-12 animate-pulse rounded-xl bg-[#0B1736]" />
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Filters */}
      <section className="rounded-[1.75rem] border border-[#243B72] bg-[#10224A] p-4 shadow-xl transition-all duration-300 hover:-translate-y-1">

        <div className="grid gap-3 lg:grid-cols-[1.6fr_0.8fr_0.8fr]">

          <label className="relative block">

            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
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
      <section className="overflow-hidden rounded-[1.75rem] border border-[#243B72] bg-[#10224A] shadow-2xl transition-all duration-300 hover:-translate-y-1">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-[#0B1736] text-xs uppercase tracking-widest text-slate-300">

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
                  Date
                </th>
              </tr>

            </thead>

            <tbody>

              {registrations.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6"
                  >
                    <div className="rounded-2xl border border-dashed border-[#243B72] bg-[#0B1736] p-8 text-center text-slate-400">
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
                        className="cursor-pointer border-t border-[#243B72] transition hover:bg-[#162D5D]"
                        onClick={() =>
                          setExpandedId(
                            expandedId ===
                              registration.id
                              ? null
                              : registration.id
                          )
                        }
                      >

                        <td className="px-4 py-4 font-mono text-xs text-slate-400">
                          {
                            registration.display_id
                          }
                        </td>

                        <td className="px-4 py-4 font-bold text-white">
                          {
                            registration.leader_name
                          }
                        </td>

                        <td className="px-4 py-4 text-sm text-[#93C5FD]">
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
                          <span
                            className={`app-badge ${getStatusBadge(
                              registration.status as RegistrationStatus
                            )}`}
                          >
                            {
                              registration.status
                            }
                          </span>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-400">
                          {new Date(
                            registration.registered_at
                          ).toLocaleDateString(
                            'en-IN'
                          )}
                        </td>

                      </tr>

                      {expandedId ===
                        registration.id && (
                        <tr className="bg-[#0B1736]">

                          <td
                            colSpan={6}
                            className="p-4"
                          >

                            <div className="grid gap-4 rounded-2xl border border-[#243B72] bg-[#10224A] p-4 lg:grid-cols-2">

                              <div>

                                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">

                                  <Users
                                    size={
                                      15
                                    }
                                    className="text-[#F5E62D]"
                                  />

                                  Team &
                                  Members

                                </div>

                                <p className="text-sm text-slate-300">
                                  {registration.team_name ??
                                    'Solo registration'}
                                </p>

                              </div>

                              <div>

                                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">

                                  <ChevronDown
                                    size={
                                      15
                                    }
                                    className="text-[#F5E62D]"
                                  />

                                  Details

                                </div>

                                <p className="text-sm text-slate-300">
                                  Clicked
                                  registration
                                  expanded.
                                </p>

                              </div>

                            </div>

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