import { motion, AnimatePresence } from 'framer-motion';
import { EasterEgg } from '@/hooks/useEasterEggs';
import { useAppMode } from '@/hooks/useAppMode';
import { cn } from '@/lib/utils';

interface SystemKoanProps {
  egg: EasterEgg | null;
  onDismiss: () => void;
}

const typeStyles: Record<EasterEgg['type'], { color: string; icon: string }> = {
  koan: { color: 'primary', icon: '◉' },
  whisper: { color: 'muted-foreground', icon: '~' },
  recombination: { color: 'echo', icon: '⟳' },
  glitch: { color: 'destructive', icon: '⚡' },
};

export function SystemKoan({ egg, onDismiss }: SystemKoanProps) {
  const { mode } = useAppMode();

  return (
    <AnimatePresence>
      {egg && (
        <motion.div
          className="fixed top-16 left-4 right-4 z-[70] flex justify-center pointer-events-none"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          <motion.button
            onClick={onDismiss}
            className={cn(
              'pointer-events-auto max-w-md w-full',
              'px-4 py-3 rounded-2xl',
              'glass-premium',
              'text-xs font-thought leading-relaxed text-left',
              'flex items-start gap-2.5',
              'hover:scale-[1.01] active:scale-[0.99] transition-transform',
              egg.type === 'glitch' && mode === 'rot' && 'animate-glitch-subtle',
              egg.type === 'glitch' && 'border-destructive/20',
              egg.type === 'recombination' && 'border-echo/20',
            )}
          >
            {/* Icon */}
            <motion.span
              className={cn(
                'text-sm mt-0.5 flex-shrink-0',
                egg.type === 'glitch' && 'text-destructive/60',
                egg.type === 'koan' && 'text-primary/60',
                egg.type === 'whisper' && 'text-muted-foreground/40',
                egg.type === 'recombination' && 'text-echo/60',
              )}
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: egg.type === 'glitch' ? [1, 1.2, 1] : [1, 1.05, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {typeStyles[egg.type].icon}
            </motion.span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {egg.type === 'recombination' && (
                <span className="block text-[9px] text-echo/40 mb-1 tracking-wider uppercase">
                  spontaneous recombination
                </span>
              )}
              {egg.type === 'glitch' && (
                <span className="block text-[9px] text-destructive/40 mb-1 font-mono">
                  sys://
                </span>
              )}
              <p className={cn(
                egg.type === 'whisper' && 'text-muted-foreground/50 italic',
                egg.type === 'glitch' && 'font-mono text-destructive-foreground/60',
                egg.type === 'koan' && 'text-foreground/70',
                egg.type === 'recombination' && 'text-echo-foreground/70',
              )}>
                {egg.content}
              </p>
            </div>

            {/* Auto-dismiss timer */}
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 bg-primary/20 rounded-full"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: egg.duration / 1000, ease: 'linear' }}
            />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
