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
          transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
        >
          <motion.div
            className="absolute inset-0 bg-background/85 backdrop-blur-2xl"
            onClick={onDismiss}
          />

          <motion.div
            className="relative z-10 max-w-sm w-full text-center space-y-10"
            initial={{ scale: 0.92, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="relative mx-auto w-28 h-28">
              <motion.div
                className="absolute inset-0 rounded-full sacred-breathe"
                style={{ border: '1px solid hsl(var(--primary) / 0.15)' }}
              />
              <motion.div
                className="absolute inset-4 rounded-full sacred-breathe"
                style={{ border: '1px solid hsl(var(--primary) / 0.1)', animationDelay: '1s' }}
              />
              <motion.div
                className="absolute inset-8 rounded-full sacred-breathe"
                style={{
                  background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
                  animationDelay: '2s',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                  className="text-xl text-primary/60"
                  animate={{ rotate: [0, 3, -3, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {mode === 'rot' ? '◎' : '◉'}
                </motion.span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <p className="font-thought text-sm text-foreground/70 tracking-wide">
                a lot is happening.
              </p>
            </motion.div>

            <div className="flex flex-col gap-3">
              <motion.button
                onClick={() => onChoose('amplify')}
                className={cn(
                  'w-full px-4 py-3.5 rounded-xl text-sm font-thought tracking-wide',
                  'bg-primary/8 text-primary border border-primary/15',
                  'hover:bg-primary/15 transition-all duration-700'
                )}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                continue
              </motion.button>

              <motion.button
                onClick={() => onChoose('prune')}
                className={cn(
                  'w-full px-4 py-3.5 rounded-xl text-sm font-thought tracking-wide',
                  'bg-secondary/20 text-muted-foreground border border-border/15',
                  'hover:bg-secondary/35 transition-all duration-700'
                )}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.85, duration: 0.6 }}
              >
                reduce
              </motion.button>

              <motion.button
                onClick={onDismiss}
                className="text-[10px] text-muted-foreground/25 hover:text-muted-foreground/40 transition-all duration-700 py-3 font-thought tracking-widest uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.8 }}
              >
                dismiss
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
