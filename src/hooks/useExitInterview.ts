import { useState, useEffect, useRef } from 'react';

/**
 * The Exit Interview — the most important screen (hidden).
 * 
 * Triggered only after long-term use or multiple near-deletions.
 * Asks honest questions. If they say no, helps them dissolve cleanly.
 * No retention tricks. No begging.
 */

const EXIT_KEY = 'brainchild-exit-interview';

interface ExitState {
  sessionsCount: number;
  nearDeletions: number;
  firstSession: number;
  interviewShown: boolean;
  interviewAnswers: Record<string, string>;
}

function getExitState(): ExitState {
  try {
    const data = localStorage.getItem(EXIT_KEY);
    return data ? JSON.parse(data) : {
      sessionsCount: 0,
      nearDeletions: 0,
      firstSession: Date.now(),
      interviewShown: false,
      interviewAnswers: {},
    };
  } catch {
    return {
      sessionsCount: 0,
      nearDeletions: 0,
      firstSession: Date.now(),
      interviewShown: false,
      interviewAnswers: {},
    };
  }
}

function saveExitState(state: ExitState) {
  localStorage.setItem(EXIT_KEY, JSON.stringify(state));
}

export function useExitInterview() {
  const [shouldShow, setShouldShow] = useState(false);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const state = getExitState();
    
    // Increment session count
    state.sessionsCount++;
    saveExitState(state);

    // Don't show if already shown
    if (state.interviewShown) return;

    // Criteria: 30+ sessions OR 3+ near-deletions, AND at least 14 days of use
    const daysSinceFirst = (Date.now() - state.firstSession) / (24 * 60 * 60_000);
    const qualifies = (
      daysSinceFirst >= 14 &&
      (state.sessionsCount >= 30 || state.nearDeletions >= 3)
    );

    if (qualifies && Math.random() < 0.15) {
      // 15% chance per qualifying session
      setTimeout(() => setShouldShow(true), 60_000 + Math.random() * 120_000); // 1-3 min delay
    }
  }, []);

  const recordNearDeletion = () => {
    const state = getExitState();
    state.nearDeletions++;
    saveExitState(state);
  };

  const completeInterview = (answers: Record<string, string>) => {
    const state = getExitState();
    state.interviewShown = true;
    state.interviewAnswers = answers;
    saveExitState(state);
    setShouldShow(false);
  };

  const dismissInterview = () => {
    setShouldShow(false);
  };

  return { shouldShow, recordNearDeletion, completeInterview, dismissInterview };
}
