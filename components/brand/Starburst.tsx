type Props = {
  className?: string
  color?: string
  /** include the dashed radar rings behind the burst, like the reference poster */
  rings?: boolean
}

/**
 * The radiating-lines starburst motif from the poster art (the "targeting"
 * mark behind the ship). Pure line work so it can be recolored/resized
 * anywhere via className.
 */
export function Starburst({ className = '', color = 'currentColor', rings = false }: Props) {
  const spokes = Array.from({ length: 12 })

  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {rings && (
        <>
          <circle cx="100" cy="100" r="70" stroke={color} strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="4 6" />
          <circle cx="100" cy="100" r="46" stroke={color} strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="4 6" />
        </>
      )}
      {spokes.map((_, i) => {
        const angle = (i * 360) / spokes.length
        const long = i % 3 === 0
        const len = long ? 95 : 60
        return (
          <line
            key={i}
            x1="100"
            y1="100"
            x2={100 + len * Math.cos((angle * Math.PI) / 180)}
            y2={100 + len * Math.sin((angle * Math.PI) / 180)}
            stroke={color}
            strokeWidth={long ? 2 : 1.25}
            strokeLinecap="round"
          />
        )
      })}
      <path
        d="M100 60 L108 96 L140 100 L108 104 L100 140 L92 104 L60 100 L92 96 Z"
        fill={color}
      />
    </svg>
  )
}

/** A single small 4-point sparkle, for scattering as tiny background accents. */
export function Sparkle({ className = '', color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0 L14.2 9.8 L24 12 L14.2 14.2 L12 24 L9.8 14.2 L0 12 L9.8 9.8 Z" fill={color} />
    </svg>
  )
}
