/**
 * Premium constants — features gated behind Inner Sanctum subscription.
 * Import `usePremiumStatus` to check access at runtime.
 */

// Extended decay duration for premium users (48h vs 24h)
export const PREMIUM_DECAY_DURATION = 48 * 60; // minutes

// Premium-only decay modes
export const PREMIUM_DECAY_MODES = ['glitch', 'crystallize', 'echo'] as const;
export type PremiumDecayMode = typeof PREMIUM_DECAY_MODES[number];

// Premium fog priority weight multiplier
export const PREMIUM_FOG_PRIORITY = 1.5;
