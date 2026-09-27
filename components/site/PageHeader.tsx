import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PosterHeading } from '@/components/brand/PosterHeading'
import { cn } from '@/lib/utils'

type Props = {
  title: React.ReactNode
  kicker?: React.ReactNode
  description?: React.ReactNode
  back?: { href: string; label: string }
  actions?: React.ReactNode
  className?: string
}

/**
 * Standard page opening: optional back link, a small kicker, the poster
 * heading and one line of description, with actions on the right.
 */
export function PageHeader({ title, kicker, description, back, actions, className }: Props) {
  return (
    <div className={cn('border-b-2 border-border pb-6 lg:border-b-4', className)}>
      {back && (
        <Link
          href={back.href}
          className="mb-5 inline-flex items-center gap-2 font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} strokeWidth={2.5} /> {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {kicker && (
            <p className="font-tech text-[11px] font-bold uppercase tracking-[0.25em] text-brand">{kicker}</p>
          )}
          <PosterHeading as="h1" fillClassName="text-primary-yellow" className="mt-2 break-words text-3xl sm:text-5xl">
            {title}
          </PosterHeading>
          {description && (
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-foreground-soft sm:text-base">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  )
}
