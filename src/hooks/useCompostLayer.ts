import { useCallback, useEffect, useState } from 'react';

/**
 * Compost Layer — a thought that fully decays leaves anonymous residue:
 * one stripped word, no identifiers, no timestamps beyond an age bucket.
 * The residue enriches the fog background and then fades for good.
 *
 * Device-local only. Nothing is ever sent anywhere.
 */

const STORAGE_KEY = 'brainchild-compost';
const MAX_RESIDUE = 24;
const RESIDUE_LIFESPAN_MS = 1000 * 60 * 60 * 72;

export interface Residue {
  word: string;
  addedAt: number;
  drift: number; // 0-1 horizontal placement
  depth: number; // 0-1 vertical placement
}

const STOP_WORDS = new Set([
  'the', 'and', 'but', 'that', 'this', 'with', 'from', 'have', 'just', 'about',
  'what', 'when', 'they', 'them', 'then', 'than', 'because', 'would', 'could',
  'there', 'their', 'been', 'will', 'your', 'into', 'like', 'very', 'really',
]);

/** Pick the heaviest-feeling word: longest non-trivial token, lowercased. */
function distilWord(content: string): string | null {
  const tokens = content
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOP_WORDS.has(t));
  if (tokens.length === 0) return null;
  return tokens.sort((a, b) => b.length - a.length)[0].slice(0, 18);
}

function read(): Residue[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Residue[];
    const cutoff = Date.now() - RESIDUE_LIFESPAN_MS;
    return parsed.filter((r) => r && typeof r.word === 'string' && r.addedAt > cutoff);
  } catch {
    return [];
  }
}

function write(residue: Residue[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(residue.slice(-MAX_RESIDUE)));
  } catch {
    /* storage full or blocked — compost is decorative, never critical */
  }
}

/** Called from wherever a thought reaches its end. Safe to call repeatedly. */
export function compost(content: string): void {
  const word = distilWord(content);
  if (!word) return;
  const existing = read();
  if (existing.some((r) => r.word === word)) return;
  write([
    ...existing,
    { word, addedAt: Date.now(), drift: Math.random(), depth: Math.random() },
  ]);
  window.dispatchEvent(new Event('brainchild:compost'));
}

export function useCompostLayer() {
  const [residue, setResidue] = useState<Residue[]>(() => (typeof window === 'undefined' ? [] : read()));

  const refresh = useCallback(() => setResidue(read()), []);

  useEffect(() => {
    window.addEventListener('brainchild:compost', refresh);
    const interval = setInterval(refresh, 1000 * 60 * 10);
    return () => {
      window.removeEventListener('brainchild:compost', refresh);
      clearInterval(interval);
    };
  }, [refresh]);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setResidue([]);
  }, []);

  return { residue, clear, refresh };
}
