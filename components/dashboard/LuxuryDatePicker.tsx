'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface Props {
  label: string
  name: string
}

export default function LuxuryDatePicker({
  label,
  name,
}: Props) {
  const [date, setDate] =
    useState<Date | null>(null)

  return (
    <div className="relative">

      <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">
        {label}
      </label>

      <DatePicker
        selected={date}
        onChange={(val: Date | null) =>
          setDate(val)
        }
        showTimeSelect
        dateFormat="dd/MM/yyyy h:mm aa"
        placeholderText="Select date & time"
        className="w-full rounded-xl border-2 border-border bg-panel px-5 py-4 font-medium text-foreground outline-none transition-shadow duration-200 ease-out focus:shadow-[3px_3px_0px_0px] focus:shadow-brand"
        calendarClassName="rounded-xl border-2 border-border bg-panel text-foreground"
        popperClassName="z-50"
      />

      <input
        type="hidden"
        name={name}
        value={
          date
            ? date.toISOString()
            : ''
        }
      />

    </div>
  )
}