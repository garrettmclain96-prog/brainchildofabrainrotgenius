import { motion, AnimatePresence } from 'framer-motion';
import { QuietEndingState, resetQuietEnding } from '@/hooks/useQuietEnding';

interface QuietEndingScreenProps {
  state: QuietEndingState;
  onDismiss: () => void;
}

export function QuietEndingScreen({ state, onDismiss }: QuietEndingScreenProps) {
  const handleReawaken = () => {
    resetQuietEnding();
    onDismiss();
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {state.isActive && (
        <motion.div
          className="fixed inset-0 z-[110] bg-background flex flex-col items-center justify-center px-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
        >
          <motion.div
            className="max-w-sm text-center space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1.5 }}
          >
            {state.daysAway > 0 && (
              <motion.p
                className="text-xs text-muted-foreground/20 font-thought tracking-wider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                {state.daysAway} days since your last visit
              </motion.p>
            )}

            <motion.p
              className="font-thought text-base text-muted-foreground/50 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              {state.message}
            </motion.p>

            <motion.div
              className="flex flex-col gap-3 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3 }}
            >
              {state.isInert ? (
                <>
                  <button
                    onClick={handleReawaken}
                    className="px-6 py-3 rounded-xl font-thought text-sm bg-primary/10 text-primary/60 hover:bg-primary/20 transition-all"
                  >
                    start fresh
                  </button>
                  <p className="text-[9px] text-muted-foreground/15 font-thought">
                    this will clear everything and begin again
                  </p>
                </>
              ) : (
                <button
                  onClick={onDismiss}
                  className="px-6 py-3 rounded-xl font-thought text-sm text-muted-foreground/40 hover:text-muted-foreground/60 transition-all"
                >
                  continue
                </button>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
