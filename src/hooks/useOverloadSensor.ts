import { useState, useEffect, useCallback, useRef } from 'react';

interface OverloadState {
  isOverloaded: boolean;
  intensity: number; // 0-1
  actionCount: number;
  suggestion: 'amplify' | 'prune' | null;
}

const OVERLOAD_THRESHOLD = 8; // actions in time window
const TIME_WINDOW = 30_000; // 30 seconds
const COOLDOWN = 120_000; // 2 minutes before showing again

export function useOverloadSensor() {
  const [state, setState] = useState<OverloadState>({
    isOverloaded: false,
    intensity: 0,
    actionCount: 0,
    suggestion: null,
  });

  const actionsRef = useRef<number[]>([]);
  const lastPromptRef = useRef<number>(0);
  const dismissedRef = useRef(false);

  const recordAction = useCallback(() => {
    const now = Date.now();
    actionsRef.current.push(now);

    // Clean old actions outside the window
    actionsRef.current = actionsRef.current.filter((t) => now - t < TIME_WINDOW);

    const count = actionsRef.current.length;
    const intensity = Math.min(count / OVERLOAD_THRESHOLD, 1);

    const shouldPrompt =
      count >= OVERLOAD_THRESHOLD &&
      now - lastPromptRef.current > COOLDOWN &&
      !dismissedRef.current;

    setState({
      isOverloaded: shouldPrompt,
      intensity,
      actionCount: count,
      suggestion: shouldPrompt ? null : null,
    });

    if (shouldPrompt) {
      lastPromptRef.current = now;
    }
  }, []);

  const dismiss = useCallback(() => {
    dismissedRef.current = true;
    setState((prev) => ({ ...prev, isOverloaded: false }));
    // Reset after cooldown
    setTimeout(() => {
      dismissedRef.current = false;
    }, COOLDOWN);
  }, []);

  const choosePath = useCallback((path: 'amplify' | 'prune') => {
    setState((prev) => ({ ...prev, suggestion: path, isOverloaded: false }));
    dismissedRef.current = true;
    setTimeout(() => {
      dismissedRef.current = false;
      setState((prev) => ({ ...prev, suggestion: null }));
    }, COOLDOWN);
  }, []);

  // Track scroll velocity as an action
  useEffect(() => {
    let lastScroll = 0;
    let scrollCount = 0;

    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScroll < 200) {
        scrollCount++;
        if (scrollCount > 5) {
          recordAction();
          scrollCount = 0;
        }
      } else {
        scrollCount = 0;
      }
      lastScroll = now;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [recordAction]);

  return {
    ...state,
    recordAction,
    dismiss,
    choosePath,
  };
}
