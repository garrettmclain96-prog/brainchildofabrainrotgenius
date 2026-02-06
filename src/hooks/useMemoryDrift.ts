import { useEffect, useRef, useCallback } from 'react';
import { useThoughtStore } from '@/stores/thoughtStore';

/**
 * False Memory Drift — old notes slowly misremember themselves.
 * Dates subtly shift, phrases paraphrase, cross-references appear.
 * Runs periodically (every few minutes) on thoughts older than 2 hours.
 */

const DRIFT_INTERVAL = 5 * 60_000; // Check every 5 minutes
const MIN_AGE_FOR_DRIFT = 2 * 60 * 60_000; // 2 hours old minimum
const DRIFT_CHANCE = 0.15; // 15% chance per eligible thought per cycle

// Paraphrase maps — subtle word swaps
const PARAPHRASES: [RegExp, string[]][] = [
  [/\bremember\b/gi, ['recall', 'think about', 'revisit']],
  [/\bimportant\b/gi, ['significant', 'essential', 'meaningful']],
  [/\bneed to\b/gi, ['should', 'want to', 'might']],
  [/\bmaybe\b/gi, ['perhaps', 'possibly', 'or not']],
  [/\bgood\b/gi, ['fine', 'decent', 'okay']],
  [/\bbad\b/gi, ['difficult', 'tricky', 'rough']],
  [/\bthink\b/gi, ['feel', 'sense', 'believe']],
  [/\bwork\b/gi, ['effort', 'project', 'task']],
  [/\btry\b/gi, ['attempt', 'explore', 'consider']],
  [/\bmake\b/gi, ['create', 'build', 'shape']],
  [/\bstart\b/gi, ['begin', 'initiate', 'open']],
  [/\bfinish\b/gi, ['complete', 'end', 'close']],
  [/\balways\b/gi, ['often', 'usually', 'mostly']],
  [/\bnever\b/gi, ['rarely', 'seldom', 'hardly ever']],
];

// Subtle injections — fragments that hint at cross-referencing
const CROSS_REFERENCE_FRAGMENTS = [
  '(…or was that the other one?)',
  '(this feels familiar)',
  '(connected to something else)',
  '(echoes of another thought)',
  '(wasn\'t there more to this?)',
];

function paraphraseText(text: string): string {
  let modified = text;
  let changed = false;

  for (const [pattern, replacements] of PARAPHRASES) {
    if (pattern.test(modified) && Math.random() < 0.4) {
      const replacement = replacements[Math.floor(Math.random() * replacements.length)];
      modified = modified.replace(pattern, replacement);
      changed = true;
      break; // Only one change per drift cycle
    }
  }

  // Small chance to add a cross-reference fragment
  if (!changed && Math.random() < 0.1 && modified.length > 20) {
    const fragment = CROSS_REFERENCE_FRAGMENTS[Math.floor(Math.random() * CROSS_REFERENCE_FRAGMENTS.length)];
    modified = modified + ' ' + fragment;
  }

  return modified;
}

function subtlyShiftDate(date: Date): Date {
  // Shift by a small random amount (± 1-30 minutes)
  const shiftMs = (Math.random() - 0.5) * 2 * 30 * 60_000;
  return new Date(date.getTime() + shiftMs);
}

export function useMemoryDrift() {
  const lastRunRef = useRef(0);

  const applyDrift = useCallback(() => {
    const now = Date.now();
    if (now - lastRunRef.current < DRIFT_INTERVAL) return;
    lastRunRef.current = now;

    const store = useThoughtStore.getState();
    const thoughts = store.privateThoughts;

    const eligibleThoughts = thoughts.filter(
      (t) => now - t.createdAt.getTime() > MIN_AGE_FOR_DRIFT && t.decayLevel < 80
    );

    if (eligibleThoughts.length === 0) return;

    let anyChanged = false;
    const updatedThoughts = thoughts.map((thought) => {
      const isEligible = eligibleThoughts.some((e) => e.id === thought.id);
      if (!isEligible || Math.random() > DRIFT_CHANCE) return thought;

      anyChanged = true;
      const driftType = Math.random();

      if (driftType < 0.6) {
        // Paraphrase content
        return { ...thought, content: paraphraseText(thought.content) };
      } else if (driftType < 0.85) {
        // Subtle date shift
        return { ...thought, createdAt: subtlyShiftDate(thought.createdAt) };
      } else {
        // Both
        return {
          ...thought,
          content: paraphraseText(thought.content),
          createdAt: subtlyShiftDate(thought.createdAt),
        };
      }
    });

    if (anyChanged) {
      useThoughtStore.setState({ privateThoughts: updatedThoughts });
    }
  }, []);

  useEffect(() => {
    applyDrift(); // Run once on mount
    const interval = setInterval(applyDrift, DRIFT_INTERVAL);
    return () => clearInterval(interval);
  }, [applyDrift]);
}
