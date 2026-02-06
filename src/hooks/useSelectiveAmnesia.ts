import { useEffect, useRef } from 'react';
import { Thought, FragmentCategory } from '@/types/thought';

/**
 * Selective Amnesia — The app occasionally "forgets."
 * 
 * A category, a tag, a previously important concept — gone.
 * It does not tell you what was forgotten.
 * You notice only by absence.
 */

const AMNESIA_KEY = 'brainchild-amnesia';
const AMNESIA_CHECK_INTERVAL = 60 * 60_000; // Check once per hour

interface AmnesiaState {
  hiddenCategories: FragmentCategory[];
  lastAmnesia: number;
  amnesiaCount: number;
}

function getAmnesiaState(): AmnesiaState {
  try {
    const data = localStorage.getItem(AMNESIA_KEY);
    return data ? JSON.parse(data) : { hiddenCategories: [], lastAmnesia: 0, amnesiaCount: 0 };
  } catch {
    return { hiddenCategories: [], lastAmnesia: 0, amnesiaCount: 0 };
  }
}

function setAmnesiaState(state: AmnesiaState) {
  localStorage.setItem(AMNESIA_KEY, JSON.stringify(state));
}

export function useSelectiveAmnesia(thoughts: Thought[]): {
  hiddenCategories: FragmentCategory[];
  filterThoughts: (thoughts: Thought[]) => Thought[];
} {
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const state = getAmnesiaState();
    const now = Date.now();
    
    // Only forget once every 3+ days
    if (now - state.lastAmnesia < 3 * 24 * 60 * 60_000) return;
    
    // 5% chance per session of forgetting something
    if (Math.random() > 0.05) return;
    
    // Find categories that have content
    const categoriesWithContent: FragmentCategory[] = [];
    const catSet = new Set<FragmentCategory>();
    thoughts.forEach(t => catSet.add(t.category));
    catSet.forEach(c => {
      if (c !== 'uncategorized') categoriesWithContent.push(c);
    });
    
    if (categoriesWithContent.length < 2) return; // Don't forget if only 1 category
    
    // Pick one category to hide (temporarily — amnesia lasts 6-24 hours)
    const victimCategory = categoriesWithContent[
      Math.floor(Math.random() * categoriesWithContent.length)
    ];
    
    setAmnesiaState({
      hiddenCategories: [victimCategory],
      lastAmnesia: now,
      amnesiaCount: state.amnesiaCount + 1,
    });

    // Auto-restore after 6-24 hours
    const restoreDelay = (6 + Math.random() * 18) * 60 * 60_000;
    setTimeout(() => {
      setAmnesiaState({
        ...getAmnesiaState(),
        hiddenCategories: [],
      });
    }, restoreDelay);
  }, [thoughts]);

  const amnesiaState = getAmnesiaState();

  const filterThoughts = (allThoughts: Thought[]) => {
    if (amnesiaState.hiddenCategories.length === 0) return allThoughts;
    return allThoughts.filter(t => !amnesiaState.hiddenCategories.includes(t.category));
  };

  return {
    hiddenCategories: amnesiaState.hiddenCategories,
    filterThoughts,
  };
}
