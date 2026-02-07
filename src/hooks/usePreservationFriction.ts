import { useState, useCallback, useMemo } from 'react';
import { Thought } from '@/types/thought';

/**
 * Preservation Friction — makes saving thoughts slightly uncomfortable.
 * "Are you sure this deserves permanence?"
 * 
 * Creates emotional weight around the act of preserving.
 */

const PRESERVATION_PROMPTS = [
  "are you sure this deserves permanence?",
  "saving makes it heavier.",
  "most things are better as memories.",
  "this will outlast everything else you wrote today.",
  "permanence is a strong word.",
  "once saved, it watches you back.",
];

const CLUTTER_WARNINGS = [
  "you're holding too much.",
  "the weight is showing.",
  "consider letting something go first.",
  "preservation without pruning is hoarding.",
];

const RELEASE_REWARDS = [
  "lighter.",
  "released.",
  "the space opened up.",
  "gone. and that's okay.",
  "it returns to where thoughts go.",
];

interface PreservationFrictionState {
  showConfirmation: boolean;
  confirmationPrompt: string;
  pendingThoughtId: string | null;
}

export function usePreservationFriction(starredCount: number) {
  const [state, setState] = useState<PreservationFrictionState>({
    showConfirmation: false,
    confirmationPrompt: '',
    pendingThoughtId: null,
  });

  // Clutter threshold — friction increases with more starred items
  const isCluttered = starredCount >= 5;
  const frictionLevel = useMemo(() => {
    if (starredCount >= 8) return 'heavy';
    if (starredCount >= 5) return 'medium';
    return 'light';
  }, [starredCount]);

  const requestStar = useCallback((thoughtId: string) => {
    // Light friction: just confirm
    // Medium/heavy: warn about clutter
    const prompts = isCluttered ? CLUTTER_WARNINGS : PRESERVATION_PROMPTS;
    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    
    setState({
      showConfirmation: true,
      confirmationPrompt: prompt,
      pendingThoughtId: thoughtId,
    });
  }, [isCluttered]);

  const confirmStar = useCallback(() => {
    const id = state.pendingThoughtId;
    setState({
      showConfirmation: false,
      confirmationPrompt: '',
      pendingThoughtId: null,
    });
    return id;
  }, [state.pendingThoughtId]);

  const cancelStar = useCallback(() => {
    setState({
      showConfirmation: false,
      confirmationPrompt: '',
      pendingThoughtId: null,
    });
  }, []);

  const getReleasereward = useCallback(() => {
    return RELEASE_REWARDS[Math.floor(Math.random() * RELEASE_REWARDS.length)];
  }, []);

  return {
    ...state,
    frictionLevel,
    isCluttered,
    requestStar,
    confirmStar,
    cancelStar,
    getReleaseReward: getReleasereward,
  };
}
