// Server-authoritative gate for the participant portal. Runs on every full
// navigation/refresh so no portal page renders without a live session.
// (Scoped to /participant/portal so the public /participant/login redirect is unaffected.)
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth/get-session'

export const dynamic = 'force-dynamic'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect('/login?redirect=/participant/portal')

  return <>{children}</>
}
