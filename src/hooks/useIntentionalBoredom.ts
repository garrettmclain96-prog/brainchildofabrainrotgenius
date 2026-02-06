import { useState, useEffect, useRef } from 'react';

/**
 * Intentional Boredom — Sometimes the app does nothing.
 * 
 * No prompts. No content. Just emptiness.
 * Because boredom is where insight actually happens.
 */

const BOREDOM_KEY = 'brainchild-boredom';

export interface BoredomState {
  isActive: boolean;
  message: string;
  duration: number; // ms
}

const BOREDOM_MESSAGES = [
  '',
  '·',
  '— —',
  '( )',
  '...',
  ' ',
];

function getBoredomHistory(): { lastBoredom: number; count: number } {
  try {
    const data = localStorage.getItem(BOREDOM_KEY);
    return data ? JSON.parse(data) : { lastBoredom: 0, count: 0 };
  } catch {
    return { lastBoredom: 0, count: 0 };
  }
}

export function useIntentionalBoredom(): BoredomState {
  const [state, setState] = useState<BoredomState>({
    isActive: false,
    message: '',
    duration: 0,
  });
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const history = getBoredomHistory();
    const now = Date.now();

    // Max once per 12 hours
    if (now - history.lastBoredom < 12 * 60 * 60_000) return;
    
    // 6% chance per session
    if (Math.random() > 0.06) return;

    localStorage.setItem(BOREDOM_KEY, JSON.stringify({
      lastBoredom: now,
      count: history.count + 1,
    }));

    // Boredom lasts 8-20 seconds
    const duration = 8000 + Math.random() * 12000;
    const message = BOREDOM_MESSAGES[Math.floor(Math.random() * BOREDOM_MESSAGES.length)];

    // Delayed onset — 2-5 minutes after session starts
    const onset = 120_000 + Math.random() * 180_000;
    
    const timer = setTimeout(() => {
      setState({ isActive: true, message, duration });
      setTimeout(() => setState({ isActive: false, message: '', duration: 0 }), duration);
    }, onset);

    return () => clearTimeout(timer);
  }, []);

  return state;
}
