import { motion, AnimatePresence } from 'framer-motion';
import { Haunting } from '@/hooks/useCognitiveHauntings';

interface HauntingOverlayProps {
  haunting: Haunting | null;
  onDismiss: () => void;
}

export function HauntingOverlay({ haunting, onDismiss }: HauntingOverlayProps) {
  return (
    <AnimatePresence>
      {haunting && (
        <motion.div
          className="fixed bottom-20 left-0 right-0 z-35 flex justify-center px-6 pointer-events-none"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 2, ease: [0.23, 1, 0.32, 1] }}
        >
          <motion.div
            className="max-w-xs text-center pointer-events-auto cursor-pointer"
            onClick={onDismiss}
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {/* Ghost glow */}
            <div
              className="absolute -inset-4 rounded-2xl blur-xl"
              style={{
                background: haunting.type === 'prophecy'
                  ? 'radial-gradient(ellipse, hsl(var(--accent) / 0.05) 0%, transparent 70%)'
                  : haunting.type === 'mirror'
                  ? 'radial-gradient(ellipse, hsl(var(--echo) / 0.05) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse, hsl(var(--primary) / 0.05) 0%, transparent 70%)',
              }}
            />

            <p className="relative text-xs font-thought text-muted-foreground/40 italic tracking-wide leading-relaxed">
              {haunting.text}
            </p>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
