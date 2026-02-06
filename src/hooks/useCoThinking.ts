import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Anonymous Co-Thinking — at certain moments, indicate shared presence.
 * "Someone else is thinking near this." No interaction. Just presence.
 * Uses randomized timing to create an organic feel (no real network needed).
 */

export interface CoThinkingPresence {
  isActive: boolean;
  message: string;
}

const PRESENCE_MESSAGES = [
  'someone else is thinking near this.',
  'another mind is nearby.',
  'you are not alone in this thought.',
  'a presence stirs in the fog.',
  'someone is thinking something similar.',
  'parallel cognition detected.',
];

// Simulate organic co-thinking presence
export function useCoThinking(thoughtCount: number): CoThinkingPresence {
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const triggerPresence = useCallback(() => {
    // Only trigger if user has thoughts
    if (thoughtCount < 2) return;

    setMessage(PRESENCE_MESSAGES[Math.floor(Math.random() * PRESENCE_MESSAGES.length)]);
    setIsActive(true);

    // Presence lasts 8-15 seconds
    const duration = 8000 + Math.random() * 7000;
    timeoutRef.current = setTimeout(() => setIsActive(false), duration);
  }, [thoughtCount]);

  useEffect(() => {
    // Random intervals between 3-8 minutes
    const scheduleNext = () => {
      const delay = (3 + Math.random() * 5) * 60_000;
      timeoutRef.current = setTimeout(() => {
        // ~40% chance of actually showing
        if (Math.random() < 0.4 && thoughtCount > 0) {
          triggerPresence();
        }
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [triggerPresence, thoughtCount]);

  return { isActive, message };
}
