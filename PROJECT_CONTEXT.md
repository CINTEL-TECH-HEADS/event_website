# Cintel — Project Context & Working Log

> Living document. Update this at the end of every working session: append what was
> done, refresh **Current State** and **Future Plan**, and flag critical pending moves.
> Last updated: 2026-09-28 (report content, other-college students, test events removed).

## 2026-09-28: annual-report content, other-college students (branch `feat/landing-content`)
Built on jayashriiSH's `feat/landing-redesign`; PR goes into that branch.
- **Content**: `ARCHIVE_2025_26` in `lib/club.ts` (DIGITHON 3.0, CTF 2025, IDEATHON 2.0, PyQuest 2025,
  BugBusters 2025, Sportiva 2026) with photos from the Annual Report 2025–26 in `public/club/`. Home
  "Past events" + `/events#past` show it (`ArchiveCard`); sphere and "Pick your lane" = those six +
  Game Jam + Learn. Leap. Lead. CSR and CINTEL Connect dropped. Report figures that contradicted each
  other, winner names and stock photos were left out.
- **Other colleges**: migration `025_external_participants.sql` (**applied to the live DB**):
  `participant_profiles.affiliation` ('srm'|'external', existing SRM profiles backfilled),
  `participant_profiles.college_name`, `events.open_to_external` (default false). Setup asks SRM vs
  other college; other-college students give college name + phone. Rules in
  `lib/participants/identity.ts`. Other-college students only see/register for events with
  "Open to students from other colleges" ticked (list filtered; detail 404; register/join/offer 403;
  Team Finder empty).
- **Security fix**: OAuth callback `?next=` open redirect (now same-site paths only).
- **Test events**: all 18 events in the live DB were test data → **soft-deleted** (`is_deleted = true`).
  Backup + a dry-run-tested permanent-delete script were given to the user to run themselves.

## This repo (CINTEL-TECH-HEADS/event_website)
Private copy of cintel-event-registration with jayashriiSH's retro redesign (cream/crimson/gold,
Bungee/Space Mono/Outfit, `components/brand/*`). Our backend was merged in via PR #1 (2026-09-23).
Site/UI work happens here; the original repo is not updated from this one unless asked.

## 2026-09-27: new layouts on every page (branch `feat/new-layout`)
- **Club content** lives in `lib/club.ts` (department, SRM IST Kattankulathur, association email,
  Instagram/LinkedIn/GitHub, flagship events CTF / Game Jam / CINTEL Connect / Learn. Leap. Lead. with
  photos in `public/club/`, from the 2026–27 recruitment site). Filler copy removed site-wide.
- **Shared shell**: `components/site/SiteHeader` (mobile menu; nav configurable), `SiteFooter`,
  `PageHeader`; dashboard pages use `components/dashboard/DashboardPageHeader`.
- **Home**: hero + live "Next up" card, open events, how registration works, what we run, past events.
  Events, event detail (sticky registration card, fee shown), register, confirmation, contact, join,
  login/reset, participant portal and all organizer pages relaid out; fetches/handlers unchanged.
- **Removed**: `/resend`, `/certificate`, `/api/resend-confirmation`, `/api/certificates/download`.
  Certificates are only in each participant's portal. Email links point to `/participant/portal`.
- **Fixes**: reset-password no longer claims a code was sent; participant header logo path
  (`/Logo.png` 404 on Linux); PastEventCard certificate check; fake check-in progress bar.
- Unused brand pieces left in place: `PixelTrail`, `ShipShape`, `PosterBadge`.
- Verified: tsc + `next build`; public pages, auth, organizer pages (throwaway organizer) and the
  participant gate/portal (throwaway participant) in the browser; test accounts deleted.

## Catch-up log: 2026-07-17 → 2026-09-23 (reconstructed from git history)
**Merged to `main`:** PR #8 (auth/portal/teams), PR #9 (solo/team cert templates), PR #12
(`fix/api-authorization`: Completed Events, Contact Us, waitlist/payments, QR check-in, mobile),
PR #11 (Shakeel: certificate template editor + canvas renderer + Supabase storage, migrations 019–022
cert set, adds `jszip`). **Open:** PR #13 `ER-Improvements1` (site polish, splash cursor).

**On `feat/google-auth-profile` (10 commits, not yet on `main`):**
- **Payments (manual UPI/bank verification)** — migration 023: per-event switchable `payment_method`
  + UPI/bank details; `payment_status` gains `submitted`/`rejected`; `payment_submissions` table.
  Participant submits proof (UTR + VPA or account-holder name + screenshot); organizer approves/rejects
  in the event **Payments** tab. Paid events issue the QR only after approval. Real gateway still deferred.
