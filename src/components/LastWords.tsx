import { motion, AnimatePresence } from 'framer-motion';
import { Thought } from '@/types/thought';

interface LastWordsProps {
  thought: Thought | null;
  onKeep: (id: string) => void;
  onRelease: (id: string) => void;
  onDismiss: () => void;
}

/**
 * The final appearance of a thought before it decays completely.
 * Two choices, both final, neither urgent.
 */
export function LastWords({ thought, onKeep, onRelease, onDismiss }: LastWordsProps) {
  return (
    <AnimatePresence>
      {thought && (
        <motion.div
          className="fixed inset-x-0 bottom-24 z-40 px-5 flex justify-center"
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 12, filter: 'blur(10px)' }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="w-full max-w-sm glass-premium rounded-2xl px-5 py-4 space-y-4 border border-border/15">
            <p className="text-[10px] font-sans uppercase tracking-[0.22em] text-muted-foreground/40">
              last words
            </p>

            <p className="font-thought italic text-sm text-foreground/60 leading-relaxed line-clamp-3">
              {thought.content}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => onKeep(thought.id)}
                className="flex-1 min-h-[44px] rounded-xl text-xs font-thought italic text-primary/85 bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-all duration-500"
              >
                keep it
              </button>
              <button
                onClick={() => onRelease(thought.id)}
                className="flex-1 min-h-[44px] rounded-xl text-xs font-thought italic text-muted-foreground/55 bg-secondary/15 hover:text-muted-foreground/75 transition-all duration-500"
              >
                let it go
              </button>
            </div>

            <button
              onClick={onDismiss}
              className="w-full min-h-[36px] text-[10px] font-sans tracking-[0.18em] text-muted-foreground/25 hover:text-muted-foreground/45 transition-colors duration-500"
              aria-label="Dismiss last words"
            >
              leave it to time
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
