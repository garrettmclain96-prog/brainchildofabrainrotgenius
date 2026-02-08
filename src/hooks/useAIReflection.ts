import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIReflectionState {
  reflection: string | null;
  isLoading: boolean;
  thoughtId: string | null;
}

const REFLECTION_COOLDOWN_KEY = 'brainchild-last-reflection';
const COOLDOWN_MS = 30_000; // 30 seconds between reflections

export function useAIReflection() {
  const [state, setState] = useState<AIReflectionState>({
    reflection: null,
    isLoading: false,
    thoughtId: null,
  });

  const requestReflection = useCallback(async (thoughtId: string, content: string) => {
    // Check cooldown
    const lastReflection = localStorage.getItem(REFLECTION_COOLDOWN_KEY);
    if (lastReflection && Date.now() - parseInt(lastReflection) < COOLDOWN_MS) {
      toast('the fog needs a moment to think.', {
        description: 'reflections are available every 30 seconds',
      });
      return;
    }

    setState({ reflection: null, isLoading: true, thoughtId });

    try {
      const { data, error } = await supabase.functions.invoke('thought-reflect', {
        body: { action: 'reflect', content },
      });

      if (error) throw error;

      if (data?.error) {
        // Handle rate limit / payment errors gracefully
        toast(data.error);
        setState({ reflection: null, isLoading: false, thoughtId: null });
        return;
      }

      localStorage.setItem(REFLECTION_COOLDOWN_KEY, String(Date.now()));
      setState({ reflection: data.result, isLoading: false, thoughtId });
    } catch (err) {
      console.error('[brainchild] reflection error:', err);
      toast('the fog couldn\'t respond.');
      setState({ reflection: null, isLoading: false, thoughtId: null });
    }
  }, []);

  const dismissReflection = useCallback(() => {
    setState({ reflection: null, isLoading: false, thoughtId: null });
  }, []);

  return {
    ...state,
    requestReflection,
    dismissReflection,
  };
}
