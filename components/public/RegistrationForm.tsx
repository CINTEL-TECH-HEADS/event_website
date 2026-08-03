//FE1 registration form — fully organizer-driven. It renders ONLY the fields the
// organizer configured for this event (form_fields with applies_to='registration'),
// plus the team-name/group-code block for team creation. Core identity
// (name/email/phone) is derived from the configured standard fields (field_key)
// or the participant's profile/account — no hard-coded inputs.

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { EventWithFields, FormField } from '@/types'
import { DynamicFormRenderer } from '@/components/forms/DynamicFormRenderer'
import { registrationSchema } from '@/lib/validators/registration'

type RegistrationFormValues = {
  event_id: string
  registration_type: 'solo' | 'team'
  team_name?: string
  answers?: Record<string, string | number | boolean>
}

const inputClass =
  'w-full rounded-2xl border border-[#243B72] bg-[#07101f] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#F5E62D] focus:ring-4 focus:ring-[#F5E62D]/10 disabled:bg-[#0b1736] disabled:text-slate-500'

const clientSchema = z.object({
  event_id: z.string().uuid(),
  registration_type: z.enum(['solo', 'team']),
  team_name: z.string().optional(),
  answers: z
    .record(z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
})

function buildAnswers(
  fields: FormField[],
  values?: Record<string, string | number | boolean>
) {
  return fields
    .map((field) => ({ field_id: field.id, answer: values?.[field.id]?.toString() ?? '' }))
    .filter((x) => x.answer)
}

export function RegistrationForm({
  event,
  disabled = false,
  prefill = null,
  seeking = false,
  forceTeam = false,
}: {
  event: EventWithFields
  disabled?: boolean
  prefill?: Record<string, any> | null
  // "Find a team" mode: register as an open team-of-one (auto-named) and go to
  // the matchmaking view instead of the team management page.
  seeking?: boolean
  // Force a team submission even on a `both` event (the "Create a team" choice).
  forceTeam?: boolean
}) {
  const router = useRouter()

  const initialType = event.registration_mode === 'team' ? 'team' : 'solo'

  const [submitError, setSubmitError] = useState<string | null>(null)

  const registrationFields = event.form_fields.filter(
    (field) => field.applies_to === 'registration'
  )

  // Pre-fill fields that map to a profile key (field_key) from the profile.
  const prefillAnswers: Record<string, string> = {}
  if (prefill) {
    for (const f of registrationFields) {
      const v = f.field_key ? prefill[f.field_key] : undefined
      if (v != null && v !== '') prefillAnswers[f.id] = String(v)
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      event_id: event.id,
      registration_type: initialType,
      team_name: '',
      answers: prefillAnswers,
    },
  })

  const registrationType = watch('registration_type')

  const teamMode =
    seeking || forceTeam || event.registration_mode === 'team' || registrationType === 'team'

  // Live team-name availability (unique per event) for the create flow.
  const teamName = watch('team_name')
  const [nameCheck, setNameCheck] = useState<{
    status: 'idle' | 'checking' | 'available' | 'taken'
    suggestion?: string | null
  }>({ status: 'idle' })

  useEffect(() => {
    if (seeking || !teamMode) return
    const name = (teamName ?? '').trim()
    if (name.length < 2) {
      setNameCheck({ status: 'idle' })
      return
    }
    setNameCheck({ status: 'checking' })
    const t = setTimeout(async () => {
      try {
        const { data } = await fetch(
          `/api/events/${event.id}/team-name-check?name=${encodeURIComponent(name)}`
        ).then((r) => r.json())
        setNameCheck(
          data?.available
            ? { status: 'available' }
            : { status: 'taken', suggestion: data?.suggestion }
        )
      } catch {
        setNameCheck({ status: 'idle' })
      }
    }, 400)
    return () => clearTimeout(t)
  }, [teamName, teamMode, seeking, event.id])

  // Map a field_key to its answer value (for deriving the leader identity).
  function answerForKey(
    values: RegistrationFormValues,
    key: string
  ): string | undefined {
    const field = registrationFields.find((f) => f.field_key === key)
    if (!field) return undefined
    const v = values.answers?.[field.id]
    return v != null && v !== '' ? String(v) : undefined
  }

  async function onSubmit(values: RegistrationFormValues) {
    if (disabled) return
    setSubmitError(null)

    // Derive core identity from configured standard fields, else the profile.
    // leader_email may be empty here — the server backfills it from the account.
    const leaderName =
      answerForKey(values, 'full_name') ?? prefill?.full_name ?? ''
    const leaderEmail =
      answerForKey(values, 'college_email') ??
      answerForKey(values, 'personal_email') ??
      prefill?.college_email ??
      prefill?.personal_email ??
      ''
    const leaderPhone = answerForKey(values, 'phone') ?? prefill?.phone ?? ''
    const registerNumber =
      answerForKey(values, 'register_number') ?? prefill?.register_number ?? ''

    const payload = {
      event_id: values.event_id,
      registration_type: teamMode ? 'team' : 'solo',
      leader_name: leaderName.trim(),
      leader_email: leaderEmail.trim(),
      leader_phone: leaderPhone.trim(),
      register_number: registerNumber.trim(),
      // Group-code model: creating a team registers just the creator; teammates
      // join later. "Find a team" auto-names an open team-of-one seeker.
      ...(teamMode
        ? {
            team_name: seeking
              ? `${(leaderName || 'My').trim()}'s team`
              : (values.team_name?.trim() ?? ''),
            members: [],
            seeking,
          }
        : {}),
      answers: buildAnswers(registrationFields, values.answers),
    }

    const parsed = registrationSchema.safeParse(payload)
    if (!parsed.success) {
      setSubmitError(parsed.error.errors[0]?.message ?? 'Please review your form.')
      return
    }

    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      const { data, error } = await res.json()
      if (error) {
        setSubmitError(error)
        return
      }

      // Silently keep the participant's profile in sync (only what we captured).
      fetch('/api/participant/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(leaderName ? { full_name: leaderName } : {}),
          ...(leaderPhone ? { phone: leaderPhone } : {}),
          ...(registerNumber ? { register_number: registerNumber } : {}),
        }),
      }).catch(() => {})

      // Paid confirmed registration → payment step before the pass.
      if (data.requires_payment) {
        router.push(`/participant/portal/events/${data.registration_id}/pay`)
        return
      }

      router.push(
        teamMode
          ? seeking
            ? `/participant/portal/events/${data.registration_id}/find`
            : `/participant/portal/events/${data.registration_id}/team`
          : `/confirmation/${data.registration_id}`
      )
    } catch {
      setSubmitError('Submission failed.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input type="hidden" {...register('event_id')} />
      <input type="hidden" {...register('registration_type')} />

      {/* Organizer-configured fields */}
      {registrationFields.length > 0 ? (
        <div className="rounded-2xl border border-[#243B72] bg-[#0f1d36] p-5">
          <h2 className="text-lg font-semibold text-white">Your Details</h2>
          <div className="mt-4">
            <DynamicFormRenderer
              fields={registrationFields}
              register={register}
              errors={errors as any}
              setValue={setValue}
            />
          </div>
        </div>
      ) : (
        <p className="rounded-2xl border border-white/10 bg-[#0f1d36] px-4 py-4 text-sm text-slate-300">
          No additional details required — just confirm your registration below.
        </p>
      )}

      {teamMode ? (
        <div className="rounded-2xl border border-[#243B72] bg-[#0f1d36] p-5">
          <h2 className="text-lg font-semibold text-white">Team Details</h2>

          {seeking ? (
            <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-sm text-amber-100/80">
              You&apos;ll be added to this event as <strong>looking for a team</strong>. Teams short of
              members can invite you, and you can request to join open teams — a team forms once one side
              accepts.
            </p>
          ) : (
            <>
              <label className="mt-4 block">
                <span className="mb-2 block text-sm text-slate-300">Team name</span>
                <input
                  {...register('team_name')}
                  className={inputClass}
                  placeholder="Enter your team name"
                />
                {nameCheck.status === 'checking' && (
                  <p className="mt-1.5 text-xs text-slate-400">Checking availability…</p>
                )}
                {nameCheck.status === 'available' && (
                  <p className="mt-1.5 text-xs text-emerald-400">✓ Available</p>
                )}
                {nameCheck.status === 'taken' && (
                  <p className="mt-1.5 text-xs text-red-300">
                    Taken.
                    {nameCheck.suggestion && (
                      <>
                        {' '}Try{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setValue('team_name', nameCheck.suggestion!)
                            setNameCheck({ status: 'available' })
                          }}
                          className="font-semibold text-amber-300 underline underline-offset-2"
                        >
                          {nameCheck.suggestion}
                        </button>
                      </>
                    )}
                  </p>
                )}
              </label>

              <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-sm text-amber-100/80">
                You&apos;ll create the team now and get a shareable <strong>group code</strong>. Teammates
                sign in and enter the code (or request to join from the Team Finder) — no need to add them
                here.
              </p>
            </>
          )}
        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {submitError}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || disabled}
        className="w-full rounded-2xl bg-[#F5E62D] px-5 py-4 text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:brightness-110 disabled:bg-slate-700 disabled:text-white"
      >
        {disabled ? 'Registration Closed' : isSubmitting ? 'Submitting...' : 'Complete Registration'}
      </button>
    </form>
  )
}
