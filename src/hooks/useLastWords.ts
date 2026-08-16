import { useCallback, useEffect, useState } from 'react';
import { Thought } from '@/types/thought';

/**
 * Last Words — when a thought is minutes from full decay it surfaces once
 * with a single choice: keep it, or let it go. Never repeated, never nagged.
 */

const WINDOW_MINUTES = 8;
const SEEN_KEY = 'brainchild-last-words-seen';
const CHECK_INTERVAL_MS = 30_000;

function readSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function markSeen(id: string): void {
  try {
    const seen = readSeen();
    seen.add(id);
    // Keep the marker list small — old ids no longer exist anyway.
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-80)));
  } catch {
    /* ignore */
  }
}

export function useLastWords(thoughts: Thought[]) {
  const [candidate, setCandidate] = useState<Thought | null>(null);

  useEffect(() => {
    const check = () => {
      if (candidate) return;
      const seen = readSeen();
      const now = Date.now();
      const found = thoughts.find((t) => {
        if (t.starred || seen.has(t.id)) return false;
        const remaining = t.expiresAt.getTime() - now;
        return remaining > 0 && remaining <= WINDOW_MINUTES * 60 * 1000;
      });
      if (found) {
        markSeen(found.id);
        setCandidate(found);
      }
    };

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [thoughts, candidate]);

  const dismiss = useCallback(() => setCandidate(null), []);

  return { candidate, dismiss };
}
