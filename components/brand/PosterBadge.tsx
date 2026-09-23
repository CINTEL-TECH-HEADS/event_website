import { cn } from '@/lib/utils'

type Props = {
  children: React.ReactNode
  className?: string
  tone?: 'red' | 'yellow' | 'black'
}

const TONES: Record<string, string> = {
  red: 'bg-primary-red text-white',
  yellow: 'bg-primary-yellow text-[#14120F]',
  black: 'bg-[#14120F] text-[#F5F0E3]',
}

/**
 * The pill "stamp" badge from the poster art (e.g. the SPACE CAMP mark) —
 * a rounded-full chip with a thick black outline and a hard offset shadow.
 */
export function PosterBadge({ children, className = '', tone = 'black' }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border-2 border-[#14120F] px-4 py-1.5 font-display text-xs uppercase tracking-wide shadow-sm',
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
