# Brainchild

Brainchild is an iPhone-first thought incubator built around one rule: not every thought deserves permanent storage.

Capture a fragment, give it a lifespan, and let time create pressure. A thought can be preserved, extended, combined with another fragment, released anonymously, or allowed to disappear. The product is intentionally different from a notes app: accumulation is not the goal; deciding what is worth keeping is.

## Core loop

1. Capture a thought without organizing it first.
2. Choose how long it should live.
3. Return before it expires.
4. Preserve, develop, combine, release, or let it decay.
5. Review what survived and turn the best fragments into something real.

The focused beta should prove that loop before expanding the experimental rooms, ambient systems, payments, or social layer.

## What already exists

- React + TypeScript installable PWA
- Local-first thought capture with Supabase synchronization
- Time-based decay and selectable half-lives
- Preserve, water, delete, stitch, search, and category flows
- Public “fog” sharing mode
- AI reflection and overnight synthesis functions
- Stripe Connect and paid-feature foundations
- Offline caching and iPhone home-screen installation

## Local development

Requirements: Node.js 20 or newer and a Supabase project containing the migrations in `supabase/migrations`.

```bash
npm ci
npm run dev
```

Create a local `.env` file with:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

Supabase Edge Functions additionally use server-side secrets such as `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`, and Stripe credentials. Do not expose those as `VITE_` variables.

## Verification

```bash
npm test
npm run build
npm run lint
```

The production build and the decay-model tests are expected to pass. Lint cleanup remains an active stabilization task and should be completed before calling the beta release-ready.

## Product boundary for the beta

Keep:

- private capture
- time-to-decay
- preserve / let go decision
- resurfacing and synthesis
- export and local lock

Defer until retention proves the loop:

- the full 15-room discovery system
- broad social features
- creator storefronts and Stripe Connect
- decorative systems that materially increase load time

This boundary is deliberate. Brainchild becomes defensible when it produces a useful record of which ideas survive—not when it has the most atmospheric features.