- **Teams + payments** — leader pays a flat fee once team hits min size; roster **locks** once paid;
  members' phone numbers shared after confirmation. Team Finder gains search/filter and invite badges.
- **Owner resolution** — `isRegistrationOwner` matches `participant_id` or `leader_email` against all
  of the user's emails (auth + profile) and self-heals `participant_id`.
- **Outbound email disabled** — `lib/email/resend.ts` is a no-op stub; Notification Center inactive
  (send/schedule → 503). All templates/call sites kept for later re-enable.
- **Google sign-in for participants** — login page leads with Google; organizer email/password is
  behind "Organizer sign-in". Participant-role password logins → 403. OAuth callback seeds profile,
  links registrations by email, gates first login to onboarding.
- **Mandatory profile identity** — migration 024: college email (`@srmist.edu.in`) + registration
  number (`RA…`), unique across accounts (409 on dup); portal gated until filled.
- **Pay later from portal** — "Complete payment" / "Pay again" CTAs on portal card + detail page.

**Earlier (Jul 21–29, now on `main`):** named cert templates + per-attendee assignment; file/image
uploads for custom form fields; dashboard breadcrumbs; profile networking fields (migration 019);
waitlist capacity + fee (021) with organizer-controlled waitlist offers; contacts directory (022) +
public `/contact`; Completed Events archive; QR "already checked in" state; mobile dashboard drawer;
WhatsApp removed.

