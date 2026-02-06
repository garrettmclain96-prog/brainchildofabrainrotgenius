import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThoughtStore } from '@/stores/thoughtStore';

interface TrueEndingScreenProps {
  phase: 'offering' | 'ceremony' | 'complete';
  onBegin: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * The True Ending — No app has the balls to do this.
 * 
 * "You don't need this anymore."
 * Not a deletion. A completion. A graduation.
 */
export function TrueEndingScreen({ phase, onBegin, onAccept, onDecline }: TrueEndingScreenProps) {
  const { dissolveEverything } = useThoughtStore();
  const [ceremonyStep, setCeremonyStep] = useState(0);

  const handleAccept = useCallback(() => {
    dissolveEverything();
    // Clear all brainchild localStorage
    const keysToKeep = ['brainchild-true-ending', 'brainchild-permanent-consequences'];
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('brainchild-'));
    allKeys.forEach(k => {
      if (!keysToKeep.includes(k)) localStorage.removeItem(k);
    });
    onAccept();
  }, [dissolveEverything, onAccept]);

  if (phase === 'complete') {
    return (
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center p-10 bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 3 }}
      >
        <div className="max-w-sm text-center space-y-8">
          <motion.p
            className="text-foreground/40 font-thought text-lg leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 2 }}
          >
            you graduated.
          </motion.p>

          <motion.div
            className="w-16 h-[1px] mx-auto bg-muted-foreground/10"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 3, duration: 2 }}
          />

          <motion.p
            className="text-xs text-muted-foreground/20 font-thought italic leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4, duration: 2 }}
          >
            the thoughts you had here shaped you in ways you can't measure.
            <br /><br />
            they decayed, as all thoughts do.
            <br /><br />
            but you are different now.
          </motion.p>

          <motion.p
            className="text-[10px] text-muted-foreground/10 font-thought tracking-[0.3em] uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 7, duration: 2 }}
          >
            take care of your mind
          </motion.p>
        </div>
      </motion.div>
    );
  }

  if (phase === 'ceremony') {
    const ceremonyTexts = [
      'every fragment you wrote was a small act of courage.',
      'the thoughts that decayed weren\'t lost — they became part of how you think.',
      'the fog received your words without judgment.',
      'you learned that forgetting is not failure.',
      'you are ready to think without this.',
    ];

    return (
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center p-10 bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        <div className="max-w-sm text-center space-y-10">
          <AnimatePresence mode="wait">
            <motion.p
              key={ceremonyStep}
              className="text-foreground/50 font-thought text-base leading-relaxed italic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1 }}
            >
              {ceremonyTexts[ceremonyStep]}
            </motion.p>
          </AnimatePresence>

          {/* Progress */}
          <div className="flex justify-center gap-2">
            {ceremonyTexts.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${
                  i <= ceremonyStep ? 'bg-foreground/30' : 'bg-muted-foreground/10'
                }`}
              />
            ))}
          </div>

          {ceremonyStep < ceremonyTexts.length - 1 ? (
            <motion.button
              onClick={() => setCeremonyStep(s => s + 1)}
              className="text-xs text-muted-foreground/30 hover:text-muted-foreground/50 font-thought transition-colors"
            >
              continue →
            </motion.button>
          ) : (
            <div className="space-y-4">
              <motion.button
                onClick={handleAccept}
                className="w-full px-6 py-3.5 rounded-xl text-sm font-thought
                  bg-foreground/5 text-foreground/50 border border-foreground/10
                  hover:bg-foreground/10 hover:text-foreground/70
                  transition-all duration-700 tracking-wider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                whileTap={{ scale: 0.97 }}
              >
                complete my journey
              </motion.button>

              <motion.button
                onClick={onDecline}
                className="text-[10px] text-muted-foreground/15 hover:text-muted-foreground/30 font-thought transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
              >
                not yet
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Offering phase
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center p-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 3 }}
      >
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm" />
        
        <div className="relative z-10 max-w-sm text-center space-y-8">
          <motion.div
            className="text-foreground/10 text-4xl"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2, delay: 1 }}
          >
            ◯
          </motion.div>

          <motion.p
            className="text-foreground/50 font-thought text-lg leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 1.5 }}
          >
            You don't need this anymore.
          </motion.p>

          <motion.p
            className="text-muted-foreground/30 text-xs font-thought leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4, duration: 1.5 }}
          >
            You've been here long enough to learn how to think without it.
            <br /><br />
            This is not a deletion. It's a completion.
          </motion.p>

          <motion.div
            className="space-y-4 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 6, duration: 1.5 }}
          >
            <motion.button
              onClick={onBegin}
              className="w-full px-6 py-3.5 rounded-xl text-sm font-thought
                bg-foreground/5 text-foreground/40 border border-foreground/10
                hover:bg-foreground/10 hover:text-foreground/60
                transition-all duration-700 tracking-wider"
              whileTap={{ scale: 0.97 }}
            >
              I'm ready
            </motion.button>

            <motion.button
              onClick={onDecline}
              className="w-full px-6 py-3 text-xs font-thought
                text-muted-foreground/15 hover:text-muted-foreground/30
                transition-colors duration-700"
            >
              not yet — I still need this
            </motion.button>
          </motion.div>

          <motion.p
            className="text-[8px] text-muted-foreground/8 tracking-[0.3em] uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 8, duration: 2 }}
          >
            this offer is not permanent
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
