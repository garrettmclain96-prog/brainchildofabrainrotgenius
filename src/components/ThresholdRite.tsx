import { motion, AnimatePresence } from 'framer-motion';

interface ThresholdRiteProps {
  isOpen: boolean;
  question: string;
  onComplete: () => void;
}

/**
 * A single quiet question that precedes the day's first thought.
 * One action, no skip-shaming, no streaks.
 */
export function ThresholdRite({ isOpen, question, onComplete }: ThresholdRiteProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-8 bg-background/92 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
          role="dialog"
          aria-label="Threshold"
        >
          <div className="max-w-sm text-center space-y-10">
            <motion.p
              className="font-display text-xl text-foreground/80 leading-relaxed tracking-wide"
              initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.4, delay: 0.3 }}
            >
              {question}
            </motion.p>

            <motion.button
              onClick={onComplete}
              className="min-h-[44px] px-6 text-xs font-thought italic tracking-[0.2em] text-muted-foreground/50 hover:text-primary/70 transition-colors duration-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 1.6 }}
              whileTap={{ scale: 0.96 }}
            >
              enter
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