**2026-09-23 session:** fetched origin; merged `origin/main` (PR #11 cert system) into
`feat/google-auth-profile` — one conflict in `types/index.ts` (payment fields vs
`certificates_released_at`, kept both); `npm install` for `jszip`; `tsc` clean. Verified live DB has
every migration through 024 applied.

## Recent: Team-size caps + solo/team choice (2026-07-16, uncommitted — no migration)
- **Organizer sets min/max team members** on **create** (`app/dashboard/events/new/page.tsx`) and **edit**
  (`app/dashboard/events/[id]/page.tsx`) forms — inputs shown when `registration_mode` is team/both,
  required, `2 <= min <= max`. Columns/API already existed; the forms just never collected them.
- **Validation**: `lib/validators/event.ts` refine (team/both require min+max, min≤max); inline guard in
  `POST /api/events` (which doesn't run the schema) rejects missing/invalid caps and nulls them for solo.
  `max_team_size` is now actually set, so the existing join/invite/request/merge capacity checks bite.
- **Registration solo/team choice for `both` events** (`app/(public)/events/[slug]/register/page.tsx`):
  a **Register solo / Register as a team** selector; solo → solo form, team → Create/Find/Join. Solo and
  team-only events are fixed (no selector). `RegistrationForm` gained a `forceTeam` prop so "Create a
  team" submits as a team on a `both` event.
- **Server guard** (`POST /api/registrations`): rejects a `registration_type` the event's mode disallows
  (solo event → solo only; team event → team only).
- ✅ **Verified**: create/edit store min/max; missing or min>max rejected; solo stores nulls; `both`
  register page shows the solo/team choice and gates the team controls; team-only event rejects a solo
  POST; `tsc` clean; no console errors; temp data cleaned up.
- NOTE: migration 016 gained a cert-constraint fix (drop old one-cert-per-registration unique; add a
  solo-only partial unique so per-member team certs work) — **already applied** to live DB (idempotent).

## Recent: Team matchmaking (2026-07-16, uncommitted — migration 017 APPLIED to live DB)
Two-sided invite/request matchmaking, scoped to **team events** and to **registration + portal** (never
the homepage). Builds on the group-code work below.
- **Scope**: removed the global portal "Join a team" box. On the **register page** (team events only):
  **Create a team** / **Find a team** (opt-in seeking) / **Join with code**. Team actions otherwise live
  only in the portal per team-event.
- **Seeker = open team-of-one**: "Find a team" registers the participant as a size-1 open team
  (`is_open=true`, auto-named), so they count as a registrant (no double-registration) and appear in the
  seeker pool. Reuses `POST /api/registrations` team path.
- **Matchmaking (both directions)**: a team short of members **invites** an individual seeker (seeker
  accepts), and a seeker **requests** to join a team (creator accepts). On accept the seeker is merged
  into the team and their team-of-one dissolved (`lib/registrations/merge-into-team.ts`); full team → is
  removed from both pools (`is_open=false`).
- **Endpoints**: `GET /api/events/[id]/seekers` (+ `/teams` now excludes self);
  `POST /api/participant/team/invite | request | invite/respond`; `GET /api/participant/team/invites`
  (incoming/outgoing). `lib/registrations/access.ts` `isTeamCreator` authorizes creator actions.
- **UI**: matchmaking view at `.../events/[registration_id]/find` (request/invite/respond + pending);
  portal home surfaces **incoming invites/requests** (accept/decline); team cards link to Find Teammates.
  Instant group-code join kept (register page "Join with code" + `/join/[code]`).
- **Migration 017** (`017_team_invites.sql`, APPLIED): `team_invites` (direction invite|request, status,
  fks, partial-unique pending pair, RLS). Reuses `registrations.is_open` (016) as finder visibility.
- ✅ **Verified end-to-end** (throwaway users/event, cleaned up): create team, two "Find a team" seekers,
  invite→accept, request→accept, guards (dup invite blocked, wrong-party accept blocked both directions),
  full team drops from finder + `is_open=false`, seeker reg dissolved (counted once), homepage/events have
  no team UI, no console errors, `tsc` clean.

## Recent: Group-code teams (2026-07-16, uncommitted — migration 016 APPLIED to live DB)
Replaced the leader-invite team model with a **group-code** model:
- **Create/Join**: creating a team mints a shareable `group_code` (registration row) and adds the creator
  as a `team_members` row linked to their account (`participant_id`). Others **join** with the code (or
  via the Team Finder) while logged in — each member is linked to their account. Auth-required join
  (`POST /api/participant/team/join` by `{code}` or `{registration_id}`).
- **Team Finder**: `GET /api/events/[id]/teams` lists open, non-full teams (no PII); shown on the
  register page (Create-a-team vs Find-a-team toggle) and a Join box in the portal.
- **Lightweight creator**: rename + open/close (`PATCH /api/participant/team/[registration_id]`) and
  remove members (`team/remove`, now authorized by account via `lib/registrations/access.ts`).
- **Shared QR, per-member certificates**: attendance stays team-level (one shared QR check-in);
  `POST /api/certificates` now generates **one cert per team member** (`certificates.team_member_id`,
  distinct file per recipient). New `GET /api/participant/registrations/[id]/certificate` returns the
  requester's own cert (account-based). Public `certificates/download` handles team members + per-member.
- **Account-based access fixes BOTH solo & team**: `/api/participant/registrations` (list) and `[id]`
  (detail, backs detail/QR/certificate) now authorize by `participant_id` (+ `team_members.participant_id`),
  not `leader_email`. This fixes the reported bug where a participant whose login email ≠ the
  registration's `leader_email` got 403 ("Registration not found") on detail/QR/cert.
- **Removed** the old leader invite-link flow (`team/invite`, `team/invite/revoke`, `team_invite_codes`
  retired). `/join/[code]` restyled + auth-required.
- **Migration 016** (`supabase/migrations/016_group_code_teams.sql`, APPLIED): `registrations.group_code`
  (unique) + `is_open`; `team_members.participant_id`; `certificates.team_member_id`; dropped the old
  `certificates_unique_registration_event` constraint (blocked per-member certs) → solo-only partial unique.
- ✅ **Verified end-to-end** (throwaway A/B/C users + temp event, all cleaned up): create→code, join by
  code, join via finder, full-team hidden from finder, dup/re-join guards, creator rename/close/remove +
  non-creator denial, per-member certs (2 distinct files, each member fetches own), and the solo
  mismatched-email access fix (detail opens; unrelated user 403). `tsc` clean.

## Recent: Auth-aware header, role gates, portal fix, no double-registration (2026-07-16, uncommitted)
- **Public header is session-aware** — new `components/public/AuthNav.tsx` (client): logged out → amber
  **Login**; logged in → **profile icon** dropdown with their portal (Dashboard/My Events), Home, Sign out.
  Wired into `app/(public)/layout.tsx` (still a server component). Backed by new **`GET /api/auth/me`**
  (`{authenticated,email,role,home}`, no-store).
- **Single source of truth for access** — `getUserAccess()` / `resolveUserAccess()` in
  `lib/auth/get-session.ts` (role + isOrganizer + home). Login route refactored to use it.
- **Airtight role gates** — `dashboard` and `judge` layouts now require **organizer** access
  (`getUserAccess()`), not just a session; a logged-in participant is redirected to `/participant/portal`.
  No longer just `getAuthUser()`.
- **Home links on all portals** — dashboard `Sidebar`, participant header, and a new judge top bar.
- **FIX: registered events not showing in portal** — `app/api/participant/registrations` now matches
  owned regs by **`participant_id`** (was `leader_email`, which broke when login email ≠ leader_email,
  e.g. meshprath1@ / pn3641@srmist). `team_members.email` kept only for non-leader members. Deduped.
- **No double-registration** — shared `lib/registrations/is-registered.ts`; account-level dup guard in
  `POST /api/registrations`; new `GET /api/registrations/mine?event_id=`; "Already Registered — View in
  Portal" gates on the public event page + register page.
- **Model note:** a registration is owned by the **account** (`participant_id`), solo=participant /
  team=leader; `leader_email` is a team-only contact field, not an identity.
- ✅ **Verified in-browser** (`tsc` clean, no console errors): logged-out header shows Login; logged-in
  participant sees the profile-icon dropdown (Signed in as / My Events → /participant/portal / Home /
  Sign out); Sign out returns to `/` and reverts the header. Role gates confirmed: participant hitting
  `/dashboard` and `/judge/[id]/participants` is redirected to `/participant/portal`. Registration
  mapping proven against live data (broken user now returns 2 events via `participant_id`; old
  `leader_email` match returned 0); account-level dup guard blocks re-registration.

## Recent: Participant Portal feature (migration 015-era work, all on fix/api-authorization)
- **participant_profiles** table (migration 014) + RLS; `form_fields.field_key`; types updated.
- Portal is **tabbed**: My Events / Past Events / My Profile (`PortalTabs`, `PastEventCard`, `ProfileTab`).
- **`/api/participant/profile`** (auth-scoped GET/PATCH, seeds from latest registration).
- **Registration now requires login** (`POST /api/registrations` → 401 if unauth), sets `participant_id`,
  pre-fills the form from the profile, and **silently syncs** the profile on submit. The register page
  redirects unauthenticated visitors to `/login?redirect=…` (reuses existing password login — the doc's
  "OTP-only interstitial" was intentionally dropped).
- Organiser **FormFieldBuilder** has a "Standard Fields" quick-add (writes `field_key`); dynamic fields
  with a `field_key` pre-fill from the participant's profile.
- Note: register_number = **college** student id (in participant_profiles); event registration number =
  registrations.display_id (kept cosmetic — no uniqueness constraint; QR/check-in use the uuid `id`).

---

## 1. What this is
Cintel — an event registration & attendance platform for the CINTEL Student Association.
Public users browse/register for events; participants manage their registrations in a
portal; organizers run events from a dashboard; judges review participants.

## 2. Stack & architecture
- **Next.js 16** (App Router, Turbopack) · **Supabase** (Postgres + Auth + Storage + RLS)
- **Resend** (email, API) · **Twilio** (WhatsApp) · **React Hook Form + Zod** · **Tailwind**
- Route groups: `(public)`, `(auth)`, `(participant)`, `dashboard/`, `judge/`
- ~35 API routes under `app/api/**`; uniform `{ data, error }` responses (`lib/utils.ts`)
- Two Supabase clients (`lib/supabase/server.ts`): **session** (RLS, user cookie) and
  **admin** (service-role, bypasses RLS — every route using it MUST authorize itself)

## 3. Environment & running
- `npm run dev` → http://localhost:3000 (keep on **port 3000**; email/OAuth callbacks depend on it — `.claude/launch.json` has `autoPort:false`)
- Required `.env.local` (gitignored): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`. Optional: `RESEND_API_KEY`, `EMAIL_FROM`, Twilio.
- Supabase project ref: `jokcuuftvqehycawioba`.
- `.env.db.local` (gitignored) holds a direct Postgres URL used for admin SQL/verification.
- DB schema-as-code lives in `supabase/migrations/**` (001–013), `supabase/rls/**`, `supabase/seed/**`.

## 4. Auth & role model (current design)
- **Single login** at `/login` for everyone (`POST /api/auth/login`): authenticates only,
  then redirects by role — organizer/superadmin → `/dashboard`, participant → `/participant/portal`.
  It does **not** create accounts.
- **Participants** self-serve via `/signup` (`POST /api/auth/signup`) → role `participant`.
- **Organizers are created manually** — `node scripts/create-organizer.mjs <email> <pw> "<Name>" [role] [eventId] [eventRole]`.
- **Roles** (`profiles.role`, migration 012): `superadmin` | `organizer` | `participant`
  (default `participant`; `handle_new_user` trigger sets it). Organizers **and** superadmins
  have **global access to all events** (`requireOrganizerRole` treats both as owner;
  `/api/events?mine=true` returns all events for them).
- **Email verification (new signups) + password reset use 6-digit OTP/PIN** (Supabase
  `verifyOtp`, client-side). Signup and login show an OTP step; `/reset-password` is a
  two-step email→code→new-password flow. Shared `components/auth/OtpInput.tsx` (accepts the
  configured length, min 6). `verifyOtp` for `signup` + `recovery` verified against live
  Supabase via `admin.generateLink(...).properties.email_otp`. Existing users just log in
  with password (unchanged). **Activates once** Supabase has: custom SMTP, "Confirm email" ON,
  and the *Confirm signup* / *Reset password* email templates rendering `{{ .Token }}`
  (optionally set OTP length to 6 — this project currently emits 8-digit codes).

## 5. Security posture
- Organizer/admin API routes gated by `requireOrganizerRole` (owner/sub_admin/judge).
- Closed holes: `events/[id]` PATCH/DELETE, `events/[id]/registrations`, `events/[id]/organizers*`,
  `registrations/[id]/cancel`, `events/[id]/form-fields` POST, `certificates/download` (now session+ownership),
  `waitlist` (organizer-only). Public POSTs rate-limited (`registrations`, `waitlist`, `resend-confirmation`).
- **Session hardening (defense-in-depth):** middleware protects `/dashboard`,`/judge`,`/participant/portal`;
  **server-side auth gates** in the protected layouts (dashboard/judge layouts + new
  `participant/portal/layout.tsx`) via `getAuthUser()` → `redirect('/login')` so no page renders
  without a live session; `no-store` + `force-dynamic`; `SessionGuard.tsx` re-validates on
  mount/bfcache/focus/cross-tab-logout; **logout** does global `signOut` + sends
  `Clear-Site-Data` so Back/Forward can't resurrect a protected page. Verified in-browser:
  sign-out → Back → lands on `/login`; refresh while logged in stays put.
- **Audit log** (`audit_log` table, migration 013; `lib/audit/log.ts`; superadmin-only
  `GET /api/audit`). Instrumented: event create/update/delete, registration cancel,
  attendance check-in, organizer add/remove, certificate generate/release, export, form-fields update.

## 6. Current state (2026-09-23)
- `main` = PRs #8, #9, #11, #12, **#14** (payments, Google auth, profile identity) merged; HEAD `91cc20f`.
  Runs locally clean (home, events, login, contact; protected routes redirect when signed out).
- Branch **`fix/portal-greeting-name`** (PR open to `main`): portal greets by profile `full_name`
  (was "there" for accounts with no registrations); `<body suppressHydrationWarning>` to silence
  Grammarly-injected attribute mismatches. PR #13 (`ER-Improvements1`) open.
- Live DB: migrations through **024** applied.
- Auth note: §4 is partly superseded — participants now use **Google only**; organizers use
  email/password.

## 7. Future plan / open items (prioritized)
1. **Merge the greeting/hydration fix PR**; end-to-end test the portal with a Google sign-in.
2. **Duplicate migration numbers** — `019`, `020`, `021`, `022` each have two files (cert set from PR #11
   vs ours). All applied live, but renumber so a fresh replay has a deterministic order.
3. **Google OAuth prod config** — Supabase Google provider + prod redirect URLs allowlisted.
4. **Re-enable email** when a provider is chosen (un-stub `lib/email/resend.ts`, reactivate Notification Center).
5. **Review/merge PR #13** (`ER-Improvements1`) — check for conflicts with this branch.
6. **Reset the test password** on `test@cinteluser.com`; **reclassify mislabeled `organizer` profiles**
   (`update profiles set role='participant' where role='organizer' and id not in (select profile_id from event_organizers);`).
7. **Durable rate-limit store** (in-memory today → Redis/Upstash); extend audit coverage
   (manual check-in, payment approve/reject, duplicate review).
8. Real payment gateway (currently manual proof + organizer verification).

## 8. Operational caveats
- Rate limiter is **in-memory** (`lib/rate-limit`) — dev-only semantics on multi-instance.
- `no-store` header isn't observable in `next dev` (Next forces `no-cache`); it applies in a prod build.
  SessionGuard is the reliable bfcache guard regardless.
- App transactional email (registration/certificate) still needs `RESEND_API_KEY` + `EMAIL_FROM` (Resend API).

## 9. How future sessions should work
- Make the **most critical/irreversible-safe moves before wrapping** (commit/push work,
  flag security/credentials, don't leave the tree dirty).
- **Update this file** before ending: append to "steps done", refresh Current State & Future Plan.
- **Notify the user** of pending critical items before the session ends.
- Never commit secrets (`.env.local`, `.env.db.local`, `.claude/` are gitignored).
