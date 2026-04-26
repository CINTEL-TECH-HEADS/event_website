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

const inputClass =
  'w-full rounded-2xl border border-[#243B72] bg-[#07101f] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#F5E62D] focus:ring-4 focus:ring-[#F5E62D]/10 disabled:bg-[#0b1736] disabled:text-slate-500'

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
          <h3 className="text-sm font-semibold text-white">
            Team members
          </h3>

          <p className="text-xs text-slate-400">
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
          className="rounded-xl border border-[#F5E62D]/30 bg-[#F5E62D]/10 px-4 py-2 text-sm font-semibold text-[#F5E62D] transition hover:bg-[#F5E62D]/20"
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
              className="rounded-2xl border border-[#243B72] bg-[#0b172b] p-5"
            >

              <div className="mb-4 flex items-center justify-between">

                <p className="text-sm font-semibold text-white">
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
                  className="text-sm font-medium text-red-400 hover:text-red-300"
                >
                  Remove
                </button>

              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <label>

                  <span className="mb-2 block text-sm text-slate-300">
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

                  <span className="mb-2 block text-sm text-slate-300">
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
                <div className="mt-4 rounded-2xl border border-[#243B72] bg-[#0f1d36] p-4">

                  <p className="mb-3 text-sm font-medium text-slate-300">
                    Member-specific fields
                  </p>

                  <div
                    className="
                    [&_label]:mb-2
                    [&_label]:block
                    [&_label]:text-sm
                    [&_label]:text-slate-300

                    [&_input]:w-full
                    [&_input]:rounded-2xl
                    [&_input]:border
                    [&_input]:border-[#243B72]
                    [&_input]:bg-[#07101f]
                    [&_input]:px-4
                    [&_input]:py-3
                    [&_input]:text-white

                    [&_select]:w-full
                    [&_select]:rounded-2xl
                    [&_select]:border
                    [&_select]:border-[#243B72]
                    [&_select]:bg-[#07101f]
                    [&_select]:px-4
                    [&_select]:py-3
                    [&_select]:text-white

                    [&_textarea]:w-full
                    [&_textarea]:rounded-2xl
                    [&_textarea]:border
                    [&_textarea]:border-[#243B72]
                    [&_textarea]:bg-[#07101f]
                    [&_textarea]:px-4
                    [&_textarea]:py-3
                    [&_textarea]:text-white
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