'use client'

import { useEffect, useState } from 'react'

function getCountdownLabel(closesAt: string) {
  const diff = new Date(closesAt).getTime() - Date.now()
  if (diff <= 0) return 'Registration is closed'

  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const secs = Math.floor((diff % 60000) / 1000)

  return `Registration closes in ${hours}h ${mins}m ${secs}s`
}

export function CountdownTimer({ closesAt }: { closesAt: string }) {
  const [label, setLabel] = useState(() => getCountdownLabel(closesAt))

  useEffect(() => {
    const interval = setInterval(() => {
      setLabel(getCountdownLabel(closesAt))
    }, 1000)

    return () => clearInterval(interval)
  }, [closesAt])

  return (
    <div className="rounded-xl border border-blue-300/20 bg-[#101b33] px-4 py-4 text-sm font-medium text-blue-200">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-100">Countdown</p>
      <p className="mt-2 text-base font-semibold text-blue-200">{label}</p>
    </div>
  )
}
