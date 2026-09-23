'use client'

import { useEffect, useState } from 'react'
import { Timer } from 'lucide-react'

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
    <div className="flex items-center gap-3 rounded-2xl border-2 border-border bg-accent-soft px-4 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border bg-accent text-white">
        <Timer className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <div>
        <p className="font-tech text-[11px] font-bold uppercase tracking-widest text-accent">Countdown</p>
        <p className="mt-1 text-sm font-bold text-foreground">{label}</p>
      </div>
    </div>
  )
}
