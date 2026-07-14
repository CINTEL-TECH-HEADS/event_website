'use client'

// Re-validates the session on the client so a logged-out user can't see a
// protected page restored from the back/forward (bfcache) or a stale tab.
// Middleware guards navigations; this covers cached/restored views.

import { useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

export function SessionGuard() {
  useEffect(() => {
    const supabase = createBrowserClient()

    async function check() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        window.location.replace('/login')
      }
    }

    // Back/forward cache restore (the classic "press back after logout")
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) check()
    }
    // Returning to the tab
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }

    window.addEventListener('pageshow', onPageShow)
    document.addEventListener('visibilitychange', onVisible)

    // Logout in another tab
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') window.location.replace('/login')
    })

    return () => {
      window.removeEventListener('pageshow', onPageShow)
      document.removeEventListener('visibilitychange', onVisible)
      sub.subscription.unsubscribe()
    }
  }, [])

  return null
}
