import { useState, useEffect, useCallback, useRef } from 'react';
import { Thought } from '@/types/thought';

export interface EasterEgg {
  id: string;
  type: 'koan' | 'glitch' | 'recombination' | 'whisper';
  content: string;
  duration: number; // ms
}

const KOANS = [
  'the thought you forgot was the one that mattered most.',
  'what if the best idea is the one you let go?',
  'a mind full of notes is a mind afraid of silence.',
  'the fog does not judge. it holds, then releases.',
  'every saved thought is a small act of fear.',
  'decay is not destruction. it is transformation.',
  'the graveyard of ideas feeds the garden of the next.',
  'you are not your thoughts. you are the space between them.',
  'forgetting is the mind\'s way of composting.',
  'what dissolves in the fog becomes part of the air.',
  'the best thoughts arrive when you stop hoarding the old ones.',
  'there is no such thing as a wasted thought.',
  'brainrot is the soil from which genius grows.',
  'hold loosely. let the wind decide.',
];

const WHISPERS = [
  '...something is shifting in the fog...',
  '...a thought you released is still traveling...',
  '...the compost heap stirs...',
  '...somewhere, an idea just dissolved...',
  '...the silence between thoughts is where meaning lives...',
  '...a fragment remembers being whole...',
];

const GLITCH_MESSAGES = [
  'ERR: meaning_overflow',
  'WARNING: thought_density_critical',
  'SYS: composting in progress...',
  'LOG: idea #∞ recycled successfully',
  'NOTICE: the void says hello',
];

function generateRecombination(thoughts: Thought[]): string | null {
  if (thoughts.length < 2) return null;

  const validThoughts = thoughts.filter((t) => t.content.length > 10 && t.decayLevel < 80);
  if (validThoughts.length < 2) return null;

  const t1 = validThoughts[Math.floor(Math.random() * validThoughts.length)];
  let t2 = validThoughts[Math.floor(Math.random() * validThoughts.length)];
  // Ensure different thoughts
  let attempts = 0;
  while (t2.id === t1.id && attempts < 5) {
    t2 = validThoughts[Math.floor(Math.random() * validThoughts.length)];
    attempts++;
  }
  if (t2.id === t1.id) return null;

  const words1 = t1.content.split(' ');
  const words2 = t2.content.split(' ');

  // Take first half of one, second half of other
  const halfPoint1 = Math.floor(words1.length / 2);
  const halfPoint2 = Math.ceil(words2.length / 2);

  const recombined = [...words1.slice(0, halfPoint1), '…', ...words2.slice(halfPoint2)].join(' ');

  return recombined;
}

export function useEasterEggs(thoughts: Thought[]) {
  const [activeEgg, setActiveEgg] = useState<EasterEgg | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastEggRef = useRef<number>(0);

  const triggerEgg = useCallback(() => {
    const now = Date.now();
    // Rate limit: minimum 3 minutes between eggs
    if (now - lastEggRef.current < 180_000) return;

    const random = Math.random();
    let egg: EasterEgg | null = null;

    if (random < 0.4) {
      // Koan (most common)
      egg = {
        id: String(now),
        type: 'koan',
        content: KOANS[Math.floor(Math.random() * KOANS.length)],
        duration: 6000,
      };
    } else if (random < 0.6) {
      // Whisper
      egg = {
        id: String(now),
        type: 'whisper',
        content: WHISPERS[Math.floor(Math.random() * WHISPERS.length)],
        duration: 4000,
      };
    } else if (random < 0.8) {
      // Recombination
      const recombined = generateRecombination(thoughts);
      if (recombined) {
        egg = {
          id: String(now),
          type: 'recombination',
          content: recombined,
          duration: 8000,
        };
      }
    } else {
      // Glitch
      egg = {
        id: String(now),
        type: 'glitch',
        content: GLITCH_MESSAGES[Math.floor(Math.random() * GLITCH_MESSAGES.length)],
        duration: 3000,
      };
    }

    if (egg) {
      lastEggRef.current = now;
      setActiveEgg(egg);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setActiveEgg(null);
      }, egg.duration);
    }
  }, [thoughts]);

  // Random chance to trigger on interval
  useEffect(() => {
    const interval = setInterval(() => {
      // ~5% chance every 45 seconds = roughly once every 15 minutes
      if (Math.random() < 0.05 && thoughts.length > 0) {
        triggerEgg();
      }
    }, 45_000);

    return () => clearInterval(interval);
  }, [triggerEgg, thoughts.length]);

  const dismissEgg = useCallback(() => {
    setActiveEgg(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { activeEgg, triggerEgg, dismissEgg };
}
