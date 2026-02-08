import { useState, useEffect, useCallback } from 'react';
import { Thought } from '@/types/thought';
import { supabase } from '@/integrations/supabase/client';

interface AISynthesisState {
  hasSynthesis: boolean;
  synthesis: string | null;
  decayedCount: number;
  isLoading: boolean;
}

const AI_SYNTHESIS_KEY = 'brainchild-ai-synthesis';
const LAST_VISIT_KEY = 'brainchild-last-visit';
const MIN_ABSENCE_HOURS = 4;

// Fallback templates when AI is unavailable
const FALLBACK_TEMPLATES = [
  'while you slept, {count} thoughts dissolved into the substrate. the fog remembers fragments you\'ve already forgotten.',
  'the compost heap grew richer. {count} ideas returned to soil. something new is germinating in the dark.',
  '{count} thoughts completed their lifecycle. in their absence, the silence hums a little louder.',
];

export function useAISynthesis(thoughts: Thought[]) {
  const [state, setState] = useState<AISynthesisState>({
    hasSynthesis: false,
    synthesis: null,
    decayedCount: 0,
    isLoading: false,
  });

  useEffect(() => {
    const now = Date.now();
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    const lastSynthesis = localStorage.getItem(AI_SYNTHESIS_KEY);

    // Record current visit
    localStorage.setItem(LAST_VISIT_KEY, String(now));

    if (!lastVisit) return;

    const hoursSinceVisit = (now - parseInt(lastVisit)) / (1000 * 60 * 60);
    if (hoursSinceVisit < MIN_ABSENCE_HOURS) return;

    // Don't show if already shown recently
    if (lastSynthesis && now - parseInt(lastSynthesis) < 1000 * 60 * 60) return;

    // Find decayed thoughts
    const decayedThoughts = thoughts.filter((t) => t.decayLevel > 70);
    const decayedCount = decayedThoughts.length;

    if (decayedCount === 0) return;

    // Try AI synthesis
    setState((prev) => ({ ...prev, isLoading: true, decayedCount }));

    const fetchAISynthesis = async () => {
      try {
        const fragments = decayedThoughts
          .slice(0, 10)
          .map((t) => t.content);

        const { data, error } = await supabase.functions.invoke('thought-reflect', {
          body: { action: 'synthesize', decayedThoughts: fragments },
        });

        if (error || data?.error) {
          throw new Error(data?.error || 'AI unavailable');
        }

        localStorage.setItem(AI_SYNTHESIS_KEY, String(Date.now()));
        setState({
          hasSynthesis: true,
          synthesis: data.result,
          decayedCount,
          isLoading: false,
        });
      } catch {
        // Fallback to template
        const template = FALLBACK_TEMPLATES[Math.floor(Math.random() * FALLBACK_TEMPLATES.length)];
        const fallback = template.replace('{count}', String(decayedCount));

        localStorage.setItem(AI_SYNTHESIS_KEY, String(Date.now()));
        setState({
          hasSynthesis: true,
          synthesis: fallback,
          decayedCount,
          isLoading: false,
        });
      }
    };

    fetchAISynthesis();
  }, [thoughts]);

  const dismissSynthesis = useCallback(() => {
    setState((prev) => ({ ...prev, hasSynthesis: false }));
  }, []);

  return { ...state, dismissSynthesis };
}
