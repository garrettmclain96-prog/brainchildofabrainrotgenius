import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAppMode } from '@/hooks/useAppMode';
import { applyRotEffect } from '@/types/thought';
import { cn } from '@/lib/utils';

interface GraveyardThought {
  id: string;
  content: string;
  decayLevel: number;
  mode: string;
}

export function GraveyardView() {
  const [thoughts, setThoughts] = useState<GraveyardThought[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { mode } = useAppMode();

  // Generate synthetic "graveyard" entries from expired or near-expired thoughts
  // Since fully expired thoughts are filtered by RLS, we simulate the graveyard
  // with heavily decayed thoughts + synthetic entries
  useEffect(() => {
    const fetchDecayed = async () => {
      const { data } = await supabase
        .from('thoughts_with_decay')
        .select('*')
        .gte('decay_level', 70)
        .order('decay_level', { ascending: false })
        .limit(20);

      const real: GraveyardThought[] = (data || []).map((t) => ({
        id: t.id!,
        content: t.content!,
        decayLevel: Math.min(t.decay_level! + 15, 99), // Push them further into decay
        mode: t.mode || 'clean',
      }));

      // Add synthetic ghost entries for atmosphere
      const ghosts: GraveyardThought[] = [
        { id: 'ghost-1', content: 'someone once thought this was important', decayLevel: 95, mode: 'rot' },
        { id: 'ghost-2', content: 'an idea that chose to dissolve', decayLevel: 90, mode: 'rot' },
        { id: 'ghost-3', content: '...', decayLevel: 98, mode: 'clean' },
        { id: 'ghost-4', content: 'this thought completed its lifecycle', decayLevel: 92, mode: 'rot' },
        { id: 'ghost-5', content: 'forgotten, but not gone', decayLevel: 88, mode: 'clean' },
      ];

      // Interleave real and ghost entries
      const combined = [...real];
      ghosts.forEach((ghost, i) => {
        const insertAt = Math.min(i * 2 + 1, combined.length);
        combined.splice(insertAt, 0, ghost);
      });

      setThoughts(combined.slice(0, 15));
      setIsLoading(false);
    };

    fetchDecayed();
  }, []);

  // Progressively rot the content
  const rottingThoughts = useMemo(() => {
    return thoughts.map((t) => ({
      ...t,
      displayContent: mode === 'rot' || t.mode === 'rot'
        ? applyRotEffect(t.content, t.decayLevel)
        : t.content,
    }));
  }, [thoughts, mode]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <span className="text-muted-foreground/30 text-xs font-thought">
          excavating the graveyard...
        </span>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Graveyard header */}
      <div className="text-center py-4 space-y-1">
        <motion.p
          className="text-xs text-muted-foreground/30 font-thought"
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          {mode === 'rot' ? '⟡ the graveyard ⟡' : '— resting place —'}
        </motion.p>
        <p className="text-[10px] text-muted-foreground/15">
          where thoughts go after they dissolve
        </p>
      </div>

      {/* Graveyard entries */}
      <AnimatePresence>
        {rottingThoughts.map((thought, index) => (
          <motion.div
            key={thought.id}
            className={cn(
              'px-4 py-3 rounded-xl',
              'bg-secondary/10 border border-border/5',
              'overflow-hidden relative'
            )}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.5 }}
            style={{
              opacity: Math.max(0.15, 1 - thought.decayLevel / 100),
              filter: `blur(${Math.max(0, (thought.decayLevel - 70) * 0.05)}px)`,
            }}
          >
            <p className={cn(
              'font-thought text-xs text-muted-foreground/40 leading-relaxed',
              'whitespace-pre-wrap break-words',
              thought.decayLevel > 90 && 'tracking-widest',
              mode === 'rot' && 'text-glitch'
            )}>
              {thought.displayContent}
            </p>

            {/* Decay dust particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {thought.decayLevel > 85 && [...Array(3)].map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute w-0.5 h-0.5 rounded-full bg-muted-foreground/10"
                  style={{
                    left: `${20 + i * 30}%`,
                    bottom: '50%',
                  }}
                  animate={{
                    y: [0, -20, -40],
                    opacity: [0.3, 0.1, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.8,
                  }}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Bottom of graveyard */}
      <motion.div
        className="text-center py-8"
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, repeat: Infinity }}
      >
        <p className="text-[10px] text-muted-foreground/10 font-thought">
          {mode === 'rot'
            ? 'the rot goes deeper than you can scroll'
            : 'all thoughts return to silence'}
        </p>
      </motion.div>
    </motion.div>
  );
}
