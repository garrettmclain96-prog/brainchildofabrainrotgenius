import { motion, AnimatePresence } from 'framer-motion';
import { useAppMode } from '@/hooks/useAppMode';

interface OvernightSynthesisProps {
  hasSynthesis: boolean;
  synthesis: string | null;
  decayedCount: number;
  onDismiss: () => void;
}

export function OvernightSynthesisOverlay({
  hasSynthesis,
  synthesis,
  decayedCount,
  onDismiss,
}: OvernightSynthesisProps) {
  const { mode } = useAppMode();

  return (
    <AnimatePresence>
      {hasSynthesis && synthesis && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center px-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/95 backdrop-blur-2xl"
            onClick={onDismiss}
          />

          {/* Content */}
          <motion.div
            className="relative z-10 max-w-md w-full text-center space-y-10"
            initial={{ y: 30, filter: 'blur(10px)' }}
            animate={{ y: 0, filter: 'blur(0px)' }}
            exit={{ y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Ambient particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-primary/20"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    top: `${10 + Math.random() * 80}%`,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    opacity: [0.2, 0.5, 0.2],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 4 + Math.random() * 3,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            {/* Moon/sun icon */}
            <motion.div
              className="text-4xl mx-auto"
              animate={{
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 6, repeat: Infinity }}
            >
              {mode === 'rot' ? '🌑' : '◐'}
            </motion.div>

            {/* Title */}
            <motion.p
              className="text-[10px] text-muted-foreground/30 font-thought tracking-[0.3em] uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              overnight synthesis
            </motion.p>

            {/* Synthesis text */}
            <motion.p
              className="font-thought text-sm text-foreground/70 leading-relaxed max-w-xs mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 1 }}
            >
              {synthesis}
            </motion.p>

            {/* Dismiss */}
            <motion.button
              onClick={onDismiss}
              className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60 font-thought transition-colors px-4 py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              whileTap={{ scale: 0.95 }}
            >
              {mode === 'rot' ? 'let it sink in' : 'continue'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
