import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const WHISPER_SEEN_KEY = 'brainchild-whisper-seen';

interface Whisper {
  id: string;
  content: string;
  brand: string;
  brand_url: string | null;
}

export function SponsoredWhisper() {
  const [whisper, setWhisper] = useState<Whisper | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Frequency cap: max 1 per session
    const seen = sessionStorage.getItem(WHISPER_SEEN_KEY);
    if (seen) return;

    async function fetchWhisper() {
      const { data, error } = await supabase
        .from('sponsored_whispers')
        .select('id, content, brand, brand_url')
        .gte('active_until', new Date().toISOString())
        .lte('active_from', new Date().toISOString())
        .limit(5);

      if (error || !data || data.length === 0) return;

      // Pick a random active whisper
      const picked = data[Math.floor(Math.random() * data.length)];
      setWhisper(picked);
      sessionStorage.setItem(WHISPER_SEEN_KEY, picked.id);
    }

    // Delay whisper appearance — never during active writing
    const timer = setTimeout(fetchWhisper, 45000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => setDismissed(true);

  if (!whisper || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 max-w-sm w-full px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className="glass-premium rounded-xl p-4 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-3 text-muted-foreground/20 hover:text-muted-foreground/40 transition-all text-xs"
            aria-label="Dismiss whisper"
          >
            ×
          </button>

          <p className="text-xs text-muted-foreground/50 font-thought leading-relaxed pr-4">
            {whisper.content}
          </p>

          <div className="mt-2 flex items-center justify-between">
            {whisper.brand_url ? (
              <a
                href={whisper.brand_url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'text-[9px] text-muted-foreground/25 hover:text-muted-foreground/40',
                  'font-thought tracking-wider transition-all duration-500'
                )}
              >
                — {whisper.brand}
              </a>
            ) : (
              <span className="text-[9px] text-muted-foreground/25 font-thought tracking-wider">
                — {whisper.brand}
              </span>
            )}
            <span className="text-[8px] text-muted-foreground/15 font-thought">whisper</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
