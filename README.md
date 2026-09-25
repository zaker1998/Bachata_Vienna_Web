# Bachata Vienna

Next.js website for Bachata dance classes in Vienna — video library, booking system, admin dashboard, and a Resend-powered contact form.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `.env.local` at the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...   # server-only — never expose

# Admin (HTTP Basic Auth for /admin/*)
ADMIN_USERNAME=admin            # optional, defaults to "admin"
ADMIN_PASSWORD=<min 8 chars>

# Resend
RESEND_API_KEY=...
RESEND_FROM_EMAIL="Bachata Vienna <noreply@bachatavienna.at>" # verified Resend domain in prod
INSTRUCTOR_EMAIL=you@example.com
CONTACT_EMAIL=you@example.com   # optional — falls back to INSTRUCTOR_EMAIL
REPLY_TO_EMAIL=you@example.com  # optional — Reply-To on guest emails, defaults to PUBLIC_CONTACT_EMAIL

# Public site URL (used in sitemap, emails, OG metadata)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Env vars are validated with Zod on boot (`lib/env.ts`), so missing/invalid values fail fast with a clear error.

> **Production email**: until you verify a custom domain in Resend, leave `RESEND_FROM_EMAIL` at its default. Resend's shared `onboarding@resend.dev` sender can only deliver to the address that owns the Resend account, so booking confirmations to guests will silently fail. Verify your domain and set `RESEND_FROM_EMAIL` to e.g. `Bachata Vienna <noreply@yourdomain>` before launch.

## Quality Checks

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit (covers tests too)
npm run test       # Vitest unit tests
npm run verify     # all three, in order
```

Unit tests live in `test/` and cover the pure layers — request validation
(`lib/validation.ts`), Basic-Auth parsing and constant-time comparison
(`lib/basic-auth.ts`), the rate limiter, environment parsing, and email
template escaping. They need no database, network, or environment setup.

The same checks plus a production build run in CI on every push and pull
request (`.github/workflows/ci.yml`).

## Tech Stack

- **Next.js 15** (App Router, TypeScript, Server Actions)
- **Tailwind CSS v4**
- **Supabase** (Postgres — bookings)
- **Resend** (transactional email)
- **Framer Motion** (animations)
- **Zod** (server-side input + env validation)

## Project Structure

```
app/
  admin/bookings/    # protected by middleware basic auth
  book/              # booking form + server action
  contact/           # contact form + server action
  videos/            # hardcoded video library (move to DB later)
  layout.tsx         # root layout + LocalBusiness JSON-LD
  sitemap.ts         # Next metadata-route sitemap
  robots.ts          # disallows /admin and /api
components/
lib/
  env.ts             # zod-validated env access
  supabase-admin.ts  # service-role client (server-only)
  email.ts           # Resend helpers for booking emails
  rate-limit.ts      # in-memory per-process rate limiter
  constants.ts       # public brand info (contact email, socials, …)
middleware.ts        # timing-safe Basic Auth for /admin/*
```

## Database

Migrations live in `supabase/migrations/`. Apply them with the Supabase CLI:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

The `bookings` table has:

- `id uuid default gen_random_uuid() primary key`
- `created_at timestamptz default now()`
- `user_name text`, `user_email text`, `whatsapp_number text`
- `class_type text check (class_type in ('private','group'))`
- `preferred_date date`
- `status text default 'pending' check (status in ('pending','confirmed','cancelled'))`

RLS is enabled and **all anon access is revoked** (see `20260516…_lock_down_anon_inserts.sql`). All booking inserts, reads, and status updates go through Next.js Server Actions using the service-role key — there is no direct browser-to-Supabase path.
