// Owner: FE2 - Create new event form with premium inputs, validation, and error handling. Also includes a sidebar with next steps after event creation.
'use client'

import { motion } from 'framer-motion'
import LuxuryInput from '@/components/dashboard/LuxuryInput'
import LuxuryTextarea from '@/components/dashboard/LuxuryTextarea'
import LuxuryDatePicker from '@/components/dashboard/LuxuryDatePicker'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  ArrowRight,
  CalendarPlus,
  Sparkles,
} from 'lucide-react'

import type { CreateEventPayload } from '@/lib/validators/event'

export default function NewEventPage() {
  const router = useRouter()

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [registrationMode, setRegistrationMode] =
    useState<'solo' | 'team' | 'both'>('solo')

  const isTeamMode = registrationMode !== 'solo'

  const [isPaid, setIsPaid] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'bank'>('upi')
  const [hasWaitlist, setHasWaitlist] = useState(false)

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    setLoading(true)
    setError(null)

    const form = new FormData(
      e.currentTarget
    )

    const payload: Partial<CreateEventPayload> = {
      title: form.get('title') as string,
      venue: form.get('venue') as string,
      starts_at: form.get('starts_at') as string,
      ends_at: form.get('ends_at') as string,
      registration_closes_at:
        form.get(
          'registration_closes_at'
        ) as string,

      capacity: form.get('capacity')
        ? Number(
            form.get('capacity')
          )
        : null,

      description:
        form.get(
          'description'
        ) as string,

      event_type:
        form.get(
          'event_type'
        ) as CreateEventPayload['event_type'],

      registration_mode:
        form.get(
          'registration_mode'
        ) as CreateEventPayload['registration_mode'],

      min_team_size: isTeamMode && form.get('min_team_size')
        ? Number(form.get('min_team_size'))
        : null,

      max_team_size: isTeamMode && form.get('max_team_size')
        ? Number(form.get('max_team_size'))
        : null,

      fee: isPaid && form.get('fee') ? Number(form.get('fee')) : 0,

      payment_method: isPaid ? paymentMethod : null,
      upi_id: isPaid && paymentMethod === 'upi' ? (form.get('upi_id') as string) : null,
      upi_payee_name: isPaid && paymentMethod === 'upi' ? (form.get('upi_payee_name') as string) : null,
      bank_account_name: isPaid && paymentMethod === 'bank' ? (form.get('bank_account_name') as string) : null,
      bank_account_number: isPaid && paymentMethod === 'bank' ? (form.get('bank_account_number') as string) : null,
      bank_ifsc: isPaid && paymentMethod === 'bank' ? (form.get('bank_ifsc') as string) : null,
      bank_name: isPaid && paymentMethod === 'bank' ? (form.get('bank_name') as string) : null,

      waitlist_capacity:
        hasWaitlist && form.get('waitlist_capacity')
          ? Number(form.get('waitlist_capacity'))
          : null,
    }

    const res = await fetch(
      '/api/events',
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify(
          payload
        ),
      }
    )

    const {
      data,
      error,
    } = await res.json()

    if (error) {
      setError(error)
      setLoading(false)
      return
    }

    router.push(
      `/dashboard/events/${data.id}`
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_0.8fr]">

      {/* Main */}
      <motion.section
        initial={{
          opacity: 0,
          y: 30,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.45,
        }}
        className="app-panel  p-6 sm:p-10"
      >

        <div className="mb-10 space-y-4">

          <span className="inline-flex items-center gap-2 rounded-full bg-[#0B1736] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#F5E62D]">
            <CalendarPlus size={14} />
            Create New Event
          </span>

          <div>

            <h1 className="text-3xl font-bold text-white">
              Build your next
              successful event.
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
              Add event details,
              schedule, registrations,
              and capacity in one place.
            </p>

          </div>

        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6"
        >

          {/* Premium Inputs */}
