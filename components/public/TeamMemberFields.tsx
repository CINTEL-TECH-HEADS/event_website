//FE1 team member fields component used within the registration form for events that allow multiple team members. This is a client component since it manages dynamic form state for adding/removing team members and their associated fields.

'use client'

import type {
  Dispatch,
  SetStateAction,
} from 'react'

import type {
  FormField,
} from '@/types'

import {
  DynamicFormRenderer,
} from '@/components/forms/DynamicFormRenderer'

import { RockShape } from '@/components/brand/RockShape'
import { Sparkle } from '@/components/brand/Starburst'

type MemberRow = {
  id: string
}

type Props = {
  memberRows: MemberRow[]
  setMemberRows: Dispatch<
    SetStateAction<
      MemberRow[]
    >
  >
  memberFields: FormField[]
  register: any
  errors: any
  disabled?: boolean
  getValues: any
  setValue: any
}

const inputClass = 'app-input'

function createMemberRow() {
  return {
    id:
      typeof crypto !==
        'undefined' &&
      typeof crypto.randomUUID ===
        'function'
        ? crypto.randomUUID()
        : `member-${Math.random()}`
  }
}

export function TeamMemberFields({
  memberRows,
  setMemberRows,
  memberFields,
  register,
  errors,
  disabled = false,
  getValues,
  setValue,
}: Props) {

  function addMember() {
    setMemberRows(
      (prev) => [
        ...prev,
        createMemberRow(),
      ]
    )

    const next =
      [
        ...(getValues(
          'members'
        ) ?? []),
      ]

    next.push({
      full_name: '',
      email: '',
      answers: {},
    })

    setValue(
      'members',
      next
    )
  }

  function removeMember(
    index: number
  ) {
    const nextRows =
      memberRows.filter(
        (
          _,
          i
        ) =>
          i !==
          index
      )

    setMemberRows(
      nextRows.length
        ? nextRows
        : [
            createMemberRow(),
          ]
    )

    const nextMembers =
      [
        ...(getValues(
          'members'
        ) ?? []),
      ].filter(
        (
          _,
          i
        ) =>
          i !==
          index
      )

    setValue(
      'members',
      nextMembers.length
        ? nextMembers
        : [
            {
              full_name:
                '',
              email:
                '',
              answers:
                {},
            },
          ]
    )
  }

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between">

        <div>
          <h3 className="font-display text-sm uppercase tracking-tight text-foreground">
            Team members
          </h3>

          <p className="text-xs font-medium text-foreground-soft">
            Add or remove members before submitting.
          </p>
        </div>

        <button
          type="button"
          onClick={
            addMember
          }
          disabled={
            disabled
          }
          className="rounded-full border-2 border-border bg-warning px-4 py-2 font-tech text-xs font-bold uppercase tracking-wider text-foreground shadow-sm transition duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
        >
          Add member
        </button>

      </div>

      <div className="space-y-4">

        {memberRows.map(
          (
            row,
            index
          ) => (
            <div
              key={
                row.id
              }
              className="relative rounded-2xl border-2 border-border bg-panel p-5"
            >
              {index % 3 === 1 ? (
                <Sparkle className="absolute right-3 top-3 h-4 w-4 text-primary-yellow" />
              ) : (
                <RockShape
                  variant={((index % 3) + 1) as 1 | 2 | 3}
                  fill={index % 3 === 0 ? '#D6294C' : '#14120F'}
                  className={`absolute right-3 top-3 h-4 w-4 ${index % 3 === 0 ? 'rotate-12' : '-rotate-6'}`}
                />
              )}

              <div className="mb-4 flex items-center justify-between">

                <p className="font-display text-xs uppercase tracking-tight text-foreground">
                  Member{' '}
                  {index +
                    1}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    removeMember(
                      index
                    )
                  }
                  disabled={
                    disabled
                  }
                  className="font-tech text-xs font-bold uppercase tracking-wider text-danger transition duration-200 hover:opacity-70"
                >
                  Remove
                </button>

              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <label>

                  <span className="mb-2 block font-tech text-xs font-bold uppercase tracking-wide text-foreground-soft">
                    Full name
                  </span>

                  <input
                    {...register(
                      `members.${index}.full_name`
                    )}
                    disabled={
                      disabled
                    }
                    className={
                      inputClass
                    }
                    placeholder="Member full name"
                  />

                </label>

                <label>

                  <span className="mb-2 block font-tech text-xs font-bold uppercase tracking-wide text-foreground-soft">
                    Email address
                  </span>

                  <input
                    type="email"
                    {...register(
                      `members.${index}.email`
                    )}
                    disabled={
                      disabled
                    }
                    className={
                      inputClass
                    }
                    placeholder="member@example.com"
                  />

                </label>

              </div>

              {memberFields.length >
              0 ? (
                <div className="mt-4 rounded-xl border-2 border-border bg-panel-muted p-4">

                  <p className="mb-3 font-tech text-xs font-bold uppercase tracking-wide text-foreground-soft">
                    Member-specific fields
                  </p>

                  <div
                    className="
                    [&_label]:mb-2
                    [&_label]:block
                    [&_label]:font-tech
                    [&_label]:text-xs
                    [&_label]:font-bold
                    [&_label]:uppercase
                    [&_label]:tracking-wide
                    [&_label]:text-foreground-soft

                    [&_input]:app-input
                    [&_select]:app-select
                    [&_textarea]:app-textarea
                  "
                  >

                    <DynamicFormRenderer
                      fields={
                        memberFields
                      }
                      register={
                        register
                      }
                      errors={
                        errors
                      }
                      memberIndex={
                        index
                      }
                    />

                  </div>

                </div>
              ) : null}

            </div>
          )
        )}

      </div>

    </div>
  )
}