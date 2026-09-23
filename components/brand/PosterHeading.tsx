import { cn } from '@/lib/utils'

type Props = {
  children: React.ReactNode
  className?: string
  /** fill color for the letterforms; the outline is always drawn in --border */
  fillClassName?: string
  as?: 'h1' | 'h2' | 'h3' | 'span'
}

/**
 * Big layered-outline poster type, like "ASTEROIDS" on the reference art:
 * a bold display face with a thick ink outline around each letter.
 */
export function PosterHeading({ children, className = '', fillClassName = 'text-primary-yellow', as = 'h2' }: Props) {
  const Tag = as
  return (
    <Tag
      className={cn(
        'font-display uppercase leading-[0.95] tracking-tight text-poster-outline',
        fillClassName,
        className
      )}
    >
      {children}
    </Tag>
  )
}
