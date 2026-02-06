import { motion, AnimatePresence } from 'framer-motion';
import { CoThinkingPresence } from '@/hooks/useCoThinking';

interface CoThinkingIndicatorProps {
  presence: CoThinkingPresence;
}

export function CoThinkingIndicator({ presence }: CoThinkingIndicatorProps) {
  return (
    <AnimatePresence>
      {presence.isActive && (
        <motion.div
          className="fixed top-16 left-0 right-0 z-30 flex justify-center pointer-events-none"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="flex items-center gap-2 px-4 py-2 glass rounded-full">
            {/* Breathing presence dot */}
            <motion.span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'hsl(var(--echo) / 0.5)' }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <motion.span
              className="text-[10px] font-thought text-muted-foreground/30 tracking-wider"
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {presence.message}
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
