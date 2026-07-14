// Single login lives at /login now (role-aware). Keep this path working as a redirect.
import { redirect } from 'next/navigation'

export default function ParticipantLoginRedirect() {
  redirect('/login')
}
