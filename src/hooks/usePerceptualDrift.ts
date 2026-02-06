import { useState, useEffect, useCallback } from 'react';

/**
 * Perceptual Drift — UI elements slowly migrate.
 * 
 * The app denies muscle memory. Buttons shift positions
 * subtly over weeks. Nothing breaks — it just won't let you autopilot.
 */

const DRIFT_STATE_KEY = 'brainchild-perceptual-drift';
const DRIFT_EPOCH_MS = 7 * 24 * 60 * 60_000; // Shifts every ~7 days

export interface DriftState {
  navOrder: string[];
  composerPosition: 'top' | 'bottom';
  actionsFlipped: boolean;
  seed: number;
  lastShift: number;
}

const DEFAULT_STATE: DriftState = {
  navOrder: ['private', 'fog', 'settings'],
  composerPosition: 'top',
  actionsFlipped: false,
  seed: Math.random(),
  lastShift: Date.now(),
};

function generateDrift(seed: number): Partial<DriftState> {
  // Deterministic-ish drift from seed
  const s = Math.sin(seed * 9301 + 49297) * 233280;
  const v = s - Math.floor(s);

  // 40% chance nav reorders (but always keeps same items)
  const navOrders = [
    ['private', 'fog', 'settings'],
    ['private', 'settings', 'fog'],
    ['fog', 'private', 'settings'],
  ];
  const navOrder = navOrders[Math.floor(v * navOrders.length)];

  // 30% chance composer moves to bottom
  const composerPosition = v > 0.7 ? 'bottom' : 'top';
  
  // 25% chance actions buttons flip order
  const actionsFlipped = v > 0.75;

  return { navOrder, composerPosition, actionsFlipped };
}

export function usePerceptualDrift(): DriftState {
  const [state, setState] = useState<DriftState>(() => {
    try {
      const stored = localStorage.getItem(DRIFT_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if it's time for a new drift
        if (Date.now() - parsed.lastShift > DRIFT_EPOCH_MS) {
          const newSeed = Math.random();
          const drift = generateDrift(newSeed);
          const newState = { ...DEFAULT_STATE, ...drift, seed: newSeed, lastShift: Date.now() };
          localStorage.setItem(DRIFT_STATE_KEY, JSON.stringify(newState));
          return newState;
        }
        return parsed;
      }
    } catch { /* use default */ }
    
    localStorage.setItem(DRIFT_STATE_KEY, JSON.stringify(DEFAULT_STATE));
    return DEFAULT_STATE;
  });

  return state;
}
