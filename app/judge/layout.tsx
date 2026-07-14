// Judge routes are auth-protected by middleware; this adds the client-side
// bfcache/back-button guard and disables static caching.
import { SessionGuard } from '@/components/auth/SessionGuard'

export const dynamic = 'force-dynamic'

export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SessionGuard />
      {children}
    </>
  )
}
