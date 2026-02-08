import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const LEAVING_PROMPTS = [
  "You're already on your way out.",
  "What are you leaving behind?",
  "Closure is optional.",
  "The exit is also an entrance.",
  "What you leave behind stays.",
  "Some thoughts only appear when you're leaving.",
  "This one surfaced because you're going.",
  "You don't have to resolve anything before you leave.",
  "The door is already open.",
  "Nothing here will wait for you.",
];

const smoothEase: [number, number, number, number] = [0.23, 1, 0.32, 1];

export function useLeavingRoom() {
  const [isLeaving, setIsLeaving] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = () => {
      // Can't show custom UI on beforeunload, but we track intent
    };

    // Detect "leaving" via visibility change (tab switch, minimize)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !dismissed) {
        setPrompt(LEAVING_PROMPTS[Math.floor(Math.random() * LEAVING_PROMPTS.length)]);
        setIsLeaving(true);
      }
    };

    // Detect mouse leaving viewport (desktop)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !dismissed) {
        setPrompt(LEAVING_PROMPTS[Math.floor(Math.random() * LEAVING_PROMPTS.length)]);
        setIsLeaving(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [dismissed]);

  const dismiss = useCallback(() => {
    setIsLeaving(false);
    setDismissed(true);
    // Reset after 5 minutes so it can trigger again
    setTimeout(() => setDismissed(false), 5 * 60 * 1000);
  }, []);

  return { isLeaving, prompt, dismiss };
}

interface LeavingOverlayProps {
  isLeaving: boolean;
  prompt: string;
  onDismiss: () => void;
}

export function LeavingOverlay({ isLeaving, prompt, onDismiss }: LeavingOverlayProps) {
  if (!prompt) return null;

  return (
    <AnimatePresence>
      {isLeaving && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center pb-24 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: smoothEase }}
        >
          {/* Subtle darkening at edges */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/40" />

          <motion.div
            className={cn(
              'relative pointer-events-auto max-w-sm w-full mx-6',
              'glass-premium rounded-xl p-5',
              'zone-leaving-exit'
            )}
            initial={{ y: 30, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.6, ease: smoothEase }}
          >
            {/* Room label */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] font-thought text-muted-foreground/30 tracking-[0.2em] uppercase">
                ⟶ leaving
              </span>
            </div>

            <p className="font-thought text-sm text-card-foreground/70 leading-relaxed tracking-wide">
              {prompt}
            </p>

            <div className="mt-4 flex justify-end">
              <motion.button
                onClick={onDismiss}
                className="px-4 py-2 rounded-xl text-[10px] font-thought text-muted-foreground/40
                           border border-border/15 hover:border-border/30 hover:text-muted-foreground/60
                           transition-all duration-500"
                whileTap={{ scale: 0.95 }}
              >
                stay a moment
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
