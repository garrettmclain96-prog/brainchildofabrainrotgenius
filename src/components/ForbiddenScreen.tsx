import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThoughtStore } from '@/stores/thoughtStore';
import { useAppMode } from '@/hooks/useAppMode';
import { cn } from '@/lib/utils';

const STATS_KEY = 'brainchild-lifetime-stats';

interface LifetimeStats {
  totalCreated: number;
  totalDissolved: number;
  totalWatered: number;
  totalReleased: number;
  firstThoughtDate: string | null;
}

function getLifetimeStats(): LifetimeStats {
  try {
    const data = localStorage.getItem(STATS_KEY);
    return data
      ? JSON.parse(data)
      : { totalCreated: 0, totalDissolved: 0, totalWatered: 0, totalReleased: 0, firstThoughtDate: null };
  } catch {
    return { totalCreated: 0, totalDissolved: 0, totalWatered: 0, totalReleased: 0, firstThoughtDate: null };
  }
}

export function incrementStat(key: keyof Omit<LifetimeStats, 'firstThoughtDate'>) {
  const stats = getLifetimeStats();
  stats[key]++;
  if (!stats.firstThoughtDate && key === 'totalCreated') {
    stats.firstThoughtDate = new Date().toISOString();
  }
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

const POETIC_SUMMARIES = [
  (stats: LifetimeStats) =>
    `you have birthed ${stats.totalCreated} thoughts into existence. ${stats.totalDissolved} chose to return to nothing. the ratio speaks to who you are becoming.`,
  (stats: LifetimeStats) =>
    `${stats.totalWatered} times you chose to extend a thought's life. ${stats.totalCreated - stats.totalWatered} times you let nature take its course.`,
  (stats: LifetimeStats) =>
    `of ${stats.totalCreated} ideas, ${stats.totalReleased} were brave enough to enter the fog. the rest remained private, as most honest thoughts do.`,
  (stats: LifetimeStats) => {
    const kept = stats.totalCreated - stats.totalDissolved;
    return `you've kept ${kept} thought${kept !== 1 ? 's' : ''} alive. you've released ${stats.totalDissolved} to the earth. both acts require courage.`;
  },
];

interface ForbiddenScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForbiddenScreen({ isOpen, onClose }: ForbiddenScreenProps) {
  const { privateThoughts } = useThoughtStore();
  const { mode } = useAppMode();
  const stats = useMemo(() => getLifetimeStats(), [isOpen]);

  const poeticSummary = useMemo(() => {
    if (stats.totalCreated === 0) return 'you haven\'t begun yet. the first thought is always the hardest.';
    const fn = POETIC_SUMMARIES[Math.floor(Math.random() * POETIC_SUMMARIES.length)];
    return fn(stats);
  }, [stats, isOpen]);

  const daysSinceFirst = useMemo(() => {
    if (!stats.firstThoughtDate) return 0;
    return Math.floor((Date.now() - new Date(stats.firstThoughtDate).getTime()) / (24 * 60 * 60_000));
  }, [stats]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center px-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          onClick={onClose}
        >
          {/* Scan lines effect */}
          <div className="absolute inset-0 pointer-events-none opacity-10">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="w-full h-px bg-foreground/5"
                style={{ marginTop: `${i * 2}vh` }}
              />
            ))}
          </div>

          <motion.div
            className="max-w-sm text-center relative z-10 space-y-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            {/* Title */}
            <motion.p
              className="text-[10px] text-muted-foreground/20 font-thought tracking-[0.5em] uppercase"
              animate={{ opacity: [0.15, 0.3, 0.15] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              the forbidden screen
            </motion.p>

            {/* Duration */}
            {daysSinceFirst > 0 && (
              <motion.p
                className="text-xs text-muted-foreground/30 font-thought"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                {daysSinceFirst} day{daysSinceFirst !== 1 ? 's' : ''} of thinking
              </motion.p>
            )}

            {/* Stats — minimal, poetic */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              <div className="flex justify-between text-xs font-thought text-muted-foreground/25">
                <span>born</span>
                <span>{stats.totalCreated}</span>
              </div>
              <div className="h-px bg-border/10" />
              <div className="flex justify-between text-xs font-thought text-muted-foreground/25">
                <span>dissolved</span>
                <span>{stats.totalDissolved}</span>
              </div>
              <div className="h-px bg-border/10" />
              <div className="flex justify-between text-xs font-thought text-muted-foreground/25">
                <span>watered</span>
                <span>{stats.totalWatered}</span>
              </div>
              <div className="h-px bg-border/10" />
              <div className="flex justify-between text-xs font-thought text-muted-foreground/25">
                <span>released to fog</span>
                <span>{stats.totalReleased}</span>
              </div>
              <div className="h-px bg-border/10" />
              <div className="flex justify-between text-xs font-thought text-foreground/40">
                <span>still alive</span>
                <span>{privateThoughts.length}</span>
              </div>
            </motion.div>

            {/* Poetic summary */}
            <motion.p
              className="text-sm font-thought text-muted-foreground/40 leading-relaxed italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3 }}
            >
              {poeticSummary}
            </motion.p>

            {/* Dismiss hint */}
            <motion.p
              className="text-[9px] text-muted-foreground/10 font-thought"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 5 }}
            >
              tap anywhere to return
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
