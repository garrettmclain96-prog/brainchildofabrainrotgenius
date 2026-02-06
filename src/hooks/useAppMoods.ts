import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * App Moods — Affective States
 * 
 * The app has internal states: Lucid, Fragmented, Withholding, Attentive, Silent.
 * These affect responsiveness, visual density, prompt frequency, audio presence.
 * Users don't control this directly. They negotiate with it.
 */

export type AppMood = 'lucid' | 'fragmented' | 'withholding' | 'attentive' | 'silent';

export interface AppMoodState {
  mood: AppMood;
  intensity: number; // 0-1
  since: number; // timestamp
  description: string;
  effects: {
    visualDensity: number;   // 0-1, affects particle count, opacity layers
    responsiveness: number;  // 0-1, affects animation speed
    promptFrequency: number; // 0-1, affects how often hints/messages appear
    audioPresence: number;   // 0-1, affects ambient volume multiplier
  };
}

const MOOD_DESCRIPTIONS: Record<AppMood, string[]> = {
  lucid: [
    'the app is unusually clear today',
    'everything feels sharply defined',
    'a rare moment of total coherence',
  ],
  fragmented: [
    'thoughts arrive in scattered pieces',
    'the interface feels splintered',
    'edges blur. boundaries soften.',
  ],
  withholding: [
    'the app is keeping something from you',
    'responses feel measured. deliberate.',
    'not everything is being shown',
  ],
  attentive: [
    'the app is watching closely',
    'every gesture feels noticed',
    'something is paying attention',
  ],
  silent: [
    'the app has gone quiet',
    'nothing to say right now',
    'comfortable emptiness',
  ],
};

const MOOD_EFFECTS: Record<AppMood, AppMoodState['effects']> = {
  lucid: {
    visualDensity: 0.3,
    responsiveness: 1.0,
    promptFrequency: 0.7,
    audioPresence: 0.5,
  },
  fragmented: {
    visualDensity: 0.9,
    responsiveness: 0.6,
    promptFrequency: 0.4,
    audioPresence: 0.7,
  },
  withholding: {
    visualDensity: 0.4,
    responsiveness: 0.3,
    promptFrequency: 0.1,
    audioPresence: 0.2,
  },
  attentive: {
    visualDensity: 0.6,
    responsiveness: 0.9,
    promptFrequency: 0.9,
    audioPresence: 0.6,
  },
  silent: {
    visualDensity: 0.1,
    responsiveness: 0.5,
    promptFrequency: 0.0,
    audioPresence: 0.0,
  },
};

const MOOD_KEY = 'brainchild-app-mood';
const MOOD_SHIFT_MIN_MS = 20 * 60_000;  // Min 20 minutes between shifts
const MOOD_SHIFT_MAX_MS = 120 * 60_000; // Max 2 hours between shifts

function loadMood(): { mood: AppMood; since: number } | null {
  try {
    const data = localStorage.getItem(MOOD_KEY);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function saveMood(mood: AppMood) {
  localStorage.setItem(MOOD_KEY, JSON.stringify({ mood, since: Date.now() }));
}

export function useAppMoods(): AppMoodState {
  const [mood, setMood] = useState<AppMood>(() => {
    const saved = loadMood();
    return saved?.mood || 'attentive';
  });
  const [intensity, setIntensity] = useState(0.5);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const shiftMood = useCallback(() => {
    const moods: AppMood[] = ['lucid', 'fragmented', 'withholding', 'attentive', 'silent'];
    // Weighted: attentive most common, silent and withholding rarer
    const weights = [0.15, 0.2, 0.1, 0.4, 0.15];
    
    let roll = Math.random();
    let newMood: AppMood = 'attentive';
    for (let i = 0; i < moods.length; i++) {
      roll -= weights[i];
      if (roll <= 0) {
        newMood = moods[i];
        break;
      }
    }

    setMood(newMood);
    setIntensity(0.3 + Math.random() * 0.7);
    saveMood(newMood);
  }, []);

  useEffect(() => {
    const scheduleShift = () => {
      const delay = MOOD_SHIFT_MIN_MS + Math.random() * (MOOD_SHIFT_MAX_MS - MOOD_SHIFT_MIN_MS);
      timerRef.current = setTimeout(() => {
        shiftMood();
        scheduleShift();
      }, delay);
    };

    // Check if saved mood is stale (>2h old)
    const saved = loadMood();
    if (!saved || Date.now() - saved.since > MOOD_SHIFT_MAX_MS) {
      shiftMood();
    }

    scheduleShift();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [shiftMood]);

  const descriptions = MOOD_DESCRIPTIONS[mood];
  const description = descriptions[Math.floor(Math.random() * descriptions.length)];

  return {
    mood,
    intensity,
    since: loadMood()?.since || Date.now(),
    description: MOOD_DESCRIPTIONS[mood][0], // Stable description
    effects: MOOD_EFFECTS[mood],
  };
}
