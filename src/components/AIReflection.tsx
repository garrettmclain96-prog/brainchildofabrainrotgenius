import { motion, AnimatePresence } from 'framer-motion';

interface AIReflectionProps {
  reflection: string | null;
  isLoading: boolean;
  onDismiss: () => void;
}

export function AIReflection({ reflection, isLoading, onDismiss }: AIReflectionProps) {
  return (
    <AnimatePresence>
      {(reflection || isLoading) && (
        <motion.div
          className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10"
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          {isLoading ? (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-primary/30"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-[11px] font-thought text-muted-foreground/40 italic">
                the fog is thinking...
              </span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-2"
            >
              <p className="text-xs font-thought text-foreground/60 leading-relaxed italic">
                {reflection}
              </p>
              <button
                onClick={onDismiss}
                className="text-[10px] font-thought text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors"
              >
                dissolve
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
