// Owner: FE2 - Manage event organizers, sub-admins, and judges
'use client'

import { useEffect, useState } from 'react'
import {
  Shield,
  Trash2,
  UserPlus,
} from 'lucide-react'

import {
  EventOrganizer,
  OrganizerRole,
  Profile,
} from '@/types'

interface Props {
  eventId: string
}

interface OrganizerWithProfile
  extends EventOrganizer {
  profile?: Profile
}

const ROLE_LABELS: Record<
  OrganizerRole,
  string
> = {
  owner: 'Owner',
  sub_admin: 'Sub-Admin',
  judge: 'Judge',
}

export function OrganizerManager({
  eventId,
}: Props) {
  const [organizers, setOrganizers] =
    useState<
      OrganizerWithProfile[]
    >([])

  const [loading, setLoading] =
    useState(true)

  const [newEmail, setNewEmail] =
    useState('')

  const [newRole, setNewRole] =
    useState<OrganizerRole>(
      'sub_admin'
    )

  const [adding, setAdding] =
    useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/events/${eventId}/organizers`
        )

        const { data } =
          await res.json()

        setOrganizers(
          data ?? []
        )
      } catch {
        console.error(
          'Failed loading organizers'
        )
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [eventId])

  async function handleAddOrganizer() {
    if (
      !newEmail.trim()
    ) {
      alert(
        'Email required'
      )
      return
    }

    setAdding(true)

    try {
      const res = await fetch(
        `/api/events/${eventId}/organizers`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            email:
              newEmail.trim(),
            role: newRole,
          }),
        }
      )

      const { data } =
        await res.json()

      setOrganizers(
        data ?? []
      )

      setNewEmail('')
      setNewRole(
        'sub_admin'
      )
    } catch {
      alert(
        'Failed to add organizer'
      )
    } finally {
      setAdding(false)
    }
  }

  async function handleRemoveOrganizer(
    organizerId: string
  ) {
    if (
      !confirm(
        'Remove this organizer?'
      )
    )
      return

    try {
      await fetch(
        `/api/events/${eventId}/organizers/${organizerId}`,
        {
          method:
            'DELETE',
        }
      )

      setOrganizers(
        organizers.filter(
          (
            item
          ) =>
            item.id !==
            organizerId
        )
      )
    } catch {
      alert(
        'Failed to remove organizer'
      )
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-slate-400">
        Loading access
        control...
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Add Access */}
      <section className="app-panel rounded-[1.8rem] p-5 sm:p-6">

        <div className="mb-5 flex items-center gap-3">

          <span className="rounded-2xl bg-[#0B1736] p-3 text-[#F5E62D]">
            <UserPlus
              size={18}
            />
          </span>

          <div>

            <h2 className="text-xl font-semibold text-white">
              Add Organizer
              Access
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Invite sub-admins
              or judges to this
              event.
            </p>

          </div>

        </div>

        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.85fr_0.6fr]">

          <input
            type="email"
            value={
              newEmail
            }
            onChange={(
              e
            ) =>
              setNewEmail(
                e.target
                  .value
              )
            }
            placeholder="organizer@example.com"
            className="app-input"
          />

          <select
            value={
              newRole
            }
            onChange={(
              e
            ) =>
              setNewRole(
                e.target
                  .value as OrganizerRole
              )
            }
            className="app-select"
          >
            <option value="sub_admin">
              Sub-Admin
            </option>

            <option value="judge">
              Judge
            </option>

          </select>

          <button
            onClick={
              handleAddOrganizer
            }
            disabled={
              adding
            }
            className="app-button-primary"
          >
            {adding
              ? 'Adding...'
              : 'Add Access'}
          </button>

        </div>

        <div className="mt-4 rounded-[1.35rem] border border-[#243B72] bg-[#0B1736] p-4 text-sm text-slate-300">

          <p>
            <strong className="text-[#F5E62D]">
              Sub-Admin:
            </strong>{' '}
            Can manage
            registrations,
            check-in, export,
            and certificates.
          </p>

          <p className="mt-2">
            <strong className="text-[#93C5FD]">
              Judge:
            </strong>{' '}
            Read-only access
            to participants.
          </p>

        </div>

      </section>

      {/* Team */}
      <section className="app-panel rounded-[1.8rem] p-5 sm:p-6">

        <div className="mb-5 flex items-center gap-3">

          <span className="rounded-2xl bg-[#0B1736] p-3 text-[#93C5FD]">
            <Shield
              size={18}
            />
          </span>

          <div>

            <h3 className="text-lg font-semibold text-white">
              Assigned Team
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Current access
              for this event.
            </p>

          </div>

        </div>

        {organizers.length ===
        0 ? (
          <div className="app-empty-state">
            No organizers
            assigned yet.
          </div>
        ) : (
          <div className="space-y-3">

            {organizers.map(
              (
                organizer,
                index
              ) => (
                <div
                  key={
                    organizer.id || `organizer-${index}`
                  }
                  className="flex flex-col gap-4 rounded-[1.35rem] border border-[#243B72] bg-[#10224A] p-4 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div>

                    <p className="font-semibold text-white">
                      {organizer
                        .profile
                        ?.full_name ||
                        'Unknown'}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      {
                        organizer
                          .profile
                          ?.email
                      }
                    </p>

                  </div>

                  <div className="flex items-center gap-3">

                    <span className="rounded-full bg-[#0B1736] px-3 py-1 text-xs font-semibold text-[#F5E62D]">
                      {
                        ROLE_LABELS[
                          organizer
                            .role
                        ]
                      }
                    </span>

                    {organizer.role !==
                      'owner' && (
                      <button
                        onClick={() =>
                          handleRemoveOrganizer(
                            organizer.id
                          )
                        }
                        className="app-button-secondary px-3 py-3 text-red-400"
                        title="Remove"
                      >
                        <Trash2
                          size={
                            16
                          }
                        />
                      </button>
                    )}

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </section>

    </div>
  )
}