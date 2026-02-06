import { useState, useCallback, useRef } from 'react';
import { Thought } from '@/types/thought';

/**
 * Refusal Intelligence — The app occasionally declines.
 * 
 * Constraints:
 * - ~5% of interactions, never more
 * - Never triggered twice in a row
 * - Non-repetitive (no message repeats until all have been shown)
 * - Framed as discernment, not denial
 */

export interface Refusal {
  active: boolean;
  message: string;
  duration: number;
}

const REFUSAL_MESSAGES = [
  "not now.",
  "you already know this.",
  "let it pass.",
  "this one doesn't need saving.",
  "the thought is enough.",
  "no.",
  "this space is closed.",
  "wait.",
];

const REFUSAL_STATE_KEY = 'brainchild-refusal-state';

interface RefusalState {
  lastRefusalTime: number;
  lastRefused: boolean; // true if the previous interaction was a refusal
  usedIndices: number[]; // indices of messages already shown this cycle
}

function getRefusalState(): RefusalState {
  try {
    const data = localStorage.getItem(REFUSAL_STATE_KEY);
    return data
      ? JSON.parse(data)
      : { lastRefusalTime: 0, lastRefused: false, usedIndices: [] };
  } catch {
    return { lastRefusalTime: 0, lastRefused: false, usedIndices: [] };
  }
}

function saveRefusalState(state: RefusalState) {
  localStorage.setItem(REFUSAL_STATE_KEY, JSON.stringify(state));
}

function pickMessage(state: RefusalState): { message: string; index: number } {
  let available = REFUSAL_MESSAGES
    .map((m, i) => ({ m, i }))
    .filter(({ i }) => !state.usedIndices.includes(i));

  // cycle reset — all messages shown, start fresh
  if (available.length === 0) {
    available = REFUSAL_MESSAGES.map((m, i) => ({ m, i }));
  }

  const pick = available[Math.floor(Math.random() * available.length)];
  return { message: pick.m, index: pick.i };
}

export function useRefusalIntelligence(thoughts: Thought[]) {
  const [refusal, setRefusal] = useState<Refusal>({ active: false, message: '', duration: 0 });
  const lastCheckRef = useRef(0);

  /**
   * Called when the user attempts to open the composer.
   * Returns true if the app refuses.
   */
  const shouldRefuse = useCallback((): boolean => {
    const now = Date.now();
    const state = getRefusalState();

    // never twice in a row
    if (state.lastRefused) {
      saveRefusalState({ ...state, lastRefused: false });
      return false;
    }

    // cooldown: at least 10 minutes between refusals
    if (now - state.lastRefusalTime < 10 * 60_000) {
      saveRefusalState({ ...state, lastRefused: false });
      return false;
    }

    // debounce rapid checks
    if (now - lastCheckRef.current < 3_000) return false;
    lastCheckRef.current = now;

    // ~5% base chance
    if (Math.random() > 0.05) {
      saveRefusalState({ ...state, lastRefused: false });
      return false;
    }

    // refuse
    const { message, index } = pickMessage(state);
    const usedIndices = [...state.usedIndices, index];
    const duration = 3500 + Math.random() * 1500;

    saveRefusalState({
      lastRefusalTime: now,
      lastRefused: true,
      usedIndices: usedIndices.length >= REFUSAL_MESSAGES.length ? [] : usedIndices,
    });

    setRefusal({ active: true, message, duration });
    setTimeout(() => setRefusal({ active: false, message: '', duration: 0 }), duration);
    return true;
  }, [thoughts]);

  /**
   * Soft similarity check while typing.
   */
  const checkSimilarity = useCallback((text: string): string | null => {
    if (text.length < 20) return null;

    const wordsA = new Set(text.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    if (wordsA.size === 0) return null;

    for (const thought of thoughts) {
      const wordsB = new Set(thought.content.toLowerCase().split(/\s+/).filter(w => w.length > 3));
      if (wordsB.size === 0) continue;
      let intersection = 0;
      wordsA.forEach(w => { if (wordsB.has(w)) intersection++; });
      if (intersection / Math.max(wordsA.size, wordsB.size) > 0.5) {
        return "you already said this.";
      }
    }
    return null;
  }, [thoughts]);

  const dismissRefusal = useCallback(() => {
    setRefusal({ active: false, message: '', duration: 0 });
  }, []);

  return { refusal, shouldRefuse, checkSimilarity, dismissRefusal };
}
