import type { LucideIcon } from 'lucide-react'

type Props = {
  icon?: LucideIcon
  kicker: string
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
}

/** Plain page heading for organizer pages: kicker, title, one factual line, actions on the right. */
export function DashboardPageHeader({ icon: Icon, kicker, title, description, actions, children }: Props) {
  return (
    <header className="flex flex-col gap-4 border-b-2 border-border pb-5 lg:flex-row lg:items-end lg:justify-between lg:border-b-4">
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-tech text-[11px] font-bold uppercase tracking-[0.25em] text-brand">
          {Icon && <Icon size={14} strokeWidth={2.5} />}
          {kicker}
        </p>
        <h1 className="mt-2 break-words font-display text-2xl uppercase leading-tight tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-foreground-soft">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
