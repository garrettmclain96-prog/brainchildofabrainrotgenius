import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Thought } from '@/types/thought';

interface SelfReflectionProps {
  thoughts: Thought[];
  totalCreated?: number;
  totalDissolved?: number;
}

interface Reflection {
  label: string;
  value: string;
}

export function SelfReflection({ thoughts }: SelfReflectionProps) {
  const reflections = useMemo(() => {
    const starred = thoughts.filter(t => t.starred).length;
    const total = thoughts.length;
    const avgDecay = total > 0
      ? Math.round(thoughts.reduce((sum, t) => sum + t.decayLevel, 0) / total)
      : 0;
    const watered = thoughts.filter(t => t.waterCount > 0).length;
    const categories = new Set(thoughts.map(t => t.category)).size;

    const lines: Reflection[] = [];

    // Preservation tendency
    if (starred === 0 && total > 0) {
      lines.push({ label: 'tendency', value: 'you let everything go.' });
    } else if (starred > 0 && starred <= 3) {
      lines.push({ label: 'tendency', value: `you've preserved ${starred} rare thought${starred > 1 ? 's' : ''}.` });
    } else if (starred > 3) {
      lines.push({ label: 'tendency', value: `you hold onto things. ${starred} saved.` });
    }

    // Decay awareness
    if (avgDecay > 60 && total > 0) {
      lines.push({ label: 'decay', value: 'most of what you have is fading.' });
    } else if (avgDecay < 20 && total > 0) {
      lines.push({ label: 'decay', value: 'your thoughts are still fresh.' });
    }

    // Watering behavior
    if (watered > 0) {
      lines.push({ label: 'care', value: `you've tended to ${watered} thought${watered > 1 ? 's' : ''}.` });
    }

    // Emptiness
    if (total === 0) {
      lines.push({ label: 'state', value: 'nothing held. that is also something.' });
    }

    // Volume
    if (total > 10) {
      lines.push({ label: 'volume', value: 'your mind is busy. consider letting go.' });
    }

    return lines;
  }, [thoughts]);

  if (reflections.length === 0) return null;

  return (
    <section className="glass-premium rounded-xl p-4 space-y-3">
      <span className="text-sm text-foreground/70 font-thought">self-reflection</span>
      <div className="space-y-2">
        {reflections.map((reflection, i) => (
          <motion.div
            key={reflection.label}
            className="flex flex-col gap-0.5"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
          >
            <span className="text-[10px] font-thought text-muted-foreground/30 tracking-wider uppercase">
              {reflection.label}
            </span>
            <span className="text-xs font-thought text-muted-foreground/60 italic leading-relaxed">
              {reflection.value}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
