'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface Props {
  label: string
  // Set for use inside a <form>: submits the picked time as an ISO string.
  name?: string
  // Pass value + onChange to control it (e.g. editing an existing event);
  // leave them out and it keeps its own state, starting empty.
  value?: Date | null
  onChange?: (date: Date | null) => void
}

export default function LuxuryDatePicker({
  label,
  name,
  value,
  onChange,
}: Props) {
  const [own, setOwn] =
    useState<Date | null>(null)
  const controlled = value !== undefined
  const date = controlled ? value : own

  return (
    <div className="relative">

      <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">
        {label}
      </label>

      <DatePicker
        selected={date}
        onChange={(val: Date | null) => {
          if (!controlled) setOwn(val)
          onChange?.(val)
        }}
        showTimeSelect
        dateFormat="dd/MM/yyyy h:mm aa"
        placeholderText="Select date & time"
        className="w-full rounded-xl border-2 border-border bg-panel px-5 py-4 font-medium text-foreground outline-none transition-shadow duration-200 ease-out focus:shadow-[3px_3px_0px_0px] focus:shadow-brand"
        calendarClassName="rounded-xl border-2 border-border bg-panel text-foreground"
        popperClassName="z-50"
      />

      {name && (
        <input
          type="hidden"
          name={name}
          value={
            date
              ? date.toISOString()
              : ''
          }
        />
      )}

    </div>
  )
}
