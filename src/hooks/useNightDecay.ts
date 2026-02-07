import { useMemo } from 'react';

/**
 * Night Decay — cards rot faster between 10pm and 6am.
 * This is a discovered mechanic, never explained to the user.
 * Returns a multiplier that affects decay visualization.
 */

export function useNightDecay() {
  const isNight = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 22 || hour < 6;
  }, []);

  // Night multiplier: 1.5x decay speed at night
  const decayMultiplier = isNight ? 1.5 : 1;

  // Twilight zone (8pm-10pm, 6am-8am): slightly faster
  const hour = new Date().getHours();
  const isTwilight = (hour >= 20 && hour < 22) || (hour >= 6 && hour < 8);
  const twilightMultiplier = isTwilight ? 1.2 : 1;

  return {
    isNight,
    isTwilight,
    decayMultiplier: Math.max(decayMultiplier, twilightMultiplier),
  };
}

/**
 * Apply night gravity to a decay level.
 * Makes decay feel faster at night without changing actual expiry times.
 */
export function applyNightGravity(decayLevel: number): number {
  const hour = new Date().getHours();
  const isNight = hour >= 22 || hour < 6;
  
  if (!isNight) return decayLevel;
  
  // At night, perceived decay is slightly ahead
  const boost = Math.min(10, decayLevel * 0.15);
  return Math.min(100, decayLevel + boost);
}
