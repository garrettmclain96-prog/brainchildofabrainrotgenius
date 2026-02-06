import { motion, AnimatePresence } from 'framer-motion';
import { BoredomState } from '@/hooks/useIntentionalBoredom';

interface BoredomOverlayProps {
  boredom: BoredomState;
}

export function BoredomOverlay({ boredom }: BoredomOverlayProps) {
  return (
    <AnimatePresence>
      {boredom.isActive && (
        <motion.div
          className="fixed inset-0 z-45 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 3 }}
        >
          {/* The void */}
          <motion.div
            className="absolute inset-0 bg-background/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 4 }}
          />

          {/* The almost-nothing */}
          <motion.div
            className="relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.2, 0.15, 0.2, 0] }}
            transition={{ 
              duration: boredom.duration / 1000, 
              times: [0, 0.2, 0.5, 0.8, 1] 
            }}
          >
            <span className="text-muted-foreground/10 font-thought text-2xl tracking-[0.5em]">
              {boredom.message}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
