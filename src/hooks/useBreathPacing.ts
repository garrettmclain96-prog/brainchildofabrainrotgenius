import { useEffect, useRef } from 'react';
import { useAppMode } from '@/hooks/useAppMode';

/**
 * Breath pacing — the interface inhales and exhales at a resting rate.
 * Typing slows the breath (attention), rot mode deepens it.
 *
 * Implemented as CSS custom properties on <html> so any component can opt in
 * via `var(--breath-duration)` / `var(--breath-depth)` without re-rendering.
 */

const RESTING_SECONDS = 9;
const FOCUSED_SECONDS = 14;

export function useBreathPacing(isTyping = false) {
  const { mode } = useAppMode();
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      root.style.setProperty('--breath-depth', '0');
      root.style.setProperty('--breath-duration', '0s');
      root.dataset.breathing = 'off';
      return;
    }

    const seconds = isTyping ? FOCUSED_SECONDS : RESTING_SECONDS;
    const depth = mode === 'rot' ? 0.9 : 0.45;

    root.style.setProperty('--breath-duration', `${seconds}s`);
    root.style.setProperty('--breath-depth', String(depth));
    root.dataset.breathing = 'on';

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isTyping, mode]);
}
