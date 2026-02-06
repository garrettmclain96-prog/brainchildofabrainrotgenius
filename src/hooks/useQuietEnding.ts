import { useState, useEffect } from 'react';

/**
 * The Quiet Ending — if a user stops opening the app for months,
 * it slowly winds itself down. Leaves a final message. Then becomes inert.
 * No re-engagement tactics. Just respect.
 */

const LAST_VISIT_KEY = 'brainchild-last-visit';
const QUIET_ENDING_KEY = 'brainchild-quiet-ending';

export interface QuietEndingState {
  isActive: boolean;
  daysAway: number;
  message: string;
  isInert: boolean;
}

const GOODBYE_MESSAGES = [
  'you\'ve been away. the thoughts waited, then slowly returned to the earth. this is how it should be.',
  'time passed. the garden composted itself. you are lighter than when you left.',
  'the fog cleared while you were gone. what remains is silence, and that\'s enough.',
  'your thoughts lived their full lives while you were away. nothing was wasted.',
  'welcome back — or goodbye. either way, the app respects your choice.',
];

export function useQuietEnding(): QuietEndingState {
  const [state, setState] = useState<QuietEndingState>({
    isActive: false,
    daysAway: 0,
    message: '',
    isInert: false,
  });

  useEffect(() => {
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    const isInert = localStorage.getItem(QUIET_ENDING_KEY) === 'true';

    if (isInert) {
      setState({
        isActive: true,
        daysAway: 0,
        message: 'this instance has wound itself down. start fresh if you wish.',
        isInert: true,
      });
      return;
    }

    const now = Date.now();

    if (lastVisit) {
      const daysAway = Math.floor((now - parseInt(lastVisit)) / (24 * 60 * 60_000));

      if (daysAway > 90) {
        // App becomes inert after 90 days
        localStorage.setItem(QUIET_ENDING_KEY, 'true');
        setState({
          isActive: true,
          daysAway,
          message: GOODBYE_MESSAGES[Math.floor(Math.random() * GOODBYE_MESSAGES.length)],
          isInert: true,
        });
        return;
      } else if (daysAway > 14) {
        // Show gentle return message after 2 weeks
        setState({
          isActive: true,
          daysAway,
          message: GOODBYE_MESSAGES[Math.floor(Math.random() * GOODBYE_MESSAGES.length)],
          isInert: false,
        });
      }
    }

    // Record this visit
    localStorage.setItem(LAST_VISIT_KEY, String(now));
  }, []);

  return state;
}

export function resetQuietEnding() {
  localStorage.removeItem(QUIET_ENDING_KEY);
  localStorage.setItem(LAST_VISIT_KEY, String(Date.now()));
}
