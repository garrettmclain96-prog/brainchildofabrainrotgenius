import { motion, AnimatePresence } from 'framer-motion';
import { useAppMode } from '@/hooks/useAppMode';
import { cn } from '@/lib/utils';

interface OverloadOverlayProps {
  isOverloaded: boolean;
  intensity: number;
  onChoose: (path: 'amplify' | 'prune') => void;
  onDismiss: () => void;
}

export function OverloadOverlay({ isOverloaded, intensity, onChoose, onDismiss }: OverloadOverlayProps) {
  const { mode } = useAppMode();

  return (
    <AnimatePresence>
      {isOverloaded && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Backdrop with pulse */}
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
            animate={{
              backgroundColor: [
                'hsl(var(--background) / 0.8)',
                'hsl(var(--background) / 0.9)',
                'hsl(var(--background) / 0.8)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            onClick={onDismiss}
          />

          {/* Content */}
          <motion.div
            className="relative z-10 max-w-sm w-full text-center space-y-8"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Breathing orb */}
            <div className="relative mx-auto w-24 h-24">
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/10"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute inset-3 rounded-full bg-primary/20"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                  className="text-2xl"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  {mode === 'rot' ? '🌀' : '◉'}
                </motion.span>
              </div>
            </div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="font-thought text-sm text-foreground/80 mb-2">
                {mode === 'rot'
                  ? 'the rot is accelerating.'
                  : 'your mind is moving fast.'}
              </p>
              <p className="text-xs text-muted-foreground/60 leading-relaxed">
                {mode === 'rot'
                  ? 'the compost heap is overflowing. what do you want to do with all this?'
                  : 'take a breath. what would serve you right now?'}
              </p>
            </motion.div>

            {/* Choices */}
            <div className="flex flex-col gap-3">
              <motion.button
                onClick={() => onChoose('amplify')}
                className={cn(
                  'w-full px-4 py-3 rounded-xl text-sm font-thought',
                  'bg-primary/10 text-primary border border-primary/20',
                  'hover:bg-primary/20 transition-all duration-300'
                )}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                {mode === 'rot' ? 'amplify the rot 🌪️' : 'keep going'}
              </motion.button>

              <motion.button
                onClick={() => onChoose('prune')}
                className={cn(
                  'w-full px-4 py-3 rounded-xl text-sm font-thought',
                  'bg-secondary/30 text-muted-foreground border border-border/20',
                  'hover:bg-secondary/50 transition-all duration-300'
                )}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                {mode === 'rot' ? 'prune it back 🌿' : 'slow down'}
              </motion.button>

              {/* Breathing exercise */}
              <motion.button
                onClick={onDismiss}
                className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors py-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                just breathe
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
