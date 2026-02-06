import { useMemo } from 'react';
import { Thought } from '@/types/thought';

/**
 * Gentle Time Gravity — tasks gain weight instead of urgency.
 * Heavy tasks sink, light tasks float. Nothing screams.
 * Returns thoughts sorted by "weight" — older/more-decayed = heavier.
 */

export interface WeightedThought {
  thought: Thought;
  weight: number; // 0 (lightest) to 1 (heaviest)
  visualOffset: number; // px offset for floating/sinking effect
}

function calculateWeight(thought: Thought): number {
  const now = Date.now();
  const ageHours = (now - thought.createdAt.getTime()) / (60 * 60_000);

  // Age factor: older = heavier (capped at 72 hours)
  const ageFactor = Math.min(ageHours / 72, 1);

  // Decay factor: more decayed = heavier
  const decayFactor = thought.decayLevel / 100;

  // Water factor: recently watered = lighter
  const waterFactor = thought.lastWateredAt
    ? Math.max(0, 1 - (now - thought.lastWateredAt.getTime()) / (6 * 60 * 60_000))
    : 0;

  // Category factor: tasks are naturally heavier than ideas
  const categoryWeight: Record<string, number> = {
    tasks: 0.15,
    projects: 0.1,
    journal: 0.05,
    ideas: 0,
    uncategorized: 0.05,
  };

  const weight = Math.min(
    1,
    ageFactor * 0.35 + decayFactor * 0.35 + (categoryWeight[thought.category] || 0) - waterFactor * 0.2
  );

  return Math.max(0, weight);
}

export function useTimeGravity(thoughts: Thought[]): WeightedThought[] {
  return useMemo(() => {
    return thoughts
      .map((thought) => {
        const weight = calculateWeight(thought);
        // Heavy things sink (positive offset), light things float (negative offset)
        const visualOffset = (weight - 0.5) * 16; // -8px to +8px
        return { thought, weight, visualOffset };
      })
      .sort((a, b) => a.weight - b.weight); // Lightest first
  }, [thoughts]);
}
