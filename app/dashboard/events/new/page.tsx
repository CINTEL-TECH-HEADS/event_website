// Owner: FE2 - Create new event form with validation and error handling. Also includes a sidebar with next steps after event creation.
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
} from 'lucide-react'

import type { CreateEventPayload } from '@/lib/validators/event'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'

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
  const [openToExternal, setOpenToExternal] = useState(false)

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

      open_to_external: openToExternal,
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

    // Events open to other colleges have two registration forms to set up next.
    router.push(
      `/dashboard/events/${data.id}${openToExternal ? '?tab=form' : ''}`
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
        className="app-panel p-6 sm:p-10"
      >

        <div className="mb-8">
          <DashboardPageHeader
            icon={CalendarPlus}
            kicker="New event"
            title="Create an event"
            description="Save it as a draft first. You can add custom fields and organizers, then publish when it’s ready."
          />
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6"
        >

          {/* Inputs */}
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

  <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">
    Capacity
  </label>

  <input
    name="capacity"
    type="number"
    placeholder="Enter capacity"
    className="app-input"
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
                <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">
                  Min team size
                </label>
                <input
                  name="min_team_size"
                  type="number"
                  min={2}
                  defaultValue={2}
                  required
                  className="app-input"
                />
              </div>
              <div>
                <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">
                  Max team size
                </label>
                <input
                  name="max_team_size"
                  type="number"
                  min={2}
                  defaultValue={4}
                  required
                  className="app-input"
                />
              </div>
            </div>
          )}

          {/* Paid event + Waitlist toggles */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border-2 border-border bg-panel-muted p-4">
              <label className="flex items-center gap-3 text-sm font-bold uppercase tracking-wide text-foreground">
                <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} className="h-4 w-4 accent-accent" />
                Paid event
              </label>
              {isPaid && (
                <div className="mt-3">
                  <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Fee (₹)</label>
                  <input name="fee" type="number" min={1} defaultValue={100} required
                    className="app-input" />
                </div>
              )}
            </div>

            <div className="rounded-xl border-2 border-border bg-panel-muted p-4">
              <label className="flex items-center gap-3 text-sm font-bold uppercase tracking-wide text-foreground">
                <input type="checkbox" checked={hasWaitlist} onChange={(e) => setHasWaitlist(e.target.checked)} className="h-4 w-4 accent-accent" />
                Enable waitlist
              </label>
              {hasWaitlist && (
                <div className="mt-3">
                  <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Waitlist spots</label>
                  <input name="waitlist_capacity" type="number" min={1} defaultValue={10} required
                    className="app-input" />
                </div>
              )}
              <p className="mt-2 text-xs font-medium text-foreground-soft">Requires a capacity. When full, extra registrants join the waitlist.</p>
            </div>

            <div className="rounded-xl border-2 border-border bg-panel-muted p-4 sm:col-span-2">
              <label className="flex items-center gap-3 text-sm font-bold uppercase tracking-wide text-foreground">
                <input type="checkbox" checked={openToExternal} onChange={(e) => setOpenToExternal(e.target.checked)} className="h-4 w-4 accent-accent" />
                Open to students from other colleges
              </label>
              <p className="mt-2 text-xs font-medium text-foreground-soft">
                Off: only SRM IST students can see and register. On: students from other colleges can too.
              </p>
            </div>
          </div>

          {/* Payment method (paid events) */}
          {isPaid && (
            <div className="rounded-xl border-2 border-border bg-panel-muted p-4">
              <p className="mb-1 text-sm font-bold uppercase tracking-wide text-foreground">Payment method</p>
              <p className="mb-3 text-xs font-medium text-foreground-soft">
                Participants pay to these details and submit proof; you verify each payment in the Payments tab. You can switch method any time.
              </p>
              <div className="mb-4 inline-flex flex-wrap gap-2">
                {(['upi', 'bank'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`rounded-full border-2 px-4 py-2 font-tech text-xs font-bold uppercase tracking-widest transition-all duration-200 ease-out ${
                      paymentMethod === m
                        ? 'border-border bg-accent text-white shadow-sm'
                        : 'border-border bg-panel text-foreground-soft hover:text-foreground'
                    }`}
                  >
                    {m === 'upi' ? 'UPI ID' : 'Bank transfer'}
                  </button>
                ))}
              </div>

              {paymentMethod === 'upi' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input name="upi_id" placeholder="UPI ID (e.g. cintel@oksbi)" required
                    className="app-input" />
                  <input name="upi_payee_name" placeholder="Payee name (shown to payer)"
                    className="app-input" />
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input name="bank_account_name" placeholder="Account holder name" required
                    className="app-input" />
                  <input name="bank_account_number" placeholder="Account number" required
                    className="app-input" />
                  <input name="bank_ifsc" placeholder="IFSC code" required
                    className="app-input" />
                  <input name="bank_name" placeholder="Bank name"
                    className="app-input" />
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
            <div className="rounded-xl border-2 border-l-8 border-border border-l-brand bg-panel px-5 py-4 text-sm font-medium text-foreground">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex flex-col gap-4 border-t-2 border-border pt-6 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-sm font-medium text-foreground-soft">
              You can edit all
              details later.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="app-button-primary"
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

        <div className="rounded-2xl border-2 border-border bg-panel p-6 shadow-sm">
          <h2 className="font-display text-sm uppercase tracking-wide text-foreground">After you create it</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm font-medium text-foreground-soft">
            <li>Add the registration fields you need (Custom fields tab). Events open to other colleges get a second form for those students.</li>
            <li>Give other organizers access (Access control tab).</li>
            <li>Publish the event to open registration.</li>
          </ol>
        </div>

      </aside>

    </div>
  )
}