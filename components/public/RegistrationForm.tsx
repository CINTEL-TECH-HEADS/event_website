//FE1 registration form component used on the event details page. This is a client component since it needs to fetch form fields for the registration form, but it receives all other event details as a prop from the server component page. The server component fetches the event with its confirmed/waitlist counts using a single optimized query, so we don't have to worry about N+1 queries here when rendering the details.

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type {
  EventWithFields,
  FormField,
} from '@/types'

import {
  DynamicFormRenderer,
} from '@/components/forms/DynamicFormRenderer'

import {
  registrationSchema,
} from '@/lib/validators/registration'

import {
  TeamMemberFields,
} from './TeamMemberFields'

type RegistrationFormValues = {
  event_id: string
  registration_type: 'solo' | 'team'

  leader_name: string
  leader_email: string
  leader_phone: string
  register_number: string

  team_name?: string

  answers?: Record<
    string,
    string | number | boolean
  >

  members: Array<{
    full_name: string
    email: string
    answers?: Record<
      string,
      string | number | boolean
    >
  }>
}

const inputClass =
  'w-full rounded-2xl border border-[#243B72] bg-[#07101f] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#F5E62D] focus:ring-4 focus:ring-[#F5E62D]/10 disabled:bg-[#0b1736] disabled:text-slate-500'

const clientSchema = z.object({
  event_id: z.string().uuid(),

  registration_type: z.enum([
    'solo',
    'team',
  ]),

  leader_name: z.string().min(2),

  leader_email: z.string().email(),

  leader_phone: z
    .string()
    .regex(/^[6-9]\d{9}$/),

  register_number: z
    .string()
    .min(5),

  team_name: z.string().optional(),

  answers: z
    .record(
      z.union([
        z.string(),
        z.number(),
        z.boolean(),
      ])
    )
    .optional(),

  members: z.array(
    z.object({
      full_name:
        z.string().optional(),

      email:
        z.string().optional(),

      answers: z
        .record(
          z.union([
            z.string(),
            z.number(),
            z.boolean(),
          ])
        )
        .optional(),
    })
  ),
})

function buildAnswers(
  fields: FormField[],
  values?: Record<
    string,
    string | number | boolean
  >
) {
  return fields
    .map((field) => ({
      field_id: field.id,
      answer:
        values?.[
          field.id
        ]?.toString() ?? '',
    }))
    .filter(
      (x) => x.answer
    )
}

function createMemberRow() {
  return {
    id:
      typeof crypto !==
        'undefined' &&
      typeof crypto.randomUUID ===
        'function'
        ? crypto.randomUUID()
        : `member-${Math.random()}`,
  }
}

