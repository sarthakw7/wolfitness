# Wolfitness Web

Next.js web application for the Wolfitness ecosystem.  
This project is the backend + web source of truth for:

- Authentication and onboarding
- Marketplace and program access
- Purchase/payment verification
- AI nutrition endpoints
- Supabase-backed athlete and coach data

## Stack

- Next.js 16 + React 19 (`app` router)
- Supabase (Postgres + RLS + auth)
- Stripe (checkout + webhook fulfillment)
- React Query
- Vercel AI SDK (`ai`) with provider integrations

## Repository Structure

```text
src/
├── app/              # Routes, layouts, API endpoints
│   └── api/          # Server routes (AI, purchase, stripe, etc.)
├── components/       # Reusable UI components
├── hooks/            # React hooks (queries/mutations/state helpers)
├── lib/              # Clients, utilities, shared server helpers
├── services/         # Domain services and data access orchestration
└── types/            # App and database TypeScript types

supabase/
├── migrations/       # SQL migrations
└── seed/             # Optional seed scripts
```

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (URL + keys)
- Stripe account (for paid marketplace flows)

## Environment Variables

Create `./.env.local`:

```env
# Public Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-side Supabase
SUPABASE_SERVICE_ROLE_KEY=

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# AI provider keys (set based on active provider usage)
OPENAI_API_KEY=
GROQ_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
```

Notes:
- `NEXT_PUBLIC_*` values are exposed to the client bundle.
- Keep server keys (`SUPABASE_SERVICE_ROLE_KEY`, Stripe, AI keys) private.

## Install and Run

```bash
npm install
npm run dev
```

App runs on `http://localhost:3000` by default.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — run ESLint

## Database and Migrations

- SQL files are under `supabase/migrations/`.
- Apply migrations in order to your Supabase project before local QA.
- Use seed scripts from `supabase/seed/` when you need deterministic demo data.

## Core API Domains

- `src/app/api/ai/*` — nutrition estimation, coach/chat intelligence
- `src/app/api/purchase/*` — purchase initialization and verification flows
- `src/app/api/stripe/*` — Stripe webhook/payment handling

## Mobile Integration Contract (wolfitness-expo)

Mobile clients should call this web backend for server workflows:

- AI endpoints
- Purchase-init and payment state
- Any server-verified access checks

For Expo builds, mobile must use a public base URL (not `localhost`/LAN IP).

## Deployment

Recommended target: Vercel.

Minimum deployment checks:

1. Environment variables configured in hosting provider
2. Stripe webhook endpoint configured and verified
3. Supabase RLS policies migrated
4. AI provider key configured for active AI route(s)

## Troubleshooting

- **401/403 on API routes**: verify bearer token/session handling path.
- **Webhook not unlocking access**: confirm Stripe webhook secret and event delivery.
- **AI endpoint 500**: check provider key/quota and server logs.
- **Supabase query errors**: confirm migrations are fully applied and RLS allows route behavior.

