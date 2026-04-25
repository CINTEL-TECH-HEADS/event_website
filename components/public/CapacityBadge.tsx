// Owner: FE1 — Capacity Badge (Premium UI)

type Props = {
  capacity: number
  confirmed: number
}

export function CapacityBadge({ capacity, confirmed }: Props) {
  const remaining = capacity - confirmed

  let color = 'text-green-700 bg-green-50 border-green-200'
  let label = 'Available'

  if (remaining <= 0) {
    color = 'text-red-700 bg-red-50 border-red-200'
    label = 'Full'
  } else if (remaining <= 10) {
    color = 'text-amber-700 bg-amber-50 border-amber-200'
    label = 'Almost Full'
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${color}`}
    >
      <span>{label}</span>
      <span className="opacity-70">
        {remaining > 0 ? `${remaining} spots left` : 'No spots left'}
      </span>
    </div>
  )
}
