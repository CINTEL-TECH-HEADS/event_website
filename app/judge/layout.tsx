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
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07101d]/94 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span className="text-sm font-semibold tracking-[0.18em] text-white">CINTEL · JUDGING</span>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-transparent px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-amber-300/25 hover:bg-white/5 hover:text-white"
          >
            <Home size={16} className="text-amber-300" />
            Home
          </Link>
        </div>
      </header>
      {children}
    </>
  )
}
