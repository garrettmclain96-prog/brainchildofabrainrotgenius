import { motion, AnimatePresence } from 'framer-motion';

interface OneTimeWhisperProps {
  whisper: { id: string; text: string } | null;
  onDismiss: () => void;
}

/**
 * One-time whispers — messages that appear ONCE in the app's lifetime.
 * After you've seen it, it's gone forever. The app remembers.
 */
export function OneTimeWhisper({ whisper, onDismiss }: OneTimeWhisperProps) {
  return (
    <AnimatePresence>
      {whisper && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-10 cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
          onClick={onDismiss}
        >
          {/* Semi-dark backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 3 }}
          />

          <motion.div
            className="relative z-10 max-w-xs text-center"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          >
            {/* The message — only appears once ever */}
            <p className="text-sm font-thought text-foreground/50 leading-relaxed tracking-wide">
              {whisper.text}
            </p>

            <motion.div
              className="mt-6 w-8 h-[1px] mx-auto bg-muted-foreground/10"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 2, delay: 2 }}
            />

            <motion.p
              className="mt-4 text-[8px] text-muted-foreground/10 tracking-[0.3em] uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3 }}
            >
              this message will not appear again
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
