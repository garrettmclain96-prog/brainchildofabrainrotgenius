import { useState, useEffect, useCallback, useRef } from 'react';
import { Thought } from '@/types/thought';

/**
 * Cognitive Hauntings — Eerily relevant fragments appear.
 * 
 * Fragments that feel eerily relevant, reference something you just wrote.
 * No explanation. No metadata. No proof it's another human.
 * Users will debate whether the app is "listening" (it isn't).
 * That tension is art.
 */

export interface Haunting {
  text: string;
  type: 'echo' | 'prophecy' | 'mirror';
  fadeIn: number; // ms delay before appearing
}

const HAUNTING_TEMPLATES = {
  echo: [
    'someone else was thinking about {word} too.',
    'a thought about {word} drifted past just now.',
    '{word}... again.',
    'the fog remembers {word}.',
  ],
  prophecy: [
    'you will return to this thought in three days.',
    'something you haven\'t written yet connects to this.',
    'this thought has a future you can\'t see.',
    'in a few weeks, this will mean something different.',
  ],
  mirror: [
    'this feels familiar, doesn\'t it?',
    'you\'ve thought this before. not here.',
    'the shape of this thought is older than you think.',
    'somewhere, another mind traced this exact pattern.',
  ],
};

const HAUNTING_KEY = 'brainchild-hauntings';

function getHauntingHistory(): { count: number; lastHaunting: number } {
  try {
    const data = localStorage.getItem(HAUNTING_KEY);
    return data ? JSON.parse(data) : { count: 0, lastHaunting: 0 };
  } catch {
    return { count: 0, lastHaunting: 0 };
  }
}

export function useCognitiveHauntings(thoughts: Thought[]) {
  const [haunting, setHaunting] = useState<Haunting | null>(null);
  const checkRef = useRef(false);

  const generateHaunting = useCallback((): Haunting | null => {
    const history = getHauntingHistory();
    const now = Date.now();
    
    // Max once per 4 hours
    if (now - history.lastHaunting < 4 * 60 * 60_000) return null;
    
    // 8% chance per check
    if (Math.random() > 0.08) return null;
    
    const types: Array<'echo' | 'prophecy' | 'mirror'> = ['echo', 'prophecy', 'mirror'];
    const type = types[Math.floor(Math.random() * types.length)];
    const templates = HAUNTING_TEMPLATES[type];
    let text = templates[Math.floor(Math.random() * templates.length)];
    
    // For echo type, extract a keyword from recent thoughts
    if (type === 'echo' && thoughts.length > 0) {
      const recentThought = thoughts[Math.floor(Math.random() * Math.min(thoughts.length, 5))];
      const words = recentThought.content
        .split(/\s+/)
        .filter(w => w.length > 4)
        .map(w => w.toLowerCase().replace(/[^a-z]/g, ''));
      
      if (words.length > 0) {
        const keyword = words[Math.floor(Math.random() * words.length)];
        text = text.replace('{word}', keyword);
      } else {
        text = text.replace('{word}', 'this');
      }
    }
    
    localStorage.setItem(HAUNTING_KEY, JSON.stringify({
      count: history.count + 1,
      lastHaunting: now,
    }));
    
    return {
      text,
      type,
      fadeIn: 2000 + Math.random() * 4000,
    };
  }, [thoughts]);

  useEffect(() => {
    if (checkRef.current) return;
    checkRef.current = true;
    
    // Check after a delay (feels more natural)
    const timer = setTimeout(() => {
      const h = generateHaunting();
      if (h) {
        setTimeout(() => {
          setHaunting(h);
          // Auto-dismiss after 10-15 seconds
          setTimeout(() => setHaunting(null), 10000 + Math.random() * 5000);
        }, h.fadeIn);
      }
    }, 30_000 + Math.random() * 60_000); // 30s-90s after mount
    
    return () => clearTimeout(timer);
  }, [generateHaunting]);

  const dismissHaunting = useCallback(() => setHaunting(null), []);

  return { haunting, dismissHaunting };
}
