import { motion, AnimatePresence } from 'framer-motion';
import { RareEvent } from '@/hooks/useRareCognitiveEvents';

interface RareEventOverlayProps {
  event: RareEvent | null;
  onDismiss: () => void;
}

export function RareEventOverlay({ event, onDismiss }: RareEventOverlayProps) {
  return (
    <AnimatePresence>
      {event && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* UI glitch effect */}
          {event.type === 'ui-glitch' && (
            <motion.div
              className="absolute inset-0"
              animate={{
                filter: [
                  'invert(0) hue-rotate(0deg)',
                  'invert(1) hue-rotate(180deg)',
                  'invert(0) hue-rotate(0deg)',
                ],
              }}
              transition={{ duration: 0.3, times: [0, 0.5, 1] }}
            />
          )}

          {/* Message */}
          <motion.div
            className="pointer-events-auto px-8 py-6 glass-premium rounded-2xl max-w-sm mx-6 text-center cursor-pointer"
            onClick={onDismiss}
            initial={{ scale: 0.8, opacity: 0, filter: 'blur(10px)' }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            exit={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            <motion.p
              className="font-thought text-sm text-foreground/60 leading-relaxed"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {event.message}
            </motion.p>

            {event.explanation && (
              <motion.p
                className="text-[10px] text-muted-foreground/25 mt-3 font-thought"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
              >
                {event.explanation}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
