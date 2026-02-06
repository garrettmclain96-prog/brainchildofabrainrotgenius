import { motion, AnimatePresence } from 'framer-motion';
import { ResonancePattern } from '@/hooks/useResonance';
import { cn } from '@/lib/utils';
import { useAppMode } from '@/hooks/useAppMode';

interface ResonancePanelProps {
  patterns: ResonancePattern[];
}

const typeIcons: Record<ResonancePattern['type'], string> = {
  'recurring-theme': '◎',
  contradiction: '⟷',
  cluster: '⁂',
  'decay-pattern': '↓',
};

export function ResonancePanel({ patterns }: ResonancePanelProps) {
  const { mode } = useAppMode();

  if (patterns.length === 0) return null;

  return (
    <motion.section
      className="mb-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-2 px-1">
        <motion.span
          className="text-xs text-primary/40"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          ◉
        </motion.span>
        <span className="text-[10px] text-muted-foreground/40 font-thought tracking-wider uppercase">
          {mode === 'rot' ? 'resonance detected' : 'patterns'}
        </span>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {patterns.map((pattern, index) => (
            <motion.div
              key={`${pattern.type}-${index}`}
              className={cn(
                'px-3 py-2.5 rounded-xl text-xs font-thought',
                'bg-primary/5 border border-primary/10',
                'text-muted-foreground/70',
                mode === 'rot' && 'border-primary/20 bg-primary/8'
              )}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="flex items-start gap-2">
                <span className="text-primary/50 mt-0.5">{typeIcons[pattern.type]}</span>
                <p className="leading-relaxed flex-1">{pattern.description}</p>
              </div>

              {/* Strength indicator */}
              <div className="mt-2 h-0.5 bg-secondary/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary/30 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pattern.strength * 100}%` }}
                  transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
