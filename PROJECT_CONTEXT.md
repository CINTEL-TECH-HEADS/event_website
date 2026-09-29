# Cintel — Project Context & Working Log

> Living document. Update this at the end of every working session: append what was
> done, refresh **Current State** and **Future Plan**, and flag critical pending moves.
> Last updated: 2026-09-29 (launch audit: blockers fixed; security lockdown, server moved to Sydney, attendance/posters/access, judge fixes).

## 2026-09-29: launch audit and blocker fixes (branch `fix/launch-blockers`)
**Audit result:**
- All 52 API routes check access.
- There are no secrets in git history.
- RLS and functions are locked down (see below).
- Headers are good: HSTS preload, CSP, XFO DENY, nosniff.
- Uploads are server-side with type and size limits. Only `banners` is public.

**Blockers fixed:**
- **Next 16.2.4 → 16.3.7.** 16.2.4 had RCE in the image optimizer (AVIF), proxy/middleware bypasses and cache poisoning. Also applied `npm audit fix`.
- **Removed the unused `react-email` CLI.** It bundled next@14, socket.io and an old postcss. It had also been supplying `framer-motion`, which the app imports directly, so that is now a declared dependency.
- **Prod audit went from 1 critical / 16 high to 0 critical / 1 high.** The remaining high is `xlsx`, which has no npm fix. The app only writes spreadsheets and never parses uploads with it.
- **Deleted `POST /api/payments/simulate`.** It let any registrant mark their own registration paid and confirmed: a payment bypass. Nothing used it.
- **`GET /api/uploads/file` now signs a file only for its uploader, or for owners, sub-admins and judges of the event** it was submitted to (as a form answer or a payment screenshot). Other users get 404. `..` paths are refused.
- **Uploads get their content type from the checked extension**, not from the browser.
- **The dashboard no longer logs event data to the console.**
- **Local dev only:** after dependency changes, clear `.next/dev` if the dev server reports missing `next/node_modules/...` paths.

**Still to do before launch (all need the owner):**
- Create a real superadmin (`scripts/create-organizer.mjs`) and delete `test2@cintel.com`.
- Rotate the DB password.
- Put the Google OAuth consent screen "In production".
- Set Supabase Site URL and Redirect URLs, and `NEXT_PUBLIC_APP_URL`, for the real domain.
- Don't deploy the original app against this DB.
- Consider Supabase Pro: Free projects pause after 7 idle days and have no backups.
- **Clean wipe of test data:** 8 events, 20 accounts and 133 files, all test data. Tooling is blocked for Claude (mass delete), so the owner does it in the dashboard: event tables, then Auth users except admins, then storage buckets.

