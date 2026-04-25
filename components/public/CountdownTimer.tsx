// Owner: FE1 — Countdown Timer (Premium UI)

'use client'

import { useEffect, useState } from 'react'

export function CountdownTimer({
  target,
}: {
  target: string
}) {
  const calculate = () => {
    const targetDate = new Date(target)

    if (isNaN(targetDate.getTime())) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      }
    }

    const now = new Date()
    const difference = targetDate.getTime() - now.getTime()

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      }
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    }
  }

  const [time, setTime] = useState(calculate())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(calculate())
    }, 1000)

    return () => clearInterval(timer)
  }, [target])

  const Item = ({
    value,
    label,
  }: {
    value: number
    label: string
  }) => (
    <div className="flex flex-col items-center bg-white border rounded-xl px-3 py-2 min-w-[60px] shadow-sm">
      <span className="text-lg font-bold text-gray-900">{value}</span>
      <span className="text-[10px] text-gray-500 uppercase tracking-wide">
        {label}
      </span>
    </div>
  )

  return (
    <div className="flex gap-3">
      <Item value={time.days} label="Days" />
      <Item value={time.hours} label="Hrs" />
      <Item value={time.minutes} label="Min" />
      <Item value={time.seconds} label="Sec" />
    </div>
  )
}