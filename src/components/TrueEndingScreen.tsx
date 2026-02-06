import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThoughtStore } from '@/stores/thoughtStore';

interface TrueEndingScreenProps {
  phase: 'offering' | 'ceremony' | 'complete';
  onBegin: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

export function TrueEndingScreen({ phase, onBegin, onAccept, onDecline }: TrueEndingScreenProps) {
  const { dissolveEverything } = useThoughtStore();
  const [ceremonyStep, setCeremonyStep] = useState(0);

  const handleAccept = useCallback(() => {
    dissolveEverything();
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
            complete.
          </motion.p>

          <motion.div
            className="w-16 h-[1px] mx-auto bg-muted-foreground/10"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 3, duration: 2 }}
          />

          <motion.p
            className="text-xs text-muted-foreground/20 font-thought leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4, duration: 2 }}
          >
            what was here is no longer held.
            <br /><br />
            that is not the same as gone.
          </motion.p>
        </div>
      </motion.div>
    );
  }

  if (phase === 'ceremony') {
    const ceremonyTexts = [
      'each fragment was a decision to externalize.',
      'what decayed was not wasted.',
      'the container served its purpose.',
      'you are not the same as when you started.',
      'this can end now.',
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
              className="text-foreground/50 font-thought text-base leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1 }}
            >
              {ceremonyTexts[ceremonyStep]}
            </motion.p>
          </AnimatePresence>

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
              continue
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
                end
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
            you may not need this anymore.
          </motion.p>

          <motion.p
            className="text-muted-foreground/30 text-xs font-thought leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4, duration: 1.5 }}
          >
            this is not a deletion. it is a completion.
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
              begin
            </motion.button>

            <motion.button
              onClick={onDecline}
              className="w-full px-6 py-3 text-xs font-thought
                text-muted-foreground/15 hover:text-muted-foreground/30
                transition-colors duration-700"
            >
              not yet
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
