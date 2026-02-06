import { motion, AnimatePresence } from 'framer-motion';
import { DriftedIdea } from '@/hooks/useIdeaDrift';
import { useAppMode } from '@/hooks/useAppMode';
import { cn } from '@/lib/utils';

interface IdeaDriftNotificationProps {
  drift: DriftedIdea | null;
  onSave: () => void;
  onDismiss: () => void;
}

export function IdeaDriftNotification({ drift, onSave, onDismiss }: IdeaDriftNotificationProps) {
  const { mode } = useAppMode();

  return (
    <AnimatePresence>
      {drift && (
        <motion.div
          className="fixed bottom-24 left-4 right-4 z-[60] flex justify-center"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95, filter: 'blur(8px)' }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          <div
            className={cn(
              'max-w-md w-full p-4 rounded-2xl',
              'glass-premium',
              'space-y-3'
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-2">
              <motion.span
                className="text-sm"
                animate={{
                  x: [0, 5, -3, 0],
                  opacity: [0.5, 1, 0.7, 0.5],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                🌊
              </motion.span>
              <span className="text-[10px] text-muted-foreground/40 font-thought tracking-wider uppercase">
                {mode === 'rot' ? 'idea drifted in' : 'a thought arrived'}
              </span>
            </div>

            {/* Mutated content */}
            <p className={cn(
              'text-sm font-thought text-foreground/70 leading-relaxed pl-1',
              'border-l-2 border-echo/30 ml-2',
              mode === 'rot' && 'text-glitch'
            )}>
              {drift.mutatedContent}
            </p>

            {/* Mutation indicator */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/30">
              <span>mutated {Math.round(drift.mutationLevel * 100)}%</span>
              <div className="flex-1 h-px bg-border/20" />
              <span>{mode === 'rot' ? 'from the void' : 'from the fog'}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <motion.button
                onClick={onSave}
                className={cn(
                  'flex-1 px-3 py-2 rounded-xl text-xs font-thought',
                  'bg-primary/10 text-primary border border-primary/20',
                  'hover:bg-primary/20 transition-all'
                )}
                whileTap={{ scale: 0.98 }}
              >
                save privately
              </motion.button>
              <motion.button
                onClick={onDismiss}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-thought',
                  'text-muted-foreground/50 hover:text-muted-foreground',
                  'transition-all'
                )}
                whileTap={{ scale: 0.98 }}
              >
                let it go
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
