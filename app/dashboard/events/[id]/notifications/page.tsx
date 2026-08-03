// Owner: FE2 - Notifications page
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Loader2,
  Mail,
  Send,
  Bell,
  Search,
} from 'lucide-react'

type NotificationType =
  | 'confirmation'
  | 'reminder_24h'
  | 'reminder_1h'
  | 'venue_change'
  | 'time_change'
  | 'cancellation'

type Channel = 'email'

const NOTIFICATION_TYPES = [
  {
    value: 'confirmation',
    label: 'Confirmation Email',
  },
  {
    value: 'reminder_24h',
    label: '24-Hour Reminder',
  },
  {
    value: 'reminder_1h',
    label: '1-Hour Reminder',
  },
  {
    value: 'venue_change',
    label: 'Venue Change Alert',
  },
  {
    value: 'time_change',
    label: 'Time Change Alert',
  },
  {
    value: 'cancellation',
    label: 'Cancellation Notice',
  },
] as const

const CHANNELS = [
  {
    value: 'email',
    label: 'Email',
    icon: Mail,
  },
] as const

export default function NotificationsPage() {
  const { id } =
    useParams<{ id: string }>()

  const [
    notificationType,
    setNotificationType,
  ] =
    useState<NotificationType>(
      'confirmation'
    )

  const [channel, setChannel] =
    useState<Channel>('email')

  const [
    customMessage,
    setCustomMessage,
  ] = useState('')

  const [
    selectedRegistrations,
    setSelectedRegistrations,
  ] = useState<
    'all' | 'custom'
  >('all')

  const [sending, setSending] =
    useState(false)

  const [sentCount, setSentCount] =
    useState<number | null>(
      null
    )

  // Recipient picker (custom selection)
  const [regList, setRegList] = useState<any[]>([])
  const [regSearch, setRegSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (selectedRegistrations !== 'custom' || regList.length > 0) return
    fetch(`/api/events/${id}/registrations?status=confirmed`)
      .then((r) => r.json())
      .then((j) => setRegList(j.data ?? []))
      .catch(() => {})
  }, [selectedRegistrations, id, regList.length])

  function toggleId(rid: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(rid) ? next.delete(rid) : next.add(rid)
      return next
    })
  }

  const filteredRegs = regList.filter((r) => {
    const q = regSearch.toLowerCase()
    return !q || r.leader_name?.toLowerCase().includes(q) || r.leader_email?.toLowerCase().includes(q)
  })

  async function handleSendNotification() {
    if (
      !confirm(
        `Send ${channel} notification to selected participants?`
      )
    ) {
      return
    }

    setSending(true)
    setSentCount(null)

    try {
      const res = await fetch(
        '/api/notifications',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            event_id: id,
            type: notificationType,
            ...(customMessage && {
              custom_message:
                customMessage,
            }),
            target:
              selectedRegistrations ===
              'all'
                ? 'all_confirmed'
                : 'custom',
            ...(selectedRegistrations === 'custom' && {
              registration_ids: [...selectedIds],
            }),
          }),
        }
      )

      const json = await res.json()
      if (!res.ok) {
        alert(json?.error ?? 'Failed to send notifications.')
        return
      }

      setSentCount(json.data?.sent_count ?? 0)
      setCustomMessage('')
    } catch {
      alert(
        'Failed to send notifications.'
      )
    } finally {
      setSending(false)
    }
  }

  const optionClass = (
    active: boolean
  ) =>
    `cursor-pointer  border px-4 py-4 transition ${
      active
        ? 'border-[#F5E62D] bg-[#0B1736] text-[#F5E62D]'
        : 'border-[#243B72] bg-[#10224A] text-slate-300 hover:border-[#F5E62D] hover:text-white'
    }`

  return (
    <div className="space-y-6">

      {/* Hero */}
      <section className="app-panel  px-6 py-7 sm:px-8">

        <span className="inline-flex items-center gap-2 rounded-full bg-[#0B1736] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#F5E62D]">
          <Bell size={14} />
          Notifications
        </span>

        <h1 className="mt-5 text-3xl font-bold text-white">
          Reach participants
          quickly and clearly.
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          Send reminders,
          confirmations,
          updates, and urgent
          announcements instantly.
        </p>

      </section>

      {/* Main */}
      <section className="app-panel  p-6">

        <div className="grid gap-6">

          {/* Type */}
          <div>

            <label className="mb-3 block text-sm font-semibold text-slate-300">
              Notification Type
            </label>

            <div className="grid gap-3 md:grid-cols-2">

              {NOTIFICATION_TYPES.map(
                (type) => (
                  <label
                    key={
                      type.value
                    }
                    className={optionClass(
                      notificationType ===
                        type.value
                    )}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      checked={
                        notificationType ===
                        type.value
                      }
                      onChange={() =>
                        setNotificationType(
                          type.value
                        )
                      }
                    />

                    <span className="text-sm font-semibold">
                      {
                        type.label
                      }
                    </span>

                  </label>
                )
              )}

            </div>

          </div>

          {/* Channel */}
          <div>

            <label className="mb-3 block text-sm font-semibold text-slate-300">
              Channel
            </label>

            <div className="grid gap-3 sm:grid-cols-2">

              {CHANNELS.map(
                (item) => {
                  const Icon =
                    item.icon

                  return (
                    <label
                      key={
                        item.value
                      }
                      className={optionClass(
                        channel ===
                          item.value
                      )}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        checked={
                          channel ===
                          item.value
                        }
                        onChange={() =>
                          setChannel(
                            item.value
                          )
                        }
                      />

                      <div className="flex items-center gap-2">

                        <Icon
                          size={
                            16
                          }
                        />

                        <span className="text-sm font-semibold">
                          {
                            item.label
                          }
                        </span>

                      </div>

                    </label>
                  )
                }
              )}

            </div>

          </div>

          {/* Recipients */}
          <div>

            <label className="mb-3 block text-sm font-semibold text-slate-300">
              Recipients
            </label>

            <div className="grid gap-3 sm:grid-cols-2">

              {[
                {
                  value:
                    'all',
                  label:
                    'All confirmed registrations',
                },
                {
                  value:
                    'custom',
                  label:
                    'Custom selection from registrations page',
                },
              ].map(
                (item) => (
                  <label
                    key={
                      item.value
                    }
                    className={optionClass(
                      selectedRegistrations ===
                        item.value
                    )}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      checked={
                        selectedRegistrations ===
                        item.value
                      }
                      onChange={() =>
                        setSelectedRegistrations(
                          item.value as
                            | 'all'
                            | 'custom'
                        )
                      }
                    />

                    <span className="text-sm font-semibold">
                      {
                        item.label
                      }
                    </span>

                  </label>
                )
              )}

            </div>

            {/* Participant picker (custom selection) */}
            {selectedRegistrations === 'custom' && (
              <div className="mt-3 border border-[#243B72] bg-[#0B1736] p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="relative block flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={regSearch}
                      onChange={(e) => setRegSearch(e.target.value)}
                      placeholder="Search by name or email…"
                      className="app-input pl-9 py-2 text-sm"
                    />
                  </label>
                  <span className="shrink-0 rounded-full bg-[#10224A] px-3 py-1.5 text-xs font-semibold text-[#F5E62D]">
                    {selectedIds.size} selected
                  </span>
                </div>
                <div className="max-h-64 space-y-1 overflow-y-auto">
                  {filteredRegs.length === 0 ? (
                    <p className="px-2 py-4 text-center text-xs text-slate-400">No confirmed registrations.</p>
                  ) : (
                    filteredRegs.map((r) => (
                      <label key={r.id} className="flex cursor-pointer items-center gap-3 border border-transparent px-2 py-2 text-sm hover:bg-[#10224A]">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(r.id)}
                          onChange={() => toggleId(r.id)}
                          className="accent-[#F5E62D]"
                        />
                        <span className="font-semibold text-white">{r.leader_name}</span>
                        <span className="truncate text-xs text-[#93C5FD]">{r.leader_email}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Message */}
          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Custom Message
            </label>

            <textarea
              rows={5}
              maxLength={500}
              value={
                customMessage
              }
              onChange={(
                e
              ) =>
                setCustomMessage(
                  e.target
                    .value
                )
              }
              placeholder="Add optional message..."
              className="app-textarea"
            />

            <p className="mt-2 text-xs text-slate-400">
              {
                customMessage.length
              }
              /500 characters
            </p>

          </div>

          {/* Action */}
          <div className="flex flex-col gap-3 border-t border-[#243B72] pt-5 sm:flex-row sm:items-center sm:justify-between">

            <button
              onClick={
                handleSendNotification
              }
              disabled={
                sending
              }
              className="inline-flex items-center justify-center gap-2  bg-[#F5E62D] px-6 py-3 text-sm font-semibold text-[#0B1736] transition hover:bg-[#FFF27A]"
            >

              {sending ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Send
                  size={16}
                />
              )}

              {sending
                ? 'Sending...'
                : 'Send Notification'}

            </button>

            {sentCount !==
              null && (
              <span className="rounded-full bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-400">
                Sent to{' '}
                {
                  sentCount
                }{' '}
                participant
                {sentCount !==
                1
                  ? 's'
                  : ''}
              </span>
            )}

          </div>

        </div>

      </section>

      {/* Note */}
      <div className=" border border-[#243B72] bg-[#10224A] px-5 py-4 text-sm text-slate-300">
        Notifications are sent
        immediately. Please
        review content before
        sending.
      </div>

    </div>
  )
}