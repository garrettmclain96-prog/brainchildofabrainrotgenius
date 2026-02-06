import { useState, useCallback, useEffect, useRef } from 'react';
import { useThoughtStore } from '@/stores/thoughtStore';
import { Thought } from '@/types/thought';

/**
 * Ancestral Thought Echoes — while writing, detect resemblance to old thoughts.
 * Shows a ghosted overlay, not a link. User may merge, ignore, or erase both.
 */

export interface AncestralEcho {
  currentText: string;
  ancestorThought: Thought;
  similarity: number;
  daysAgo: number;
}

// Simple word-overlap similarity (intentionally imprecise — minds are fuzzy)
function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 3));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  wordsA.forEach((word) => {
    if (wordsB.has(word)) overlap++;
  });

  return overlap / Math.max(wordsA.size, wordsB.size);
}

export function useAncestralEchoes() {
  const [echo, setEcho] = useState<AncestralEcho | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const lastCheckRef = useRef('');

  const checkForEchoes = useCallback((currentText: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Don't check very short text
    if (currentText.length < 20) {
      setEcho(null);
      return;
    }

    // Debounce to avoid constant checking
    debounceRef.current = setTimeout(() => {
      // Avoid rechecking same text
      if (currentText === lastCheckRef.current) return;
      lastCheckRef.current = currentText;

      const thoughts = useThoughtStore.getState().privateThoughts;
      const now = Date.now();

      // Only check thoughts older than 1 day
      const oldThoughts = thoughts.filter(
        (t) => now - t.createdAt.getTime() > 24 * 60 * 60_000
      );

      if (oldThoughts.length === 0) {
        setEcho(null);
        return;
      }

      let bestMatch: AncestralEcho | null = null;
      let bestSimilarity = 0;

      for (const thought of oldThoughts) {
        const similarity = calculateSimilarity(currentText, thought.content);
        if (similarity > 0.3 && similarity > bestSimilarity) {
          bestSimilarity = similarity;
          const daysAgo = Math.round((now - thought.createdAt.getTime()) / (24 * 60 * 60_000));
          bestMatch = {
            currentText,
            ancestorThought: thought,
            similarity,
            daysAgo,
          };
        }
      }

      setEcho(bestMatch);
    }, 1500); // 1.5s debounce
  }, []);

  const dismissEcho = useCallback(() => {
    setEcho(null);
    lastCheckRef.current = '';
  }, []);

  const mergeWithAncestor = useCallback(() => {
    if (!echo) return null;
    // Return merged content for the composer to use
    const merged = `${echo.currentText}\n\n— merged with a ${echo.daysAgo}-day-old thought —\n\n${echo.ancestorThought.content}`;
    setEcho(null);
    return merged;
  }, [echo]);

  const eraseBoth = useCallback(() => {
    if (!echo) return;
    const store = useThoughtStore.getState();
    store.deletePrivateThought(echo.ancestorThought.id);
    setEcho(null);
  }, [echo]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { echo, checkForEchoes, dismissEcho, mergeWithAncestor, eraseBoth };
}