<div className="grid gap-5 sm:grid-cols-2">

  <LuxuryInput
    name="title"
    label="Event Name"
    required
  />

  <LuxuryInput
    name="venue"
    label="Venue"
    required
  />

  {/* Row 1 */}
  <LuxuryDatePicker
    name="starts_at"
    label="Start Date"
  />

  <LuxuryDatePicker
    name="ends_at"
    label="End Date"
  />

  {/* Row 2 */}
  <LuxuryDatePicker
    name="registration_closes_at"
    label="Registration Close"
  />

  <div>

  <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">
    Capacity
  </label>

  <input
    name="capacity"
    type="number"
    placeholder="Enter capacity"
    className="w-full  border border-[#243B72] bg-[#07142E] px-5 py-4 text-white outline-none transition focus:border-[#F5E62D] focus:ring-2 focus:ring-[#F5E62D]/20"
  />

</div>

</div>

          {/* Dropdowns */}
          <div className="grid gap-5 sm:grid-cols-2">

            <select
              name="event_type"
              required
              className="app-select"
            >
              <option value="workshop">
                Workshop
              </option>

              <option value="seminar">
                Seminar
              </option>

              <option value="fest">
                Fest
              </option>

              <option value="hackathon">
                Hackathon
              </option>

              <option value="talk">
                Talk
              </option>

              <option value="other">
                Other
              </option>

            </select>

            <select
              name="registration_mode"
              required
              className="app-select"
              value={registrationMode}
              onChange={(e) =>
                setRegistrationMode(
                  e.target.value as 'solo' | 'team' | 'both'
                )
              }
            >
              <option value="solo">
                Solo
              </option>

              <option value="team">
                Team
              </option>

              <option value="both">
                Both
              </option>

            </select>

          </div>

          {/* Team size — only for team / both events */}
          {isTeamMode && (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Min team size
                </label>
                <input
                  name="min_team_size"
                  type="number"
                  min={2}
                  defaultValue={2}
                  required
                  className="w-full border border-[#243B72] bg-[#07142E] px-5 py-4 text-white outline-none transition focus:border-[#F5E62D] focus:ring-2 focus:ring-[#F5E62D]/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Max team size
                </label>
                <input
                  name="max_team_size"
                  type="number"
                  min={2}
                  defaultValue={4}
                  required
                  className="w-full border border-[#243B72] bg-[#07142E] px-5 py-4 text-white outline-none transition focus:border-[#F5E62D] focus:ring-2 focus:ring-[#F5E62D]/20"
                />
              </div>
            </div>
          )}

          {/* Paid event + Waitlist toggles */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-[#243B72] bg-[#0B1736] p-4">
              <label className="flex items-center gap-3 text-sm font-semibold text-slate-200">
                <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} className="accent-[#F5E62D]" />
                Paid event
              </label>
              {isPaid && (
                <div className="mt-3">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Fee (₹)</label>
                  <input name="fee" type="number" min={1} defaultValue={100} required
                    className="w-full border border-[#243B72] bg-[#07142E] px-5 py-3 text-white outline-none transition focus:border-[#F5E62D] focus:ring-2 focus:ring-[#F5E62D]/20" />
                </div>
              )}
            </div>

            <div className="border border-[#243B72] bg-[#0B1736] p-4">
              <label className="flex items-center gap-3 text-sm font-semibold text-slate-200">
                <input type="checkbox" checked={hasWaitlist} onChange={(e) => setHasWaitlist(e.target.checked)} className="accent-[#F5E62D]" />
                Enable waitlist
              </label>
              {hasWaitlist && (
                <div className="mt-3">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Waitlist spots</label>
                  <input name="waitlist_capacity" type="number" min={1} defaultValue={10} required
                    className="w-full border border-[#243B72] bg-[#07142E] px-5 py-3 text-white outline-none transition focus:border-[#F5E62D] focus:ring-2 focus:ring-[#F5E62D]/20" />
                </div>
              )}
              <p className="mt-2 text-xs text-slate-500">Requires a capacity. When full, extra registrants join the waitlist.</p>
            </div>
          </div>

          {/* Payment method (paid events) */}
          {isPaid && (
            <div className="border border-[#243B72] bg-[#0B1736] p-4">
              <p className="mb-1 text-sm font-semibold text-slate-200">Payment method</p>
              <p className="mb-3 text-xs text-slate-500">
                Participants pay to these details and submit proof; you verify each payment in the Payments tab. You can switch method any time.
              </p>
              <div className="mb-4 inline-flex overflow-hidden border border-[#243B72]">
                {(['upi', 'bank'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`px-4 py-2 text-sm font-semibold transition ${
                      paymentMethod === m ? 'bg-[#F5E62D] text-[#0B1736]' : 'bg-[#07142E] text-slate-300 hover:bg-[#132B59]'
                    }`}
                  >
                    {m === 'upi' ? 'UPI ID' : 'Bank transfer'}
                  </button>
                ))}
              </div>

              {paymentMethod === 'upi' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input name="upi_id" placeholder="UPI ID (e.g. cintel@oksbi)" required
                    className="w-full border border-[#243B72] bg-[#07142E] px-4 py-3 text-white outline-none transition focus:border-[#F5E62D]" />
                  <input name="upi_payee_name" placeholder="Payee name (shown to payer)"
                    className="w-full border border-[#243B72] bg-[#07142E] px-4 py-3 text-white outline-none transition focus:border-[#F5E62D]" />
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input name="bank_account_name" placeholder="Account holder name" required
                    className="w-full border border-[#243B72] bg-[#07142E] px-4 py-3 text-white outline-none transition focus:border-[#F5E62D]" />
                  <input name="bank_account_number" placeholder="Account number" required
                    className="w-full border border-[#243B72] bg-[#07142E] px-4 py-3 text-white outline-none transition focus:border-[#F5E62D]" />
                  <input name="bank_ifsc" placeholder="IFSC code" required
                    className="w-full border border-[#243B72] bg-[#07142E] px-4 py-3 text-white outline-none transition focus:border-[#F5E62D]" />
                  <input name="bank_name" placeholder="Bank name"
                    className="w-full border border-[#243B72] bg-[#07142E] px-4 py-3 text-white outline-none transition focus:border-[#F5E62D]" />
                </div>
              )}
            </div>
          )}

          {/* Textarea */}
          <LuxuryTextarea
            name="description"
            label="Description"
          />

          {error && (
            <div className=" border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex flex-col gap-4 border-t border-[#243B72] pt-6 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-sm text-slate-400">
              You can edit all
              details later.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2  bg-[#F5E62D] px-8 py-3 text-sm font-semibold text-[#0B1736] transition hover:bg-[#FFF27A]"
            >

              {loading
                ? 'Creating...'
                : 'Create Event'}

              {!loading && (
                <ArrowRight
                  size={16}
                />
              )}

            </button>

          </div>

        </form>

      </motion.section>

      {/* Side */}
      <aside className="space-y-4">

        <div className="app-panel  p-8">

          <div className="mb-6 flex flex-col gap-4">

            <span className="w-fit  bg-[#0B1736] p-3 text-[#93C5FD]">
              <Sparkles size={20} />
            </span>

            <div>

              <h2 className="text-xl font-bold text-white">
                After Creation
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Complete these next
                steps.
              </p>

            </div>

          </div>

          <div className="space-y-3 text-sm">

            <div className=" border border-[#243B72] bg-[#0B1736] px-4 py-3 text-slate-300">
              Configure custom
              registration fields
            </div>

            <div className=" border border-[#243B72] bg-[#0B1736] px-4 py-3 text-slate-300">
              Assign organizers
              and team members
            </div>

            <div className=" border border-[#243B72] bg-[#0B1736] px-4 py-3 text-slate-300">
              Publish and start
              registrations
            </div>

          </div>

        </div>

      </aside>

    </div>
  )
}