// Judge routes: server-authoritative auth + role gate + client bfcache guard.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Home } from 'lucide-react'
import { SessionGuard } from '@/components/auth/SessionGuard'
import { getUserAccess } from '@/lib/auth/get-session'

export const dynamic = 'force-dynamic'

export default async function JudgeLayout({ children }: { children: React.ReactNode }) {
  const access = await getUserAccess()
  if (!access) redirect('/login?redirect=/judge')
  // Judges hold an event_organizers membership (owner/sub_admin/judge) → isOrganizer.
  // A plain participant must not reach judging screens.
  if (!access.isOrganizer) redirect('/participant/portal')

  return (
    <>
      <SessionGuard />
      <header className="sticky top-0 z-50 border-b-2 border-border bg-panel sm:border-b-4">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span className="flex items-center gap-2 font-tech text-sm font-black uppercase tracking-[0.18em] text-foreground">
            <span className="h-3 w-3 rounded-full bg-brand" aria-hidden="true" />
            CINTEL · Judging
          </span>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-panel px-3 py-2 text-xs font-bold uppercase tracking-widest text-foreground shadow-sm transition duration-200 ease-out active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <Home size={16} className="text-brand" />
            Home
          </Link>
        </div>
      </header>
      {children}
    </>
  )
}