export function RegistrationForm({
  event,
  disabled = false,
}: {
  event: EventWithFields
  disabled?: boolean
}) {
  const router = useRouter()

  const initialType =
    event.registration_mode ===
    'team'
      ? 'team'
      : 'solo'

  const [memberRows, setMemberRows] =
    useState([
      {
        id:
          createMemberRow()
            .id,
      },
    ])

  const [
    submitError,
    setSubmitError,
  ] = useState<
    string | null
  >(null)

  const teamFields =
    event.form_fields.filter(
      (field) =>
        field.applies_to ===
        'registration'
    )

  const memberFields =
    event.form_fields.filter(
      (field) =>
        field.applies_to ===
        'member'
    )

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
    setValue,
    getValues,
    watch,
  } =
    useForm<RegistrationFormValues>(
      {
        resolver:
          zodResolver(
            clientSchema
          ),

        defaultValues: {
          event_id:
            event.id,

          registration_type:
            initialType,

          leader_name:
            '',

          leader_email:
            '',

          leader_phone:
            '',

          register_number:
            '',

          team_name:
            '',

          answers:
            {},

          members: [
            {
              full_name:
                '',
              email:
                '',
              answers:
                {},
            },
          ],
        },
      }
    )

  const registrationType =
    watch(
      'registration_type'
    )

  const teamMode =
    event.registration_mode ===
      'team' ||
    registrationType ===
      'team'

  async function onSubmit(
    values: RegistrationFormValues
  ) {
    if (disabled) return

    setSubmitError(
      null
    )

    const payload = {
      event_id:
        values.event_id,

      registration_type:
        teamMode
          ? 'team'
          : 'solo',

      leader_name:
        values.leader_name.trim(),

      leader_email:
        values.leader_email.trim(),

      leader_phone:
        values.leader_phone.trim(),

      register_number:
        values.register_number.trim(),

      ...(teamMode
        ? {
            team_name:
              values.team_name?.trim() ??
              '',

            members:
              values.members.map(
                (
                  member
                ) => ({
                  full_name:
                    member.full_name.trim(),

                  email:
                    member.email.trim(),

                  answers:
                    buildAnswers(
                      memberFields,
                      member.answers
                    ),
                })
              ),
          }
        : {}),

      answers:
        buildAnswers(
          teamFields,
          values.answers
        ),
    }

    const parsed =
      registrationSchema.safeParse(
        payload
      )

    if (
      !parsed.success
    ) {
      setSubmitError(
        'Please review your form.'
      )
      return
    }

    try {
      const res =
        await fetch(
          '/api/registrations',
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                parsed.data
              ),
          }
        )

      const {
        data,
        error,
      } =
        await res.json()

      if (error) {
        setSubmitError(
          error
        )
        return
      }

      router.push(
        `/confirmation/${data.registration_id}`
      )
    } catch {
      setSubmitError(
        'Submission failed.'
      )
    }
  }

  return (
    <form
      onSubmit={handleSubmit(
        onSubmit
      )}
      className="space-y-6"
    >
      <input
        type="hidden"
        {...register(
          'event_id'
        )}
      />

      <input
        type="hidden"
        {...register(
          'registration_type'
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">

        <label>
          <span className="mb-2 block text-sm text-slate-300">
            Full name
          </span>

          <input
            {...register(
              'leader_name'
            )}
            className={
              inputClass
            }
            placeholder="Your full name"
          />
        </label>

        <label>
          <span className="mb-2 block text-sm text-slate-300">
            Email
          </span>

          <input
            type="email"
            {...register(
              'leader_email'
            )}
            className={
              inputClass
            }
            placeholder="you@example.com"
          />
        </label>

      </div>

      <label>
        <span className="mb-2 block text-sm text-slate-300">
          Phone number
        </span>

        <input
          {...register(
            'leader_phone'
          )}
          className={
            inputClass
          }
          placeholder="10-digit mobile number"
        />
      </label>

      <label>
        <span className="mb-2 block text-sm text-slate-300">
          Register Number
        </span>

        <input
          {...register(
            'register_number'
          )}
          className={
            inputClass
          }
          placeholder="Enter register number"
        />
      </label>

      {teamFields.length >
      0 ? (
        <div className="rounded-2xl border border-[#243B72] bg-[#0f1d36] p-5">

          <h2 className="text-lg font-semibold text-white">
            Additional Details
          </h2>

          <div className="mt-4">
            <DynamicFormRenderer
              fields={
                teamFields
              }
              register={
                register
              }
              errors={
                errors as any
              }
            />
          </div>

        </div>
      ) : null}

      {teamMode ? (
        <div className="rounded-2xl border border-[#243B72] bg-[#0f1d36] p-5">

          <h2 className="text-lg font-semibold text-white">
            Team Details
          </h2>

          <label className="mt-4 block">

            <span className="mb-2 block text-sm text-slate-300">
              Team name
            </span>

            <input
              {...register(
                'team_name'
              )}
              className={
                inputClass
              }
              placeholder="Enter your team name"
            />

          </label>

          <TeamMemberFields
            memberRows={
              memberRows
            }
            setMemberRows={
              setMemberRows
            }
            memberFields={
              memberFields
            }
            register={
              register
            }
            errors={
              errors
            }
            disabled={
              isSubmitting ||
              disabled
            }
            getValues={
              getValues
            }
            setValue={
              setValue
            }
          />

        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {
            submitError
          }
        </div>
      ) : null}

      <button
        type="submit"
        disabled={
          isSubmitting ||
          disabled
        }
        className="w-full rounded-2xl bg-[#F5E62D] px-5 py-4 text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:brightness-110 disabled:bg-slate-700 disabled:text-white"
      >
        {disabled
          ? 'Registration Closed'
          : isSubmitting
          ? 'Submitting...'
          : 'Complete Registration'}
      </button>

    </form>
  )
}