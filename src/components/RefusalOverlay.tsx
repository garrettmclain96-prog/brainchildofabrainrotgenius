import { motion, AnimatePresence } from 'framer-motion';
import { Refusal } from '@/hooks/useRefusalIntelligence';

interface RefusalOverlayProps {
  refusal: Refusal;
  onDismiss: () => void;
}

export function RefusalOverlay({ refusal, onDismiss }: RefusalOverlayProps) {
  if (!refusal.active) return null;

  return (
    <AnimatePresence>
      {refusal.active && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          onClick={onDismiss}
        >
          {/* Darkened backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
          />

          {/* Message */}
          <motion.div
            className="relative z-10 max-w-xs text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <p className="text-foreground/60 font-thought text-sm leading-relaxed tracking-wide italic">
              {refusal.message}
            </p>
            
            <motion.div
              className="mt-8 w-12 h-[1px] mx-auto bg-muted-foreground/10"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 2, delay: 1 }}
            />
            
            <motion.p
              className="mt-4 text-[10px] text-muted-foreground/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
            >
              tap to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
