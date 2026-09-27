import { SessionGuard } from '@/components/auth/SessionGuard'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'

// Never statically cache authenticated participant content
export const dynamic = 'force-dynamic'

const PARTICIPANT_NAV = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/participant/portal', label: 'My events' },
]

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="participant-theme-shell relative flex min-h-screen flex-col overflow-x-clip bg-background text-foreground">
      <SessionGuard />
      <SiteHeader nav={PARTICIPANT_NAV} />
      <main className="relative z-10 flex-1 bg-background">{children}</main>
      <SiteFooter />
    </div>
  )
}
