import { useState, useCallback } from 'react';
import { Thought } from '@/types/thought';
import { supabase } from '@/integrations/supabase/client';
import { WritingTone, CognitiveProfile } from '@/hooks/useIdentityDrift';
import { toast } from 'sonner';

interface PatternWhisperState {
  whisper: string | null;
  isLoading: boolean;
}

const WHISPER_KEY = 'brainchild-last-whisper';
const WHISPER_COOLDOWN = 60 * 60_000; // 1 hour cooldown

export function usePatternWhisper() {
  const [state, setState] = useState<PatternWhisperState>({
    whisper: null,
    isLoading: false,
  });

  const requestWhisper = useCallback(
    async (thoughts: Thought[], tone?: WritingTone, profile?: CognitiveProfile) => {
      // Check cooldown
      const lastWhisper = localStorage.getItem(WHISPER_KEY);
      if (lastWhisper && Date.now() - parseInt(lastWhisper) < WHISPER_COOLDOWN) {
        toast('the fog already whispered recently.', {
          description: 'pattern observations refresh hourly',
        });
        return;
      }

      if (thoughts.length < 3) {
        toast('not enough thoughts for the fog to observe.', {
          description: 'write a few more before asking',
        });
        return;
      }

      setState({ whisper: null, isLoading: true });

      try {
        const contents = thoughts.slice(0, 15).map((t) => t.content);

        const { data, error } = await supabase.functions.invoke('thought-reflect', {
          body: {
            action: 'whisper',
            thoughts: contents,
            tone,
            profile,
          },
        });

        if (error) throw error;

        if (data?.error) {
          toast(data.error);
          setState({ whisper: null, isLoading: false });
          return;
        }

        localStorage.setItem(WHISPER_KEY, String(Date.now()));
        setState({ whisper: data.result, isLoading: false });
      } catch (err) {
        console.error('[brainchild] whisper error:', err);
        toast('the fog went silent.');
        setState({ whisper: null, isLoading: false });
      }
    },
    []
  );

  const dismissWhisper = useCallback(() => {
    setState({ whisper: null, isLoading: false });
  }, []);

  return {
    ...state,
    requestWhisper,
    dismissWhisper,
  };
}
