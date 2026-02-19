import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/hooks/useSessionId';

interface PaymentWhisperData {
  id: string;
  message: string;
}

export function PaymentWhisper() {
  const [whisper, setWhisper] = useState<PaymentWhisperData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function check() {
      const sessionId = getSessionId();
      const { data } = await supabase
        .from('payment_whispers')
        .select('id, message')
        .eq('session_id', sessionId)
        .eq('seen', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) setWhisper(data);
    }
    check();
  }, []);

  const handleDismiss = async () => {
    setDismissed(true);
    if (whisper) {
      await supabase
        .from('payment_whispers')
        .update({ seen: true })
        .eq('id', whisper.id);
    }
  };

  if (!whisper || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className="glass-premium rounded-xl p-4 border border-destructive/10 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-3 text-muted-foreground/20 hover:text-muted-foreground/40 transition-all text-xs"
            aria-label="Dismiss"
          >
            ×
          </button>
          <p className="text-xs text-destructive-foreground/60 font-thought leading-relaxed pr-4">
            {whisper.message}
          </p>
          <span className="block mt-1.5 text-[8px] text-muted-foreground/20 font-thought tracking-wider">
            payment notice
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
