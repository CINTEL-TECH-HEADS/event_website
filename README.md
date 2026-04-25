# Cintel — Event Registration & Attendance System

## Team

| Person | Role | Focus |
|--------|------|-------|
| FE1 | Frontend Dev 1 | All public pages (event listing, registration, confirmation) |
| FE2 | Frontend Dev 2 | Entire admin/organizer dashboard + judge view |
| BE1 | Backend Dev 1 | Database schema, migrations, Supabase setup, RLS |
| BE2 | Backend Dev 2 | Registration API, form validation, QR/OTP, waitlist |
| BE3 | Backend Dev 3 | Auth, roles, email, WhatsApp, notifications, Google Calendar |
| BE4 | Backend Dev 4 | Check-in/attendance, certificates, CSV/Excel export |

---

## First-Time Setup (every team member)

### 1. Fork the repo
Click **Fork** on GitHub → creates your own copy at `github.com/your-username/cintel-app`

### 2. Clone your fork
```bash
git clone https://github.com/your-username/cintel-app
cd cintel-app
```

### 3. Add upstream remote (main repo)
```bash
git remote add upstream https://github.com/REPO_OWNER/cintel-app
```

### 4. Install dependencies
```bash
npm install
```

### 5. Set up environment
```bash
cp .env.example .env.local
```
Then fill in `.env.local` with actual values — get them from BE1 over DM. Never commit `.env.local`.

### 6. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

---

## Daily Git Workflow

```bash
# Before starting work — sync with main repo
git fetch upstream
git merge upstream/main

# Create your feature branch
git checkout -b fe1/event-listing

# Work and commit often
git add .
git commit -m "fe1: add EventCard component"

# Push to YOUR fork
git push origin fe1/event-listing

# Then go to GitHub → your fork → Compare & pull request
# Target: main repo's main branch
# We (repo owner) will review and merge
```

**Branch naming:** `fe1/feature-name`, `be2/feature-name`, etc.

**PR title format:** `[fe1] Add event listing page`

---

## Folder Ownership

| Folder / File | Owner |
|---|---|
| `app/public_pages/` | FE1 |
| `app/auth_pages/` | FE2 |
| `app/dashboard/` | FE2 |
| `app/judge/` | FE2 |
| `app/api/events/` | BE2 |
| `app/api/registrations/` | BE2 |
| `app/api/resend-confirmation/` | BE2 |
| `app/api/waitlist/` | BE2 |
| `app/api/auth/` | BE3 |
| `app/api/organizers/` | BE3 |
| `app/api/notifications/` | BE3 |
| `app/api/attendance/` | BE4 |
| `app/api/export/` | BE4 |
| `app/api/certificates/` | BE4 |
| `app/api/duplicates/` | BE4 |
| `components/public/` | FE1 |
| `components/dashboard/` | FE2 |
| `components/forms/` | SHARED — ask before editing |
| `components/ui/` | SHARED — ask before editing |
| `lib/supabase/` | BE1 |
| `lib/validators/` | BE2 |
| `lib/qr/`, `lib/otp/` | BE2 |
| `lib/email/`, `lib/whatsapp/`, `lib/calendar/`, `lib/rate-limit/` | BE3 |
| `lib/certificates/`, `lib/export/` | BE4 |
| `supabase/migrations/`, `supabase/rls/`, `supabase/seed/` | BE1 |
| `types/index.ts` | BE1 — raise in group chat before editing |
| `middleware.ts` | BE3 — raise before editing |
| `lib/utils.ts` | SHARED — ask before editing |
| `.env.local` | BE1 — never commit |
| `next.config.js` | BE1 |

---

## Rules

1. **Never push directly to main** — always via PR from your fork
2. **Never touch another person's files** without telling them first
3. **Never commit `.env.local`** — it's in `.gitignore` for a reason
4. **Only BE1 writes migrations** — if you need a DB change, ask BE1
5. **Only BE1 edits `types/index.ts`** — raise it in group chat first
6. **API response format is always:** `{ data: ..., error: null }` or `{ data: null, error: 'message' }`
7. **Keep PRs small** — one feature per PR
8. **At least one person reviews** every PR before it gets merged

---

## Build Order

| Phase | Who | What |
|---|---|---|
| 1 | BE1 | Write all migrations, RLS, seed, set up storage buckets |
| 1 | All | Fork, clone, set up `.env.local`, run `npm run dev` |
| 2 | BE2 | Registration API, event CRUD, OTP/QR lib |
| 2 | BE3 | Auth routes, middleware, email templates |
| 2 | BE4 | Attendance API, duplicate detection |
| 3 | FE1 | All public pages — connect to BE2's live API |
| 3 | FE2 | Dashboard pages — connect to BE2/BE3/BE4 APIs |
| 4 | BE3 | WhatsApp, notification scheduler |
| 4 | BE4 | CSV/Excel export, certificate generation |
| 5 | All | Test each other's work, fix bugs |
| 6 | BE1 | Run migrations on prod Supabase, set Vercel env vars |

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database + Auth:** Supabase (PostgreSQL + RLS)
- **Email:** Resend + React Email
- **WhatsApp:** Twilio
- **Forms:** React Hook Form + Zod
- **Styling:** Tailwind CSS
- **QR:** `qrcode` npm package
- **PDFs:** `pdf-lib`
- **Excel:** `xlsx`
- **Deployment:** Vercel

---

## Supabase Storage Buckets (BE1 creates these)

| Bucket | Access | Purpose |
|---|---|---|
| `banners` | Public | Event banner images |
| `qrcodes` | Private | Generated QR code PNGs per registration |
| `uploads` | Private | File uploads from registration form |
| `certificates` | Private | Certificate templates + generated PDFs |

---

## Questions?

Raise in the group chat. If it's a schema question → ask BE1. If it's an API contract question → raise with the relevant backend person and the frontend person consuming it.
