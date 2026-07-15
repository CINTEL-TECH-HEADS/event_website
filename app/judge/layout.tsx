// Judge routes: server-authoritative auth gate + client bfcache/back-button guard.
import { redirect } from 'next/navigation'
import { SessionGuard } from '@/components/auth/SessionGuard'
import { getAuthUser } from '@/lib/auth/get-session'

export const dynamic = 'force-dynamic'

export default async function JudgeLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  return (
    <>
      <SessionGuard />
      {children}
    </>
  )
}
