import { motion, AnimatePresence } from 'framer-motion';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

/**
 * A single, non-repeating offer to keep the app on the home screen.
 * No badge, no banner stack, no second chance.
 */
export function InstallWhisper() {
  const { isVisible, install, dismiss } = useInstallPrompt();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 px-5 w-full max-w-xs"
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
          transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="glass-premium rounded-2xl px-4 py-3.5 border border-border/15 space-y-3">
            <p className="font-thought italic text-xs text-foreground/60 leading-relaxed">
              keep this on your home screen — it works without a connection
            </p>
            <div className="flex gap-2">
              <button
                onClick={install}
                className="flex-1 min-h-[44px] rounded-xl text-xs font-thought italic text-primary/85 bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-all duration-500"
              >
                keep it
              </button>
              <button
                onClick={dismiss}
                className="flex-1 min-h-[44px] rounded-xl text-xs font-thought italic text-muted-foreground/45 hover:text-muted-foreground/70 transition-all duration-500"
              >
                not now
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
