// lib/email/resend.ts
//
// Email delivery is DISABLED — all outbound mail is stubbed to a no-op while the
// email system waits for a real integration. The sender functions in send.ts and
// their templates are kept intact so re-enabling is a one-file change here.
//
// To re-enable: restore the real Resend client below, set RESEND_API_KEY (+
// EMAIL_FROM), and remove the dummy export.
//
//   import { Resend } from 'resend'
//   export const resend = new Resend(process.env.RESEND_API_KEY!)

type DummyEmails = {
  send: (payload: unknown) => Promise<{ data: null; error: null }>
}

// Minimal shape used by send.ts (`resend.emails.send(...)`). No network call.
export const resend: { emails: DummyEmails } = {
  emails: {
    async send() {
      console.info('[email disabled] send() called — no email dispatched (dummy resend client)')
      return { data: null, error: null }
    },
  },
}
