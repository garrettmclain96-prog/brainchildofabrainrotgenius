import { useState, useEffect, useRef, useCallback } from 'react';
import { Thought } from '@/types/thought';

/**
 * Temporal Inversions — Time is not linear.
 * 
 * Occasionally, a future-dated note appears. A summary references
 * something you haven't written yet. Later, you realize it was
 * assembled from latent patterns. This creates myth.
 */

export interface TemporalInversion {
  id: string;
  content: string;
  futureDate: Date;
  type: 'prediction' | 'echo-forward' | 'synthesis';
}

const INVERSION_KEY = 'brainchild-temporal-inversions';

const PREDICTION_TEMPLATES = [
  'in {days} days you will think about: {topic}',
  'a thought is forming that you haven\'t had yet: {topic}',
  'future fragment — {date}: {topic}',
  '{topic}. (this hasn\'t happened yet.)',
  'note from {date}: you were right about {topic}.',
];

function extractTopics(thoughts: Thought[]): string[] {
  const topics: string[] = [];
  
  thoughts.forEach(t => {
    // Extract significant word clusters
    const words = t.content.split(/\s+/).filter(w => w.length > 4);
    if (words.length > 0) {
      // Take 2-4 word phrases
      const start = Math.floor(Math.random() * Math.max(1, words.length - 2));
      const phrase = words.slice(start, start + 2 + Math.floor(Math.random() * 2)).join(' ');
      if (phrase.length > 5) topics.push(phrase.toLowerCase());
    }
  });
  
  return topics;
}

function getInversionState(): { inversions: TemporalInversion[]; lastInversion: number } {
  try {
    const data = localStorage.getItem(INVERSION_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        ...parsed,
        inversions: (parsed.inversions || []).map((i: any) => ({
          ...i,
          futureDate: new Date(i.futureDate),
        })),
      };
    }
  } catch { /* ignore */ }
  return { inversions: [], lastInversion: 0 };
}

export function useTemporalInversions(thoughts: Thought[]) {
  const [inversion, setInversion] = useState<TemporalInversion | null>(null);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current || thoughts.length < 3) return;
    checkedRef.current = true;

    const state = getInversionState();
    const now = Date.now();
    
    // Max once per 2 days
    if (now - state.lastInversion < 2 * 24 * 60 * 60_000) return;
    
    // 4% chance
    if (Math.random() > 0.04) return;

    const topics = extractTopics(thoughts);
    if (topics.length === 0) return;

    const topic = topics[Math.floor(Math.random() * topics.length)];
    const futureDays = 3 + Math.floor(Math.random() * 14);
    const futureDate = new Date(now + futureDays * 24 * 60 * 60_000);
    
    const template = PREDICTION_TEMPLATES[Math.floor(Math.random() * PREDICTION_TEMPLATES.length)];
    const dateStr = futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const content = template
      .replace('{days}', String(futureDays))
      .replace('{topic}', topic)
      .replace('{date}', dateStr);

    const newInversion: TemporalInversion = {
      id: `inv-${now}`,
      content,
      futureDate,
      type: Math.random() > 0.5 ? 'prediction' : 'echo-forward',
    };

    // Store for future reference
    const newState = {
      inversions: [...state.inversions.slice(-5), newInversion],
      lastInversion: now,
    };
    localStorage.setItem(INVERSION_KEY, JSON.stringify(newState));

    // Show after a moody delay
    setTimeout(() => {
      setInversion(newInversion);
      setTimeout(() => setInversion(null), 12000);
    }, 45_000 + Math.random() * 90_000);
  }, [thoughts]);

  const dismissInversion = useCallback(() => setInversion(null), []);

  return { inversion, dismissInversion };
}
