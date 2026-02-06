import { useState, useCallback, useRef } from 'react';
import { Thought } from '@/types/thought';

/**
 * Refusal Intelligence — The app sometimes says "no."
 * 
 * Occasionally refuses to let the user write, with messages that
 * train discernment over capture addiction.
 */

export interface Refusal {
  active: boolean;
  message: string;
  duration: number;
}

const REFUSAL_MESSAGES = [
  "You already said this.",
  "This does not need to be recorded.",
  "Not now.",
  "The thought is sufficient without being written.",
  "Let this one pass.",
  "You know what you mean. That is enough.",
  "This space is not always available.",
  "Consider whether this is for you, or for the container.",
];

const SIMILARITY_THRESHOLD = 0.4;

function computeSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  
  let intersection = 0;
  wordsA.forEach(w => { if (wordsB.has(w)) intersection++; });
  
  return intersection / Math.max(wordsA.size, wordsB.size);
}

const REFUSAL_STATE_KEY = 'brainchild-refusal-state';

function getRefusalHistory(): { refusals: number; lastRefusal: number } {
  try {
    const data = localStorage.getItem(REFUSAL_STATE_KEY);
    return data ? JSON.parse(data) : { refusals: 0, lastRefusal: 0 };
  } catch {
    return { refusals: 0, lastRefusal: 0 };
  }
}

function recordRefusal() {
  const history = getRefusalHistory();
  localStorage.setItem(REFUSAL_STATE_KEY, JSON.stringify({
    refusals: history.refusals + 1,
    lastRefusal: Date.now(),
  }));
}

export function useRefusalIntelligence(thoughts: Thought[]) {
  const [refusal, setRefusal] = useState<Refusal>({ active: false, message: '', duration: 0 });
  const lastCheckRef = useRef(0);

  /**
   * Called when the user attempts to open the composer / focus input.
   * Returns true if the app refuses.
   */
  const shouldRefuse = useCallback((): boolean => {
    const now = Date.now();
    
    // Don't refuse more than once per 30 minutes
    const history = getRefusalHistory();
    if (now - history.lastRefusal < 30 * 60_000) return false;
    
    // Don't refuse too often in sequence
    if (now - lastCheckRef.current < 5_000) return false;
    lastCheckRef.current = now;

    // Base chance: 3% on any composer open
    const baseChance = 0.03;
    
    // Increase chance if user has been writing a lot recently (>5 in last hour)
    const recentThoughts = thoughts.filter(
      t => now - t.createdAt.getTime() < 60 * 60_000
    ).length;
    const hyperactiveBonus = recentThoughts > 5 ? 0.12 : recentThoughts > 3 ? 0.05 : 0;
    
    if (Math.random() > baseChance + hyperactiveBonus) return false;

    recordRefusal();
    const message = REFUSAL_MESSAGES[Math.floor(Math.random() * REFUSAL_MESSAGES.length)];
    const duration = 4000 + Math.random() * 3000;
    
    setRefusal({ active: true, message, duration });
    setTimeout(() => setRefusal({ active: false, message: '', duration: 0 }), duration);
    return true;
  }, [thoughts]);

  /**
   * Check if content is too similar to existing thoughts.
   * Called as user types — can trigger a soft refusal.
   */
  const checkSimilarity = useCallback((text: string): string | null => {
    if (text.length < 15) return null;
    
    for (const thought of thoughts) {
      const similarity = computeSimilarity(text, thought.content);
      if (similarity > SIMILARITY_THRESHOLD) {
        return "You already said this.";
      }
    }
    return null;
  }, [thoughts]);

  const dismissRefusal = useCallback(() => {
    setRefusal({ active: false, message: '', duration: 0 });
  }, []);

  return { refusal, shouldRefuse, checkSimilarity, dismissRefusal };
}
