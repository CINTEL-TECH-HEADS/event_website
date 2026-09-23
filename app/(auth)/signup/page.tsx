// Participant accounts are created by signing in with Google — there is no
// email/password signup anymore. Keep this path working as a redirect.
import { redirect } from 'next/navigation'

export default function SignupRedirect() {
  redirect('/login')
}
