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

      <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">
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
        className="w-full rounded-2xl border border-[#243B72] bg-[#07142E] px-5 py-4 text-white outline-none transition focus:border-[#F5E62D] focus:ring-2 focus:ring-[#F5E62D]/20"
        calendarClassName="rounded-2xl border border-[#243B72] bg-[#07142E] text-white shadow-2xl"
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