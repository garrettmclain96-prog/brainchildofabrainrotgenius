import { useState, useEffect, useRef } from 'react';

/**
 * The True Ending — A completion, not a deletion.
 * 
 * After extended use (months), the app offers a final dissolution.
 * "You don't need this anymore."
 * No app has the balls to do this.
 */

const TRUE_ENDING_KEY = 'brainchild-true-ending';

export interface TrueEndingState {
  eligible: boolean;
  offered: boolean;
  accepted: boolean;
  phase: 'dormant' | 'offering' | 'ceremony' | 'complete';
}

interface StoredEndingState {
  firstUse: number;
  sessionsTotal: number;
  thoughtsLifetime: number;
  offered: boolean;
  accepted: boolean;
  completedAt: string | null;
}

function loadEndingState(): StoredEndingState {
  try {
    const data = localStorage.getItem(TRUE_ENDING_KEY);
    return data ? JSON.parse(data) : {
      firstUse: Date.now(),
      sessionsTotal: 0,
      thoughtsLifetime: 0,
      offered: false,
      accepted: false,
      completedAt: null,
    };
  } catch {
    return {
      firstUse: Date.now(),
      sessionsTotal: 0,
      thoughtsLifetime: 0,
      offered: false,
      accepted: false,
      completedAt: null,
    };
  }
}

function saveEndingState(state: StoredEndingState) {
  localStorage.setItem(TRUE_ENDING_KEY, JSON.stringify(state));
}

export function useTrueEnding(currentThoughtCount: number) {
  const [state, setState] = useState<TrueEndingState>({
    eligible: false,
    offered: false,
    accepted: false,
    phase: 'dormant',
  });
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const stored = loadEndingState();
    stored.sessionsTotal++;
    stored.thoughtsLifetime = Math.max(stored.thoughtsLifetime, currentThoughtCount);
    saveEndingState(stored);

    // Already completed
    if (stored.accepted) {
      setState({ eligible: true, offered: true, accepted: true, phase: 'complete' });
      return;
    }

    // Already offered
    if (stored.offered) {
      setState(prev => ({ ...prev, offered: true }));
      return;
    }

    // Eligibility criteria:
    // - At least 60 days of use
    // - At least 50 sessions
    // - Have created at least 30 thoughts lifetime
    const daysSinceFirst = (Date.now() - stored.firstUse) / (24 * 60 * 60_000);
    const eligible = daysSinceFirst >= 60 && stored.sessionsTotal >= 50 && stored.thoughtsLifetime >= 30;

    if (eligible) {
      setState(prev => ({ ...prev, eligible: true }));
      
      // 5% chance per qualifying session
      if (Math.random() < 0.05) {
        // Offer after a long delay — this should feel earned
        setTimeout(() => {
          stored.offered = true;
          saveEndingState(stored);
          setState(prev => ({ ...prev, offered: true, phase: 'offering' }));
        }, 180_000 + Math.random() * 300_000); // 3-8 minutes in
      }
    }
  }, [currentThoughtCount]);

  const beginCompletion = () => {
    setState(prev => ({ ...prev, phase: 'ceremony' }));
  };

  const acceptCompletion = () => {
    const stored = loadEndingState();
    stored.accepted = true;
    stored.completedAt = new Date().toISOString();
    saveEndingState(stored);

    setState({
      eligible: true,
      offered: true,
      accepted: true,
      phase: 'complete',
    });
  };

  const declineCompletion = () => {
    setState(prev => ({ ...prev, phase: 'dormant' }));
  };

  return {
    ...state,
    beginCompletion,
    acceptCompletion,
    declineCompletion,
  };
}