## 2026-09-29: security lockdown, speed, judge and event fixes
**Security (all applied to the live DB; recorded by PRs #16 and #17):**
- **Migration `029_lock_down_rls.sql`.** The Supabase Security Advisor flagged 3 tables with RLS off (`contacts`, `payment_submissions`, `event_certificate_templates`), all readable and writable with the public key. Auditing every policy found more:
  - "read every row" policies on `registrations`, `team_members` and `team_invite_codes`
  - direct-write policies letting any signed-in user insert a (published) event, rewrite their own `participant_profiles` (fake an SRM profile) or, via `profiles: update own`, make themselves superadmin
  - self-referencing policies that made reads error with "infinite recursion"
  - 029 enables RLS on the three tables, drops every read-all and direct-write policy, and replaces the recursive ones.
- **Migration `030_fix_registration_policies.sql`.** The registrations own-row policy is now `participant_id = auth.uid()`.
- **Migration `031_harden_functions.sql`.** `handle_new_user`, `decrement_waitlist_positions` and `schedule_notification_job` (SECURITY DEFINER) now have `search_path = public`, and `EXECUTE` is limited to `service_role`. Anyone could previously call them via `/rest/v1/rpc`; `schedule_notification_job` creates `pg_cron` jobs that POST to any URL.
- The 2 stale `pg_cron` reminder jobs (for a deleted test event, posting to `localhost:3000`) were unscheduled. `cron.job` is now empty.
- **Rule:** all app DB access is server-side with the service role. Only scoped `SELECT` policies remain (own rows, published events, events you organize, and attendance for Realtime). **Never add `anon`/`authenticated` write policies.**
- The advisor still warns "Leaked password protection disabled". That setting needs the Pro plan.

**Speed (PR #14):**
- **Region.** Supabase is in `ap-southeast-2` (Sydney), but Vercel functions ran in `iad1` (Washington), so every query crossed the Pacific. Signed-in APIs took 1–3.5 s. `vercel.json` now sets `regions: ["syd1"]`, and they take about 0.35 s. Check with the `x-vercel-id: bom1::syd1::…` header.
- **Images.** `lib/image.ts` `optimizedImage()` sends `/club` photos and posters through Next's image optimizer (resized WebP). Home-page images went from 2.1 MB to 0.7 MB.
- **Home tickets.** The upcoming-event tickets no longer show posters. The events page cards and the event page still do.
- **Possible next step.** Moving Supabase to Mumbai (`ap-south-1`) would need a new project and a data migration (region can't be changed in place). About 0.3 s of India↔Sydney latency remains.

**Features and fixes:**
- **PR #10:** Event details can edit the venue, event type and start/end/registration-close times, including after publishing. `PATCH /api/events/[id]` validates the order against the stored times. `LuxuryDatePicker` supports `value`/`onChange`.
- **PR #11:** Access Control "add" never saved. It posted an email to a `profile_id` route and ignored the error. It now uses `POST /api/organizers`. Team list and Remove are fixed. Owners can't be removed. Judges of one event land on `/judge/[id]/participants`, and `my_role` from `/api/events?mine` drives judge links. People must sign in once before they can be added.
- **PR #12:** the judge view shows each answer's question label (it used to show the field UUID).
- **PR #13:** attendance, posters and access (next section).
- **jayashriiSH:**
  - PR #8: sidebar events, fixed sidebar scroll, accent contrast
  - PR #9: other-college students no longer see SRM-only events after profile setup
  - PR #15: image certificate system restored (layout editor, per-type image templates, ZIP export). It is server-side only, so compatible with the RLS lockdown.

**Deploy notes:**
- The test deployment is https://event-website-gamma.vercel.app (jayashriiSH's Vercel project). It is not the real site.
- For Google sign-in there, the exact domain must be in Supabase Auth → Redirect URLs. Keep the Site URL for the real domain.
- `NEXT_PUBLIC_APP_URL` should be set per Vercel project (QR codes, emails and certificate links fall back to localhost otherwise).

## 2026-09-28: `main` checkup (PR #7)
- `npm run lint` works again: ESLint 9 + `eslint-config-next` 16 with a flat config. `any` is allowed. React Compiler rules only warn. Vendored `reactbits`/`threeui` are ignored. There are 0 errors and about 62 warnings.
- `middleware.ts` → `proxy.ts` (Next 16).
- `next.config.js` pins `outputFileTracingRoot`/`turbopack.root`. The user's home folder has its own `package.json` and `node_modules`; don't touch them.
- `GET /api/registrations/[id]` (the confirmation page's QR pass) now requires the registrant or a linked teammate.

## 2026-09-29: per-member attendance, posters, access (branch `feat/attendance-posters-subadmin`, PR #13)
- **Attendance**:
  - Migration `028_member_attendance.sql` (**applied to the live DB**) adds `team_members.checked_in_at` and `checked_in_by`, backfilled for existing team check-ins.
  - A team keeps one `attendance` row, which exists exactly when at least one member is present. All writes go through `lib/attendance/set.ts`.
  - Scanning a team pass (`POST /api/attendance`) returns `needs_members` first. The scanner then asks who is here, with nobody ticked, and `member_ids` confirms.
  - `PUT /api/events/[id]/attendance/[registration_id]` handles edits.
  - The check-in page has an attendance list (`components/dashboard/AttendanceList.tsx`).
  - Certificates go only to present members.
  - The unused, unchecked `/api/attendance/manual` was removed.
- **Exports**: "Checked In" was always "No", because attendance embeds as an object; this is fixed. There's a new "Members Present" column.
- **Certificates**: releasing (`post-certificates`) never created assignments. Its upsert targeted partial unique indexes and failed silently; it now inserts.
  - Still broken, and left alone: the participant certificate route's best-effort upsert into the legacy `certificates` table has the same problem.
- **Posters**: `POST`/`DELETE /api/events/[id]/banner` write to the public `banners` bucket. Posters can be set on the create form and in Event details.
  - The public list now selects `banner_url`: home tickets and event cards show a crop, and the event page shows the whole poster.
- **Access**:
  - `POST /api/events` and Contacts writes now require a club organizer (`profiles.role` organizer/superadmin, exposed as `UserAccess.canManageClub` and `/api/auth/me` `can_manage_club`). Before, any signed-in user could create events, and any event role could edit contacts.
  - Access Control shows add and Remove only to owners (`viewer_role` from `GET /api/events/[id]/organizers`).
  - Sub-admins were verified end to end.

## 2026-09-28: separate registration form for other-college students (branch `feat/external-form`, PR #5 → `feat/landing-content`)
- **DB**: migration `027_form_field_audience.sql` (**applied to the live DB**) adds
  `form_fields.audience`, either `'srm'` or `'external'` (default `'srm'`). Existing fields are on the SRM form.
- **Builder** (`components/dashboard/FormFieldBuilder.tsx`, prop `openToExternal`):
  - For open events it shows two tabs, SRM KTR students and Other-college students, plus "Copy from SRM form".
  - The other-college form's standard fields are full name, phone, personal email and year of study.
  - One combined list is kept and saved as all SRM fields followed by all other-college fields, because the save route replaces every field.
  - Creating an open event lands on `?tab=form`.
- **Publish rule**: an open event needs at least one field in each form. This is checked on the event page and in `PATCH /api/events/[id]`, including when a published event is opened up.
- **Participants**: `RegistrationForm` shows each student the form for their affiliation. Other-college students fall back to the SRM form when an event has no other-college fields. `POST /api/registrations` stores only answers for the registrant's own form on that event.
- **Exports**: other-college columns are prefixed with `Other college:`.
- **Wording**: every mention of SRM students says "SRM KTR". "SRM Institute of Science and Technology" and the "SRM IST Kattankulathur" location line are unchanged.
- **Verified end to end** with throwaway accounts, all deleted afterwards. See the PR #5 test plan.
- **Form lock** (`lib/events/form-lock.ts`): the registration form and "open to other colleges" can't change while the event is published, or at all once anyone has registered.
  - Unpublishing an event nobody has registered for unlocks it again.
  - Enforced in `POST /api/events/[id]/form-fields` (409) and in `PATCH /api/events/[id]` when `open_to_external` changes (409).
  - `GET` and `PATCH /api/events/[id]` return `form_lock` (`'published' | 'registrations' | null`).
  - The builder turns read-only and shows why. Publishing asks for confirmation first.
  - This fixes the old duplicate-fields bug: the save deleted every field and re-inserted it, and once answers existed the delete failed silently, so every field was duplicated. The save route now also checks the delete error, and the builder no longer blanks the list when a save is refused.

## 2026-09-29: Team Finder / matchmaking removed
Teams now form only by **Create a team** (get a group code) and **Join with code**.
- **Removed**: register-page "Find a team" (open team-of-one seekers), the matchmaking page
  `.../events/[registration_id]/find`, portal-home team invites/requests (accept/decline) and the
  "Find teammates" button, `GET /api/events/[id]/seekers`, `GET /api/events/[id]/teams`,
  `POST /api/participant/team/invite | invite/respond | request`, `GET /api/participant/team/invites`,
  `lib/registrations/merge-into-team.ts`, the `seeking` registration flag, and the profile's
  "Networking (Find Teammates)" fields (skills/interests/LinkedIn/GitHub stay in the DB, unused).
- **Join** (`POST /api/participant/team/join`) is code-only now; joining by `registration_id` is gone.
- **Kept**: `registrations.is_open` — the creator's open/closed toggle now means "the code still lets
  people join" (join-by-code already checked it).
- **DB**: migration `026_drop_team_invites.sql` (**applied to the live DB**) dropped `team_invites`
  (it was empty, nothing referenced it; re-run 017 to restore). Any existing seeker registrations remain
  as one-person teams.
- **Migrations from Claude Code**: `scripts/db.mjs` (`query` / `dry-run` / `apply`, one transaction per
  file) using `SUPABASE_DB_URL` (session pooler) in `.env.local`.

## 2026-09-28: annual-report content, other-college students (branch `feat/landing-content`)
Built on jayashriiSH's `feat/landing-redesign`; PR goes into that branch.
- **Content**: `ARCHIVE_2025_26` in `lib/club.ts` (DIGITHON 3.0, CTF 2025, IDEATHON 2.0, PyQuest 2025,
  BugBusters 2025, Sportiva 2026) with photos from the Annual Report 2025–26 in `public/club/`. Home
  "Past events" + `/events#past` show it (`ArchiveCard`); sphere and "Pick your lane" = those six +
  Game Jam + Learn. Leap. Lead. CSR and CINTEL Connect dropped. Report figures that contradicted each
  other, winner names and stock photos were left out.
- **2026–27 so far**: CTF 2026 and Game Jam 2026 (`ARCHIVE_2026_27`, photos from the user); past events
  are grouped by academic year via `ARCHIVE_PERIODS` (newest first).
- **Other colleges**: migration `025_external_participants.sql` (**applied to the live DB**):
  `participant_profiles.affiliation` ('srm'|'external', existing SRM profiles backfilled),
  `participant_profiles.college_name`, `events.open_to_external` (default false). Setup asks SRM vs
  other college; other-college students give college name + phone. Rules in
  `lib/participants/identity.ts`. Other-college students only see/register for events with
  "Open to students from other colleges" ticked (list filtered; detail 404; register/join/offer 403;
  Team Finder empty).
- **Team pools**: SRM KTR and other-college students never share a team. A team belongs to its creator's
  pool (`poolOf`/`getPools` in `lib/participants/identity.ts`); Team Finder lists, invites, join requests,
  join-by-code and the accept/merge step all enforce it.
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
- DB schema-as-code lives in `supabase/migrations/**` (001–031), `supabase/rls/**`, `supabase/seed/**`.
  - `supabase/rls/**` is **out of date**. Migrations 029–031 define the current policies.
  - Apply migrations with `node scripts/db.mjs dry-run|apply <file>`, which reads `SUPABASE_DB_URL` (session pooler) from `.env.local`. `db.mjs` wraps each file in one transaction, so don't put `begin;`/`commit;` in a file you dry-run.
- **This repo locally:** port **3001** (launch config `event-website-3001`), because 3000 is the original repo's dev server. Google OAuth callbacks only work on 3000. Next dev blocks `127.0.0.1`, so use `localhost:3001`.

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
- **Session hardening (defense-in-depth):** `proxy.ts` (formerly `middleware.ts`) protects `/dashboard`,`/judge`,`/participant/portal`;
  **server-side auth gates** in the protected layouts (dashboard/judge layouts + new
  `participant/portal/layout.tsx`) via `getAuthUser()` → `redirect('/login')` so no page renders
  without a live session; `no-store` + `force-dynamic`; `SessionGuard.tsx` re-validates on
  mount/bfcache/focus/cross-tab-logout; **logout** does global `signOut` + sends
  `Clear-Site-Data` so Back/Forward can't resurrect a protected page. Verified in-browser:
  sign-out → Back → lands on `/login`; refresh while logged in stays put.
- **Database access (2026-09-29):**
  - RLS is on for all 19 public tables. Only scoped `SELECT` policies remain.
  - The app reads and writes only server-side with the service role. The browser uses Supabase only for auth and the attendance Realtime channel.
  - SECURITY DEFINER functions can be executed by `service_role` only.
  - There are no storage policies: buckets are written server-side, and `banners` is public-read.
- **Club vs event roles:**
  - Creating events and editing Contacts need a club organizer (`profiles.role` organizer/superadmin, `UserAccess.canManageClub`).
  - Event roles (owner/sub_admin/judge in `event_organizers`) only reach their own events.
  - Adding or removing people and deleting an event are owner-only.
- **Audit log** (`audit_log` table, migration 013; `lib/audit/log.ts`; superadmin-only
  `GET /api/audit`). Instrumented: event create/update/delete, registration cancel,
  attendance check-in, organizer add/remove, certificate generate/release, export, form-fields update.

## 6. Current state (2026-09-29)
- **`main`:**
  - This repo (`CINTEL-TECH-HEADS/event_website`) has everything through PR #17. HEAD is `d0864df`.
  - There are no open PRs.
  - Build and lint pass (0 errors).
- **Live DB (shared with the original app):**
  - Migrations are applied through **031**.
  - Only one account is a club organizer (the superadmin), and it owns all events.
  - The 18 old test events are soft-deleted (`is_deleted = true`).
- **Deploy:** the test site `event-website-gamma.vercel.app` runs functions in `syd1`, next to Supabase (`ap-southeast-2`).
- **Original repo** (`Cintel-Student-Association/cintel-event-registration`): its PR #16 is still open. Site work happens in this repo.
- **Auth note:** §4 is partly out of date:
  - Participants use **Google only**, and organizers use email/password.
  - Organizer accounts are club-level (`profiles.role`). Event sub-admins and judges are added in Access Control and must have signed in once.

## 7. Future plan / open items (prioritized)
1. **Rotate the DB password** (it was shared in chat), then update `SUPABASE_DB_URL` in `.env.local`.
2. **Permanently delete the 18 soft-deleted test events**, if wanted. The user runs `node scripts/db.mjs apply ~/cintel-test-events-cleanup/delete-test-events.dbmjs.sql`. It was dry-run tested, and backups are in the same folder.
3. **Check on a real phone on the test site:**
   - scan a team QR (member checklist)
   - Google sign-in as an other-college student
   - posters on home, events and the event page
4. **Security Advisor:** refresh and confirm the 3 errors and 9 warnings are gone. Leaked-password protection needs the Pro plan.
5. **Optional: move Supabase to Mumbai (`ap-south-1`)** for about 0.3 s less per request. This needs a new project and a data migration, and it affects both apps.
6. **Legacy `certificates` upsert** in `app/api/participant/registrations/[id]/certificate/route.ts` targets partial unique indexes and fails silently. It is best-effort and nothing reads it.
7. **Duplicate migration numbers:** `019`–`022` each have two files. All are applied live, but renumber them so a fresh replay has a deterministic order.
8. **Re-enable email** when a provider is chosen (un-stub `lib/email/resend.ts` and reactivate the Notification Center).
9. **Durable rate-limit store** (in-memory today; move to Redis/Upstash). Extend audit coverage (payment approve/reject, duplicate review).
10. Lint has about 70 warnings, mostly fetch-on-mount effects. There is no real payment gateway yet (manual proof plus organizer verification).

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
