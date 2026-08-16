import { useCallback, useEffect, useState } from 'react';

/**
 * Threshold Rite — before the first thought of a day, one quiet question.
 * Asked once per calendar day, dismissible, never repeated, never counted.
 */

const STORAGE_KEY = 'brainchild-threshold';

const QUESTIONS = [
  'what are you carrying today?',
  'what would you rather set down?',
  'what is loud right now?',
  'what has been waiting for your attention?',
  'what can you let decay today?',
  'what do you already know?',
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useThresholdRite(enabled = true) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');

  useEffect(() => {
    if (!enabled) return;
    let seen: string | null = null;
    try {
      seen = localStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }
    if (seen === today()) return;

    const timer = setTimeout(() => {
      setQuestion(QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]);
      setIsOpen(true);
    }, 1400);

    return () => clearTimeout(timer);
  }, [enabled]);

  const complete = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, today());
    } catch {
      /* ignore */
    }
    setIsOpen(false);
  }, []);

  return { isOpen, question, complete };
}
