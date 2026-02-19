

# Premium Decay Mode Effects: Glitch, Crystallize, Echo

Three exclusive visual decay animations for Inner Sanctum subscribers, applied per-thought and selectable in the composer.

---

## Overview

Premium users get access to three new decay visualization modes that replace the standard decay effects on individual thoughts:

- **Glitch**: Digital corruption -- horizontal scan lines, RGB channel splitting, random position jittering, and data-moshing artifacts that intensify with decay
- **Crystallize**: Geometric fracturing -- the card develops crystalline facets, prismatic color shifts, and sharp geometric overlays as decay increases
- **Echo**: Temporal ghosting -- the content duplicates into fading afterimages that drift and desaturate, creating a haunting trail effect

---

## What Changes

### 1. New Component: `PremiumDecayEffects.tsx`

A wrapper component that applies one of the three premium decay modes as CSS/Framer Motion overlays on top of existing card content. Takes `mode`, `decayLevel`, and `seed` as props. Each effect:

- **Glitch**: Uses CSS `clip-path` slicing, `transform: translate` jitter on intervals, and RGB channel offset via layered pseudo-elements. Intensity scales with `decayLevel`.
- **Crystallize**: Renders SVG polygon overlays (Voronoi-like facets) with prismatic gradient fills. Facet count and opacity scale with decay.
- **Echo**: Renders 2-4 duplicate text layers with increasing `translateX/Y` offsets and decreasing opacity, animated on a slow drift loop.

### 2. Update `Thought` Type

Add optional `premiumDecayMode` field (`'glitch' | 'crystallize' | 'echo' | undefined`) to the `Thought` interface in `src/types/thought.ts`.

### 3. Update `ThoughtCard.tsx`

- Import `PremiumDecayEffects` and `usePremiumStatus`
- If `thought.premiumDecayMode` is set and user is premium, render the `PremiumDecayEffects` overlay inside the card instead of the standard rot effects
- If user is not premium (e.g. subscription lapsed), fall back to standard decay -- no breakage

### 4. Update `ThoughtComposer.tsx`

- Import `usePremiumStatus` and `PREMIUM_DECAY_MODES`
- When premium, show a third row of mode pills ("glitch", "crystallize", "echo") alongside the existing clean/rot toggle
- Pass the selected premium mode through the `onSubmit` callback

### 5. Update `thoughtStore.ts`

- Accept optional `premiumDecayMode` in `addPrivateThought`
- Store it on the thought object

### 6. Update `PrivateThoughtsView.tsx` and `PublicFogView.tsx`

- Pass the premium decay mode from the composer through to the store/fog creation functions

### 7. CSS Additions in `index.css`

Add keyframes and utility classes for:
- `.premium-glitch` -- scan line animation, RGB split
- `.premium-crystallize` -- facet shimmer, prismatic hue rotation
- `.premium-echo` -- ghost drift animation

---

## Technical Details

### Glitch Effect Implementation
```
- Horizontal scan lines via repeating-linear-gradient (2px bands)
- RGB channel split: 3 absolute-positioned copies of content with offset hue-rotate filters
- Random jitter: CSS animation with irregular keyframe steps (step-end timing)
- Intensity: scan line opacity and jitter magnitude scale with decayLevel
```

### Crystallize Effect Implementation
```
- SVG overlay with 4-8 polygon shapes (positioned deterministically from seed)
- Each polygon has a prismatic gradient fill (hue-rotate based on position)
- Polygon count increases with decayLevel
- Subtle shimmer animation via opacity oscillation
```

### Echo Effect Implementation
```
- 2-4 duplicate text layers rendered behind the primary content
- Each layer offset by increasing translateX/Y values
- Opacity decreases per layer (0.3, 0.2, 0.1, 0.05)
- Slow drift animation (translateX oscillates over 8-12s)
- Layers increase in count and offset distance as decayLevel rises
```

### Premium Gating
- `usePremiumStatus()` checks subscription status
- Mode selector only appears for premium users
- If a thought has a premium mode but user is no longer premium, the thought renders with standard decay (graceful fallback)
- No server-side enforcement needed -- it's purely visual

### Files to Create
1. `src/components/PremiumDecayEffects.tsx`

### Files to Modify
1. `src/types/thought.ts` -- add `premiumDecayMode` to `Thought` interface
2. `src/components/ThoughtCard.tsx` -- integrate premium effects
3. `src/components/ThoughtComposer.tsx` -- add premium mode selector
4. `src/stores/thoughtStore.ts` -- pass through premium mode
5. `src/components/PrivateThoughtsView.tsx` -- forward premium mode
6. `src/components/PublicFogView.tsx` -- forward premium mode
7. `src/index.css` -- add premium effect keyframes
