'use client'

import { useEffect, useState } from 'react'
import { Timer } from 'lucide-react'

function getCountdownLabel(closesAt: string) {
  const diff = new Date(closesAt).getTime() - Date.now()
  if (diff <= 0) return 'Registration is closed'

  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const secs = Math.floor((diff % 60000) / 1000)

  const time = days > 0 ? `${days}d ${hours}h ${mins}m` : `${hours}h ${mins}m ${secs}s`
  return `Registration closes in ${time}`
}

export function CountdownTimer({ closesAt, compact = false }: { closesAt: string; compact?: boolean }) {
  const [label, setLabel] = useState(() => getCountdownLabel(closesAt))

  useEffect(() => {
    const interval = setInterval(() => {
      setLabel(getCountdownLabel(closesAt))
    }, 1000)

    return () => clearInterval(interval)
  }, [closesAt])

  if (compact) {
    return (
      <p className="flex items-center gap-2 text-sm font-bold" suppressHydrationWarning>
        <Timer className="h-4 w-4 shrink-0" strokeWidth={2.5} />
        {label}
      </p>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-border bg-accent-soft px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border bg-accent text-background">
        <Timer className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <p className="text-sm font-bold text-foreground" suppressHydrationWarning>{label}</p>
    </div>
  )
}
