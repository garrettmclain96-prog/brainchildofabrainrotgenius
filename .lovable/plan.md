

# Phases 2, 3, and 4 -- Automation, SEO, and Traffic Drivers

This implements the remaining three phases of the monetization ecosystem in a single build.

---

## Phase 2: Automate Everything

### 2a. Auto-Decay Edge Function
Create `supabase/functions/auto-decay/index.ts` that:
- Calculates and updates `decay_level` on all `public_thoughts` based on elapsed time vs total duration
- Deletes thoughts where `expires_at <= now()` (fully expired)
- Called via cron every 5 minutes

### 2b. Cron Jobs (pg_cron + pg_net)
Enable `pg_cron` and `pg_net` extensions, then schedule:
- `cleanup_expired_notes()` every 15 minutes
- `cleanup_rate_limits()` every hour  
- `auto-decay` edge function every 5 minutes
- Expired public thoughts cleanup every 30 minutes

These are data operations (INSERT into cron.schedule), so they use the insert tool, not migrations.

### 2c. Complete Webhook Automation
Update `supabase/functions/stripe-connect-webhooks/index.ts` to replace the TODO comments:
- `invoice.paid`: Add `premium_until` column to `subscription_status` and set it to `current_period_end`
- `customer.subscription.deleted`: Set `premium_until` to `now()` to revoke access immediately
- `invoice.payment_failed`: Insert a row into a new `payment_whispers` table so the app can show a soft notification on next visit

### 2d. Premium Status Hook
Create `src/hooks/usePremiumStatus.ts` that:
- Queries `subscription_status` for the current session's connected account
- Returns `{ isPremium, premiumUntil, isLoading }`
- Used to gate premium features (extended decay timers, exclusive modes)

---

## Phase 3: SEO and Organic Traffic

### 3a. PWA Manifest Enhancement
Update `public/manifest.json` to add:
- `screenshots` array (for app store listings)
- `related_applications` placeholder
- `prefer_related_applications: false`

### 3b. Robots.txt and Sitemap (Already Done)
These were completed in Phase 1. No changes needed.

### 3c. SEO Meta Tags (Already Done)
OG tags, canonical URL, structured data, noscript content, and hidden h1 were all added in Phase 1. No changes needed.

---

## Phase 4: Traffic Drivers

### 4a. Shareable Fog Links

**Database changes:**
- Add `share_slug` column (text, nullable, unique) to `public_thoughts`
- Add RLS policy allowing SELECT on `public_thoughts` by `share_slug` (public read for shared thoughts)

**Edge function:** Create `supabase/functions/share-thought/index.ts`
- Accepts a `thought_id` + `session_id`, generates a random 8-char slug
- Updates the thought's `share_slug`
- Returns the shareable URL

**Frontend:**
- Create `src/components/ShareFogLink.tsx` -- a small button on `ThoughtCard` that generates and copies a share link
- Create a new route `/fog/:slug` in `App.tsx` that displays the shared thought
- Create `src/pages/SharedThought.tsx` -- renders a single decaying thought with a CTA to try Brainchild; shows "this thought has dissolved" if expired

### 4b. Embeddable Widget

**Edge function:** Create `supabase/functions/embed-widget/index.ts`
- Serves a small HTML/JS snippet that renders a live decaying thought in an iframe
- Includes a "Powered by Brainchild" backlink
- Fetches a random active public thought via service role

**Frontend:**
- Add an "Embed" section in Settings that shows the embed code snippet users can copy

### 4c. Dynamic OG Image for Shared Thoughts

**Edge function:** Create `supabase/functions/og-image/index.ts`
- Accepts a `slug` query param
- Fetches the thought content from `public_thoughts` by `share_slug`
- Generates an SVG-based image with the thought text overlaid on the Brainchild brand background
- Returns as `image/svg+xml` (no external dependencies needed)
- `SharedThought.tsx` page sets its OG meta tags to point to this function

---

## Technical Summary

### Database Changes (Migration)
1. Add `share_slug` text column (nullable, unique) to `public_thoughts`
2. Add `premium_until` timestamptz column to `subscription_status`
3. Create `payment_whispers` table (id, session_id, message, seen, created_at)
4. Enable `pg_cron` and `pg_net` extensions
5. Add SELECT RLS policy on `public_thoughts` for shared thoughts (where `share_slug` is not null)
6. Add UPDATE policy on `public_thoughts` for `share_slug` (via service role only -- handled in edge function)

### Cron Jobs (Insert tool -- not migration)
1. `cleanup_expired_notes` -- every 15 min
2. `cleanup_rate_limits` -- every hour
3. `auto-decay` edge function call -- every 5 min
4. Delete expired `public_thoughts` -- every 30 min

### New Edge Functions
1. `auto-decay` -- decay processor
2. `share-thought` -- generate share slugs
3. `embed-widget` -- embeddable iframe content
4. `og-image` -- dynamic SVG OG images

### Updated Edge Functions
1. `stripe-connect-webhooks` -- complete TODO items for premium access

### New Frontend Files
1. `src/hooks/usePremiumStatus.ts`
2. `src/components/ShareFogLink.tsx`
3. `src/pages/SharedThought.tsx`

### Updated Frontend Files
1. `src/App.tsx` -- add `/fog/:slug` route
2. `src/components/ThoughtCard.tsx` -- add share button
3. `src/components/SettingsView.tsx` -- add embed code section
4. `public/manifest.json` -- enhance PWA metadata
5. `supabase/config.toml` -- register new edge functions

### Build Order
1. Database migration (columns + tables + extensions + policies)
2. Cron job scheduling (insert tool)
3. Edge functions (auto-decay, share-thought, embed-widget, og-image, updated webhooks)
4. Frontend components and routes
5. Deploy and test

