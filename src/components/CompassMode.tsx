import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thought } from '@/types/thought';
import { useAppMode } from '@/hooks/useAppMode';
import { cn } from '@/lib/utils';

interface CompassModeProps {
  thoughts: Thought[];
  isActive: boolean;
  onToggle: () => void;
}

interface CompassResult {
  mattersNow: Thought | null;
  canIgnore: Thought | null;
  mightRegret: Thought | null;
}

function deriveCompass(thoughts: Thought[]): CompassResult {
  if (thoughts.length === 0) {
    return { mattersNow: null, canIgnore: null, mightRegret: null };
  }

  const now = Date.now();
  const sorted = [...thoughts].sort((a, b) => {
    // Score by a combination of recency, decay, and category
    const aScore = (a.category === 'tasks' ? 2 : 1) * (1 - a.decayLevel / 100) * (1 / Math.max(1, (now - a.createdAt.getTime()) / 3600000));
    const bScore = (b.category === 'tasks' ? 2 : 1) * (1 - b.decayLevel / 100) * (1 / Math.max(1, (now - b.createdAt.getTime()) / 3600000));
    return bScore - aScore;
  });

  // Matters now: highest priority undecayed thought
  const mattersNow = sorted[0] || null;

  // Can safely ignore: most decayed, oldest, not a task
  const ignorable = thoughts
    .filter((t) => t.id !== mattersNow?.id && t.category !== 'tasks')
    .sort((a, b) => b.decayLevel - a.decayLevel);
  const canIgnore = ignorable[0] || null;

  // Might regret: something with moderate decay that hasn't been watered
  const regrettable = thoughts
    .filter((t) => t.id !== mattersNow?.id && t.id !== canIgnore?.id && t.decayLevel > 30 && t.decayLevel < 70 && t.waterCount === 0)
    .sort((a, b) => b.decayLevel - a.decayLevel);
  const mightRegret = regrettable[0] || null;

  return { mattersNow, canIgnore, mightRegret };
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
  }),
  exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.3 } },
};

function CompassCard({
  label,
  sublabel,
  thought,
  index,
  accentColor,
}: {
  label: string;
  sublabel: string;
  thought: Thought | null;
  index: number;
  accentColor: string;
}) {
  if (!thought) return null;

  return (
    <motion.div
      className="glass-premium rounded-xl p-4 relative overflow-hidden"
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Accent line */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full"
        style={{ background: `hsl(var(--${accentColor}) / 0.4)` }}
      />

      <p className={cn('text-[10px] font-thought tracking-wider mb-1.5', `text-${accentColor}/60`)}>
        {label}
      </p>
      <p className="text-sm font-thought text-foreground/80 leading-relaxed line-clamp-2">
        {thought.content}
      </p>
      <p className="text-[9px] text-muted-foreground/25 mt-2 font-thought">
        {sublabel}
      </p>
    </motion.div>
  );
}

export function CompassMode({ thoughts, isActive, onToggle }: CompassModeProps) {
  const { mode } = useAppMode();
  const compass = useMemo(() => deriveCompass(thoughts), [thoughts]);

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <motion.button
        onClick={onToggle}
        className={cn(
          'w-full px-3 py-2 rounded-xl text-[10px] font-thought tracking-wider',
          'transition-all duration-500',
          isActive
            ? 'bg-primary/15 text-primary/80 border border-primary/20'
            : 'bg-secondary/15 text-muted-foreground/40 hover:bg-secondary/25'
        )}
        whileTap={{ scale: 0.98 }}
      >
        {isActive ? '🧭 compass active · showing only what matters' : '🧭 compass mode'}
      </motion.button>

      <AnimatePresence>
        {isActive && (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5 }}
          >
            {thoughts.length === 0 ? (
              <motion.p
                className="text-center text-xs text-muted-foreground/30 font-thought py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                nothing to navigate. the mind is clear.
              </motion.p>
            ) : (
              <>
                <CompassCard
                  label="matters now"
                  sublabel="this has weight. give it a moment."
                  thought={compass.mattersNow}
                  index={0}
                  accentColor="primary"
                />
                <CompassCard
                  label="safe to ignore"
                  sublabel="let this one drift."
                  thought={compass.canIgnore}
                  index={1}
                  accentColor="muted-foreground"
                />
                <CompassCard
                  label="you might regret forgetting"
                  sublabel="it's fading. water it or let it go."
                  thought={compass.mightRegret}
                  index={2}
                  accentColor="echo"
                />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
