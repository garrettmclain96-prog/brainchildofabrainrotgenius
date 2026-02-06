import { useCallback } from 'react';

/**
 * Haptic Feedback System
 * 
 * Organic, contextual vibration patterns.
 * Falls back silently on unsupported devices.
 */

function vibrate(pattern: number | number[]) {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently fail — haptics are optional
    }
  }
}

export function useHaptics() {
  // Soft tap — for creation, light interactions
  const tapLight = useCallback(() => {
    vibrate(8);
  }, []);

  // Medium tap — for selections, mode switches
  const tapMedium = useCallback(() => {
    vibrate(15);
  }, []);

  // Gentle decay — for deletion, letting go
  const decayPattern = useCallback(() => {
    vibrate([10, 30, 8, 50, 5, 80, 3]);
  }, []);

  // Dissolution — final, definitive haptic
  const dissolvePattern = useCallback(() => {
    vibrate([20, 20, 15, 30, 12, 40, 8, 60, 5, 100, 3, 150, 2]);
  }, []);

  // Water/revive — gentle pulse
  const waterPattern = useCallback(() => {
    vibrate([5, 40, 8, 40, 5]);
  }, []);

  // Mode switch — ritualistic transition
  const modeSwitchPattern = useCallback(() => {
    vibrate([15, 50, 10, 50, 20, 100, 15]);
  }, []);

  // Echo — brief resonance
  const echoPattern = useCallback(() => {
    vibrate([5, 60, 3, 80, 2]);
  }, []);

  // Easter egg discovery — something forbidden
  const discoveryPattern = useCallback(() => {
    vibrate([3, 30, 5, 30, 3, 100, 10, 50, 5]);
  }, []);

  return {
    tapLight,
    tapMedium,
    decayPattern,
    dissolvePattern,
    waterPattern,
    modeSwitchPattern,
    echoPattern,
    discoveryPattern,
  };
}
