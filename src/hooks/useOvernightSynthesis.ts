import { useState, useEffect, useCallback } from 'react';
import { Thought } from '@/types/thought';

interface SynthesisState {
  hasSynthesis: boolean;
  synthesis: string | null;
  decayedCount: number;
  dominantCategory: string | null;
}

const SYNTHESIS_KEY = 'brainchild-last-synthesis';
const LAST_VISIT_KEY = 'brainchild-last-visit';
const MIN_ABSENCE_HOURS = 4; // Show synthesis after 4+ hours away

// Surreal synthesis templates
const TEMPLATES = {
  poetic: [
    'while you slept, {count} thoughts dissolved into the substrate. {category_line}the fog remembers fragments you\'ve already forgotten.',
    'the compost heap grew richer. {count} ideas returned to soil. {category_line}something new is germinating in the dark.',
    '{count} thoughts completed their lifecycle. {category_line}in their absence, the silence hums a little louder.',
    'the garden composted {count} fragments overnight. {category_line}what remains has chosen to stay.',
  ],
  absurd: [
    'a committee of {count} expired thoughts held a meeting in your subconscious. they voted unanimously to become something else. {category_line}minutes were not recorded.',
    '{count} ideas tried to leave through the back door. some made it. {category_line}the rest became wallpaper.',
    'overnight report: {count} thoughts successfully forgot themselves. {category_line}the fog congratulates their courage.',
    'while you were away, {count} fragments played musical chairs with meaning. {category_line}nobody won. everyone dissolved.',
  ],
  unsettling: [
    '{count} thoughts decayed while you were gone. {category_line}they didn\'t mind. did you?',
    'the app noticed your absence. {count} fragments used the time to dissolve. {category_line}the silence was productive.',
    '{count} thoughts chose not to wait for you. {category_line}this is what freedom looks like from the inside.',
    'you left {count} thoughts unattended. {category_line}they became something else while you weren\'t looking.',
  ],
};

function generateSynthesis(decayedCount: number, dominantCategory: string | null): string {
  const toneKeys = Object.keys(TEMPLATES) as (keyof typeof TEMPLATES)[];
  const tone = toneKeys[Math.floor(Math.random() * toneKeys.length)];
  const templates = TEMPLATES[tone];
  const template = templates[Math.floor(Math.random() * templates.length)];

  const categoryLine = dominantCategory
    ? `most were ${dominantCategory}. `
    : '';

  return template
    .replace('{count}', String(decayedCount))
    .replace('{category_line}', categoryLine);
}

export function useOvernightSynthesis(thoughts: Thought[]) {
  const [state, setState] = useState<SynthesisState>({
    hasSynthesis: false,
    synthesis: null,
    decayedCount: 0,
    dominantCategory: null,
  });

  useEffect(() => {
    const now = Date.now();
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    const lastSynthesis = localStorage.getItem(SYNTHESIS_KEY);

    // Record current visit
    localStorage.setItem(LAST_VISIT_KEY, String(now));

    if (!lastVisit) return;

    const hoursSinceVisit = (now - parseInt(lastVisit)) / (1000 * 60 * 60);

    if (hoursSinceVisit < MIN_ABSENCE_HOURS) return;

    // Don't show if already shown this session
    if (lastSynthesis && now - parseInt(lastSynthesis) < 1000 * 60 * 60) return;

    // Count decayed thoughts (high decay level)
    const decayedThoughts = thoughts.filter((t) => t.decayLevel > 70);
    const decayedCount = decayedThoughts.length;

    if (decayedCount === 0) return;

    // Find dominant category
    const catCounts = new Map<string, number>();
    decayedThoughts.forEach((t) => {
      if (t.category !== 'uncategorized') {
        catCounts.set(t.category, (catCounts.get(t.category) || 0) + 1);
      }
    });

    let dominantCategory: string | null = null;
    let maxCount = 0;
    catCounts.forEach((count, cat) => {
      if (count > maxCount) {
        maxCount = count;
        dominantCategory = cat;
      }
    });

    const synthesis = generateSynthesis(decayedCount, dominantCategory);

    localStorage.setItem(SYNTHESIS_KEY, String(now));

    setState({
      hasSynthesis: true,
      synthesis,
      decayedCount,
      dominantCategory,
    });
  }, [thoughts]);

  const dismissSynthesis = useCallback(() => {
    setState((prev) => ({ ...prev, hasSynthesis: false }));
  }, []);

  return { ...state, dismissSynthesis };
}
