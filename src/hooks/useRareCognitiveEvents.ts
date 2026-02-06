import { useState, useEffect, useCallback, useRef } from 'react';
import { Thought } from '@/types/thought';

/**
 * Rare Cognitive Events — extremely rare (1 in hundreds of sessions).
 * App reorganizes notes, hidden messages appear, UI briefly "misbehaves."
 * These moments create mythology.
 */

export type RareEventType = 'reorganize' | 'hidden-message' | 'ui-glitch';

export interface RareEvent {
  type: RareEventType;
  message: string;
  explanation?: string;
  duration: number;
}

const HIDDEN_MESSAGES = [
  'you have been thinking about this longer than you realize.',
  'the pattern you\'re avoiding is the one that matters.',
  'what if the important thought was the one you deleted?',
  'you return to the same three ideas. that\'s not a flaw.',
  'the gap between your thoughts is where the meaning lives.',
  'this app remembers what you chose to forget.',
];

const UI_GLITCH_EXPLANATIONS = [
  'the system briefly reorganized itself. it does that sometimes.',
  'a moment of ordered chaos. nothing was lost.',
  'the app dreamed for a moment. it\'s awake now.',
];

const RARE_EVENT_KEY = 'brainchild-rare-events';

function getEventHistory(): { count: number; lastEvent: number } {
  try {
    const data = localStorage.getItem(RARE_EVENT_KEY);
    return data ? JSON.parse(data) : { count: 0, lastEvent: 0 };
  } catch {
    return { count: 0, lastEvent: 0 };
  }
}

function recordEvent() {
  const history = getEventHistory();
  localStorage.setItem(RARE_EVENT_KEY, JSON.stringify({
    count: history.count + 1,
    lastEvent: Date.now(),
  }));
}

export function useRareCognitiveEvents(thoughts: Thought[]) {
  const [activeEvent, setActiveEvent] = useState<RareEvent | null>(null);
  const checkRef = useRef(0);

  const triggerEvent = useCallback(() => {
    const types: RareEventType[] = ['reorganize', 'hidden-message', 'ui-glitch'];
    const type = types[Math.floor(Math.random() * types.length)];

    let event: RareEvent;

    switch (type) {
      case 'hidden-message':
        event = {
          type: 'hidden-message',
          message: HIDDEN_MESSAGES[Math.floor(Math.random() * HIDDEN_MESSAGES.length)],
          duration: 8000,
        };
        break;
      case 'ui-glitch':
        event = {
          type: 'ui-glitch',
          message: 'something shifted.',
          explanation: UI_GLITCH_EXPLANATIONS[Math.floor(Math.random() * UI_GLITCH_EXPLANATIONS.length)],
          duration: 5000,
        };
        break;
      case 'reorganize':
      default:
        event = {
          type: 'reorganize',
          message: 'your thoughts briefly rearranged themselves.',
          duration: 6000,
        };
        break;
    }

    recordEvent();
    setActiveEvent(event);
    setTimeout(() => setActiveEvent(null), event.duration);
  }, []);

  useEffect(() => {
    // Check on each "session" (page load)
    // 1% chance per check, minimum 24 hours between events
    const interval = setInterval(() => {
      checkRef.current++;
      if (checkRef.current < 3) return; // Wait a few cycles
      if (thoughts.length < 3) return; // Need some content

      const history = getEventHistory();
      const hoursSinceLastEvent = (Date.now() - history.lastEvent) / (60 * 60_000);

      if (hoursSinceLastEvent < 24) return; // Max once per day
      if (Math.random() > 0.01) return; // 1% chance per check

      triggerEvent();
    }, 60_000); // Check every minute

    return () => clearInterval(interval);
  }, [thoughts.length, triggerEvent]);

  const dismissEvent = useCallback(() => setActiveEvent(null), []);

  return { activeEvent, dismissEvent, triggerEvent };
}
