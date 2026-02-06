import { useState, useEffect, useCallback } from 'react';
import { Thought, applyWordDecay } from '@/types/thought';

export interface DriftedIdea {
  id: string;
  originalContent: string;
  mutatedContent: string;
  mutationLevel: number; // 0-1
}

const DRIFT_KEY = 'brainchild-last-drift';
const DRIFT_INTERVAL = 300_000; // Check every 5 minutes
const DRIFT_CHANCE = 0.15; // 15% chance when conditions met

function mutateDrift(text: string): { mutated: string; level: number } {
  const words = text.split(' ');
  const mutationLevel = 0.2 + Math.random() * 0.3;

  const mutated = words
    .map((word) => {
      if (Math.random() < mutationLevel * 0.3) {
        // Replace with synonym-ish or poetic variant
        const mutations = [
          '~' + word,
          word + '?',
          word.split('').reverse().join(''),
          '(' + word + ')',
          word.toUpperCase(),
        ];
        return mutations[Math.floor(Math.random() * mutations.length)];
      }
      return word;
    })
    .join(' ');

  return { mutated: applyWordDecay(mutated, mutationLevel * 50), level: mutationLevel };
}

export function useIdeaDrift(fogThoughts: Thought[]) {
  const [driftedIdea, setDriftedIdea] = useState<DriftedIdea | null>(null);

  // Check for drift opportunities
  useEffect(() => {
    const check = () => {
      const lastDrift = localStorage.getItem(DRIFT_KEY);
      const now = Date.now();

      if (lastDrift && now - parseInt(lastDrift) < DRIFT_INTERVAL) return;

      if (fogThoughts.length < 2) return;

      if (Math.random() > DRIFT_CHANCE) return;

      // Pick a random thought to drift
      const eligible = fogThoughts.filter((t) => t.decayLevel < 60 && t.content.length > 15);
      if (eligible.length === 0) return;

      const source = eligible[Math.floor(Math.random() * eligible.length)];
      const { mutated, level } = mutateDrift(source.content);

      localStorage.setItem(DRIFT_KEY, String(now));

      setDriftedIdea({
        id: `drift-${now}`,
        originalContent: source.content,
        mutatedContent: mutated,
        mutationLevel: level,
      });
    };

    // Check on mount and periodically
    const timer = setTimeout(check, 10_000); // Initial delay
    const interval = setInterval(check, DRIFT_INTERVAL);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fogThoughts]);

  const dismissDrift = useCallback(() => {
    setDriftedIdea(null);
  }, []);

  const saveDrift = useCallback(() => {
    // The parent component handles saving logic
    const idea = driftedIdea;
    setDriftedIdea(null);
    return idea;
  }, [driftedIdea]);

  return { driftedIdea, dismissDrift, saveDrift };
}
