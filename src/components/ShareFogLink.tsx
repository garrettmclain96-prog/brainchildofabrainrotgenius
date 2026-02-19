import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ShareFogLinkProps {
  thoughtId: string;
  sessionId: string;
}

export function ShareFogLink({ thoughtId, sessionId }: ShareFogLinkProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'copied'>('idle');

  const handleShare = async () => {
    if (state === 'loading') return;
    setState('loading');

    try {
      const { data, error } = await supabase.functions.invoke('share-thought', {
        body: { thought_id: thoughtId, session_id: sessionId },
      });

      if (error || !data?.slug) {
        console.error('Share error:', error);
        setState('idle');
        return;
      }

      const url = `${window.location.origin}/fog/${data.slug}`;
      await navigator.clipboard.writeText(url);
      setState('copied');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('idle');
    }
  };

  return (
    <motion.button
      onClick={handleShare}
      className={cn(
        'min-w-[44px] min-h-[44px] flex items-center justify-center px-3 rounded-xl text-xs font-thought transition-all duration-500',
        state === 'copied'
          ? 'bg-primary/15 text-primary/70'
          : 'bg-muted/10 text-muted-foreground/40 hover:bg-muted/20 hover:text-muted-foreground/60'
      )}
      whileTap={{ scale: 0.92 }}
      aria-label="Share this thought"
      disabled={state === 'loading'}
    >
      {state === 'loading' ? '...' : state === 'copied' ? 'copied' : 'share'}
    </motion.button>
  );
}
