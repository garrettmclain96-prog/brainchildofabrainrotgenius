import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thought, CATEGORY_META } from '@/types/thought';
import { useAppMode } from '@/hooks/useAppMode';
import { cn } from '@/lib/utils';

interface ProductivityInsightProps {
  thoughts: Thought[];
}

interface Insight {
  id: string;
  message: string;
  type: 'return' | 'decay' | 'creative' | 'balance';
  icon: string;
}

export function ProductivityInsight({ thoughts }: ProductivityInsightProps) {
  const { mode } = useAppMode();

  const insights = useMemo((): Insight[] => {
    if (thoughts.length < 2) return [];

    const result: Insight[] = [];

    // Pattern: watered thoughts (things user returns to)
    const wateredThoughts = thoughts.filter((t) => t.waterCount > 0);
    if (wateredThoughts.length > 0) {
      const mostWatered = wateredThoughts.sort((a, b) => b.waterCount - a.waterCount)[0];
      result.push({
        id: 'return-pattern',
        message: `you've returned to ${wateredThoughts.length} thought${wateredThoughts.length > 1 ? 's' : ''}. ${
          mostWatered.waterCount > 2
            ? 'something keeps pulling you back.'
            : 'gentle attention extends life.'
        }`,
        type: 'return',
        icon: '💧',
      });
    }

    // Pattern: category distribution
    const catCounts = new Map<string, number>();
    thoughts.forEach((t) => {
      if (t.category !== 'uncategorized') {
        catCounts.set(t.category, (catCounts.get(t.category) || 0) + 1);
      }
    });

    if (catCounts.size >= 2) {
      const entries = [...catCounts.entries()].sort((a, b) => b[1] - a[1]);
      const top = entries[0];
      result.push({
        id: 'category-pattern',
        message: `most of your thoughts are ${top[0]}. ${
          top[0] === 'ideas'
            ? 'the seeds are plentiful.'
            : top[0] === 'tasks'
            ? 'the to-dos accumulate gently.'
            : top[0] === 'journal'
            ? 'you\'ve been reflecting.'
            : 'you\'re building something.'
        }`,
        type: 'creative',
        icon: CATEGORY_META[top[0] as keyof typeof CATEGORY_META]?.icon || '·',
      });
    }

    // Pattern: decay vs survival
    const surviving = thoughts.filter((t) => t.decayLevel < 50);
    const fading = thoughts.filter((t) => t.decayLevel >= 50);

    if (surviving.length > 0 && fading.length > 0) {
      const survivalRate = Math.round((surviving.length / thoughts.length) * 100);
      result.push({
        id: 'survival-pattern',
        message: `${survivalRate}% of your thoughts are thriving. ${
          survivalRate > 70
            ? 'a well-tended garden.'
            : survivalRate > 40
            ? 'a natural balance of growth and decay.'
            : 'most are returning to soil. that\'s okay.'
        }`,
        type: 'balance',
        icon: survivalRate > 50 ? '🌱' : '🍂',
      });
    }

    // Pattern: freshness (recently created)
    const now = Date.now();
    const recentThoughts = thoughts.filter((t) => now - t.createdAt.getTime() < 30 * 60 * 1000);
    if (recentThoughts.length >= 3) {
      result.push({
        id: 'freshness-pattern',
        message: `${recentThoughts.length} thoughts in the last 30 minutes. your mind is active right now.`,
        type: 'creative',
        icon: '✨',
      });
    }

    return result.slice(0, 2); // Show max 2 insights
  }, [thoughts]);

  if (insights.length === 0) return null;

  return (
    <motion.section
      className="mb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-[10px] text-muted-foreground/30 font-thought tracking-wider uppercase">
          {mode === 'rot' ? 'what the rot reveals' : 'insights'}
        </span>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {insights.map((insight, index) => (
            <motion.div
              key={insight.id}
              className={cn(
                'px-3 py-2.5 rounded-xl text-xs font-thought',
                'bg-secondary/20 border border-border/10',
                'text-muted-foreground/60',
              )}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 + 0.3 }}
            >
              <div className="flex items-start gap-2">
                <span className="text-sm mt-0.5 flex-shrink-0">{insight.icon}</span>
                <p className="leading-relaxed">{insight.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
