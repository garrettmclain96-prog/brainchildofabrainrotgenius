import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thought, calculateDecayLevel } from '@/types/thought';
import { cn } from '@/lib/utils';

interface DecayTimelineProps {
  thought: Thought | null;
  onClose: () => void;
}

const STAGES = [0, 20, 40, 60, 80, 100];

/** Degrade text the way the decay engine does: drop and fray characters. */
function degrade(content: string, level: number): string {
  if (level <= 0) return content;
  const chars = content.split('');
  const rate = level / 130;
  return chars
    .map((c, i) => {
      if (c === ' ' || c === '\n') return c;
      // Deterministic per index so the same stage always looks the same.
      const noise = ((i * 9301 + 49297) % 233280) / 233280;
      if (noise < rate) return noise < rate / 3 ? '' : '·';
      return c;
    })
    .join('');
}

/**
 * Decay Timeline — a thought's own history and future, stage by stage.
 * Read-only: looking at decay never slows it down.
 */
export function DecayTimeline({ thought, onClose }: DecayTimelineProps) {
  const currentLevel = useMemo(
    () => (thought ? calculateDecayLevel(thought.createdAt, thought.expiresAt) : 0),
    [thought]
  );

  const stageTimes = useMemo(() => {
    if (!thought) return [];
    const start = thought.createdAt.getTime();
    const span = thought.expiresAt.getTime() - start;
    return STAGES.map((level) => new Date(start + (span * level) / 100));
  }, [thought]);

  return (
    <AnimatePresence>
      {thought && (
        <motion.div
          className="fixed inset-0 z-50 bg-background/94 backdrop-blur-xl overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          role="dialog"
          aria-label="Decay timeline"
        >
          <div className="max-w-lg mx-auto px-6 py-10 pb-24 space-y-8">
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg text-foreground/80 tracking-[0.16em] uppercase">
                  its decay
                </h2>
                <p className="text-[10px] font-sans tracking-[0.16em] text-muted-foreground/40 mt-1">
                  what it was, what it becomes
                </p>
              </div>
              <button
                onClick={onClose}
                className="min-w-[44px] min-h-[44px] text-muted-foreground/40 hover:text-foreground/70 transition-colors duration-500"
                aria-label="Close timeline"
              >
                ×
              </button>
            </header>

            <ol className="space-y-6">
              {STAGES.map((level, i) => {
                const isPast = level <= currentLevel;
                const isNow =
                  level <= currentLevel && (STAGES[i + 1] ?? 101) > currentLevel;
                return (
                  <motion.li
                    key={level}
                    className={cn(
                      'rounded-2xl px-4 py-4 border transition-colors duration-700',
                      isNow
                        ? 'border-primary/25 bg-primary/5'
                        : 'border-border/10 bg-card/20'
                    )}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: isPast ? 1 : 0.5, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-sans tracking-[0.18em] text-muted-foreground/45 uppercase">
                        {level === 0 ? 'written' : level === 100 ? 'gone' : `${level}% rot`}
                        {isNow && ' · now'}
                      </span>
                      <span className="text-[10px] font-sans text-muted-foreground/30 tabular-nums">
                        {stageTimes[i]?.toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p
                      className="font-thought italic text-sm text-foreground/65 leading-relaxed break-words"
                      style={{ filter: `blur(${level / 45}px)`, opacity: 1 - level / 160 }}
                    >
                      {level === 100 ? '—' : degrade(thought.content, level)}
                    </p>
                  </motion.li>
                );
              })}
            </ol>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
