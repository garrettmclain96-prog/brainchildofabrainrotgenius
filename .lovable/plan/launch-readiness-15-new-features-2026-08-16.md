# Launch Readiness + 15 New Features

Goal: a full pass over the app so everything renders and behaves correctly on mobile, then fifteen additions that deepen the decay-and-ritual experience without adding engagement pressure, feeds, or metrics.

## Phase 1 — Audit and fixes

Verified issues found so far:
- The TypeScript config uses a removed option (`baseUrl`), so type checking currently errors out. Fix it to the supported form so the codebase is actually type-checked again.
- The service worker is configured in the build tool but never registered in the app, so offline mode and installability don't work in practice. Register it with a quiet "new version ready" refresh.

Also to be checked and fixed as found (each verified before changing):
- Every screen at 390px width: private thoughts, public fog, settings, home ritual, shared-thought page, not-found page. Overflow, tap targets under 44px, safe-area padding, text contrast against fog.
- Decay clock correctness: level progression, night speed-up, watering, resurrection, premium 48h window.
- Data layer: load/save paths, expiry filtering, error and empty states, offline write behavior.
- Backend security review (row-level access, grants, function exposure) with fixes where needed.
- Dead or unreachable UI: components that exist but are never mounted get either wired in intentionally or removed.
- Console and runtime errors driven out on each route.

## Phase 2 — The 15 features

Ritual and decay depth
1. Decay Timeline — a slow horizontal view of a single thought's own decay history: what it looked like at each stage, ending in the state it will reach.
2. Compost Layer — decayed thoughts leave anonymous residue (a word, a fragment shape) that enriches the fog background instead of vanishing entirely.
3. Breath Pacing — the whole interface subtly breathes at a resting rate; typing slows it, decay events deepen it. Off by default in the calm mode.
4. Threshold Rite — the first thought of each day asks one quiet question before opening the composer, then never asks again that day.
5. Half-Life Dial — per-thought lifespan chosen by feel ("an hour", "a night", "a week") instead of numbers, with the choice made visible in the card's texture.
6. Last Words — when a thought is within minutes of full decay, it surfaces once with a single choice: keep, or let go. No reminder, no repeat.
7. Seasons of Rot — the visual decay language shifts slowly over weeks (fray, bloom, ash, frost) so long-term users see the app age with them.

Private tooling that reduces load
8. Quiet Search — instant local search across living thoughts, with decayed matches shown only as ghost outlines.
9. Fragment Stitching — drag two thoughts together to merge them into one, resetting decay to the newer thought's clock.
10. Offline-First Reliability — full offline capture with a local queue and silent sync when the connection returns, plus an honest sync state.
11. Export and Erase — one-tap export of everything to plain text or JSON, and a true, irreversible erase with a confirmation ritual.
12. Local Lock — optional device passcode/biometric gate for the private space, using device capabilities only.

Fog and atmosphere
13. Room Weather — each fog room gains an ambient weather state derived from its own decay density, expressed atmospherically rather than as counts.
14. Whisper Composer — a shorter, single-line fog release with a fixed short lifespan, for thoughts too small to keep.

Launch surface
15. Installable Home Ritual — proper PWA install flow with an offline entry screen, correct icons and splash behavior, and a first-run path that works with no network.

## Phase 3 — Polish and launch prep

- Accessibility pass: focus states, reduced-motion honoring across all decay animations, screen-reader labels on ritual controls.
- Performance pass on mobile: defer the 3D scene further, trim animation cost on low-end devices, verify first paint.
- Metadata and share previews reviewed for accuracy.
- Final full-route verification on mobile viewport with screenshots.

## Technical notes

- Fix `tsconfig.json` to drop the removed `baseUrl` option in favor of `paths`.
- Register the service worker (virtual module from the PWA plugin) in `src/main.tsx` with an update prompt component.
- New features follow existing patterns: state in `src/stores/thoughtStore.ts`, behavior in `src/hooks/*`, presentation in `src/components/*`, decay constants in `src/types/thought.ts` and `src/types/premium.ts`.
- All new colors, gradients, and shadows go through semantic tokens in `src/index.css` and `tailwind.config.ts` — no hardcoded color classes.
- Local Lock, Export/Erase, and offline queue stay device-local; nothing new is sent to the backend. Any new backend table gets row-level policies and grants in the same migration.
- No analytics, no notifications, no counts or rankings anywhere in the new work.

Scope note: this is a large body of work. I'll do the audit and fixes first, then build the features in the grouped order above, verifying as I go.
