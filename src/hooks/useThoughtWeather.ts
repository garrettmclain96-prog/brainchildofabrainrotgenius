import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Thought Weather — the shared field has moods.
 * Turbulent, Quiet, Fragmented, Lucid.
 * Affects visuals and drift speed in the Public Fog.
 */

export type WeatherMood = 'turbulent' | 'quiet' | 'fragmented' | 'lucid';

export interface ThoughtWeather {
  mood: WeatherMood;
  intensity: number; // 0-1
  description: string;
  driftMultiplier: number;
}

const WEATHER_DESCRIPTIONS: Record<WeatherMood, string[]> = {
  turbulent: [
    'the fog churns with unrest',
    'thoughts collide and scatter',
    'a storm of ideas brews',
  ],
  quiet: [
    'the fog rests gently',
    'stillness between thoughts',
    'a calm has settled',
  ],
  fragmented: [
    'ideas arrive in pieces',
    'the fog splinters and reforms',
    'fragments drift without anchor',
  ],
  lucid: [
    'rare clarity in the fog',
    'thoughts align with unusual precision',
    'the collective mind sharpens',
  ],
};

const DRIFT_MULTIPLIERS: Record<WeatherMood, number> = {
  turbulent: 2.0,
  quiet: 0.5,
  fragmented: 1.5,
  lucid: 0.8,
};

export function useThoughtWeather(): ThoughtWeather {
  const [mood, setMood] = useState<WeatherMood>('quiet');
  const [intensity, setIntensity] = useState(0.5);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const shiftWeather = useCallback(() => {
    const moods: WeatherMood[] = ['turbulent', 'quiet', 'fragmented', 'lucid'];
    const weights = [0.2, 0.35, 0.25, 0.2]; // Quiet is most common

    let random = Math.random();
    let newMood: WeatherMood = 'quiet';
    for (let i = 0; i < moods.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        newMood = moods[i];
        break;
      }
    }

    setMood(newMood);
    setIntensity(0.3 + Math.random() * 0.7);
  }, []);

  useEffect(() => {
    // Weather shifts every 5-15 minutes
    const scheduleShift = () => {
      const delay = (5 + Math.random() * 10) * 60_000;
      timerRef.current = setTimeout(() => {
        shiftWeather();
        scheduleShift();
      }, delay);
    };

    shiftWeather(); // Initial weather
    scheduleShift();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [shiftWeather]);

  const descriptions = WEATHER_DESCRIPTIONS[mood];
  const description = descriptions[Math.floor(Math.random() * descriptions.length)];

  return {
    mood,
    intensity,
    description: WEATHER_DESCRIPTIONS[mood][0], // Stable description
    driftMultiplier: DRIFT_MULTIPLIERS[mood],
  };
}
