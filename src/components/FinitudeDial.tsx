import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Thought } from '@/types/thought';
import { useAppMode } from '@/hooks/useAppMode';
import { cn } from '@/lib/utils';

interface FinitudeDialProps {
  thoughts: Thought[];
}

// Poetic labels for capacity levels
const CAPACITY_LABELS = {
  full: [
    'the garden overflows.',
    'so many seeds, so little soil.',
    'your mind is a crowded room.',
  ],
  high: [
    'thoughts are stacking up.',
    'the compost heap is growing.',
    'ideas jostle for attention.',
  ],
  medium: [
    'a balanced garden.',
    'room to think, room to grow.',
    'the fog holds what it can.',
  ],
  low: [
    'spacious. almost empty.',
    'the mind breathes freely.',
    'silence has room here.',
  ],
  empty: [
    'a clean slate.',
    'the garden is bare. ready for seeds.',
    'nothing to carry. nothing to forget.',
  ],
};

function getCapacityLevel(count: number): keyof typeof CAPACITY_LABELS {
  if (count === 0) return 'empty';
  if (count <= 3) return 'low';
  if (count <= 8) return 'medium';
  if (count <= 15) return 'high';
  return 'full';
}

export function FinitudeDial({ thoughts }: FinitudeDialProps) {
  const { mode } = useAppMode();

  const { level, label, percentage, avgDecay } = useMemo(() => {
    const count = thoughts.length;
    const level = getCapacityLevel(count);
    const labels = CAPACITY_LABELS[level];
    const label = labels[Math.floor(Math.random() * labels.length)];
    const percentage = Math.min(count / 20, 1); // Max "capacity" at 20 thoughts

    const avgDecay =
      thoughts.length > 0
        ? thoughts.reduce((sum, t) => sum + t.decayLevel, 0) / thoughts.length
        : 0;

    return { level, label, percentage, avgDecay };
  }, [thoughts]);

  // Render ring segments
  const segments = 20;
  const filledSegments = Math.round(percentage * segments);

  return (
    <motion.div
      className="glass rounded-xl p-5 space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] text-muted-foreground/40 font-thought tracking-wider uppercase">
          finitude
        </span>
      </div>

      {/* Ring visualization */}
      <div className="flex items-center gap-6">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth="3"
              opacity="0.3"
            />
            {/* Filled ring */}
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${percentage * 251.2} 251.2`}
              initial={{ strokeDasharray: '0 251.2' }}
              animate={{ strokeDasharray: `${percentage * 251.2} 251.2` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              opacity={0.6}
            />
          </svg>

          {/* Center count */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-lg font-thought text-foreground/80 tabular-nums"
              key={thoughts.length}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {thoughts.length}
            </motion.span>
            <span className="text-[8px] text-muted-foreground/30">fragments</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {/* Poetic label */}
          <p className={cn(
            'text-xs font-thought text-muted-foreground/70 leading-relaxed',
            mode === 'rot' && 'text-primary/60'
          )}>
            {label}
          </p>

          {/* Average decay */}
          {thoughts.length > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground/40">
                <span>avg decay</span>
                <span className="tabular-nums">{Math.round(avgDecay)}%</span>
              </div>
              <div className="h-1 bg-secondary/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, hsl(var(--decay-fresh)), hsl(var(--decay-${
                      avgDecay < 25 ? 'fresh' : avgDecay < 50 ? 'fading' : avgDecay < 75 ? 'rotting' : 'extinct'
                    })))`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${avgDecay}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
