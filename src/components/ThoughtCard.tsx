import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Thought, getDecayState, applyRotEffect, applyWordDecay, CATEGORY_META } from '@/types/thought';
import { useAppMode } from '@/hooks/useAppMode';
import { cn } from '@/lib/utils';

interface ThoughtCardProps {
  thought: Thought;
  onEcho?: (thoughtId: string) => void;
  onWater?: () => void;
  showEchoButton?: boolean;
  showWaterButton?: boolean;
}

export function ThoughtCard({ thought, onEcho, onWater, showEchoButton = true, showWaterButton = false }: ThoughtCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { mode: appMode } = useAppMode();
  const decayState = getDecayState(thought.decayLevel);

  const displayContent = useMemo(() => {
    let text = thought.content;
    const useRot = thought.mode === 'rot' || appMode === 'rot';

    if (useRot) {
      text = applyWordDecay(text, thought.decayLevel);
      text = applyRotEffect(text, thought.decayLevel);
    }
    return text;
  }, [thought.content, thought.mode, thought.decayLevel, appMode]);

  const stateStyles = {
    fresh: 'thought-fresh',
    fading: 'thought-fading',
    rotting: 'thought-rotting',
    extinct: 'thought-extinct',
  };

  const decayTextStyles = {
    fresh: 'decay-text-0',
    fading: 'decay-text-25',
    rotting: 'decay-text-50',
    extinct: 'decay-text-75',
  };

  const isRotMode = thought.mode === 'rot' || appMode === 'rot';

  return (
    <motion.article
      className={cn(
        'group relative p-4 rounded-xl overflow-hidden',
        'glass-premium',
        'transition-all duration-500 ease-out',
        stateStyles[decayState],
        isRotMode && thought.decayLevel > 30 && 'text-glitch'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      aria-label={`Thought, ${decayState} state`}
    >
      {/* Decay progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-secondary/20 overflow-hidden">
        <motion.div
          className="h-full"
          style={{
            width: `${100 - thought.decayLevel}%`,
            background: `linear-gradient(90deg, hsl(var(--decay-${decayState})), hsl(var(--decay-${decayState}) / 0.3))`,
          }}
          initial={{ width: '100%' }}
          animate={{ width: `${100 - thought.decayLevel}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>

      {/* Category badge */}
      {thought.category !== 'uncategorized' && (
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs">{CATEGORY_META[thought.category].icon}</span>
          <span className="text-[10px] text-muted-foreground/40 font-thought">{CATEGORY_META[thought.category].label}</span>
        </div>
      )}

      {/* Content */}
      <p
        className={cn(
          'font-thought text-sm leading-relaxed text-card-foreground',
          'whitespace-pre-wrap break-words relative z-10',
          'transition-all duration-500',
          decayTextStyles[decayState],
          isRotMode && thought.decayLevel > 50 && 'chromatic-shift'
        )}
      >
        {displayContent}
      </p>

      {/* Footer */}
      <footer className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground/50 relative z-10">
        <div className="flex items-center gap-2">
          {decayState === 'extinct' ? (
            <span className="text-muted-foreground/30">fading...</span>
          ) : (
            <span className="tabular-nums">{100 - thought.decayLevel}%</span>
          )}

          {thought.waterCount > 0 && (
            <span className="text-primary/40">
              💧×{thought.waterCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Water button */}
          {showWaterButton && thought.decayLevel > 10 && (
            <motion.button
              onClick={onWater}
              className="px-2 py-1 rounded-lg bg-primary/10 text-primary/60 hover:bg-primary/20 hover:text-primary transition-all"
              whileTap={{ scale: 0.9 }}
              title="Water this thought (extend life)"
            >
              💧
            </motion.button>
          )}

          {/* Echo button */}
          {showEchoButton && thought.visibility === 'public' && thought.decayLevel < 90 && (
            <motion.button
              onClick={() => onEcho?.(thought.id)}
              className="px-2.5 py-1 rounded-lg bg-echo/10 text-echo/60 hover:bg-echo/20 hover:text-echo transition-all"
              whileTap={{ scale: 0.9 }}
              aria-label="Leave an echo"
            >
              echo
            </motion.button>
          )}
        </div>
      </footer>

      {/* Rot mode indicator */}
      {isRotMode && (
        <motion.div
          className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-destructive/60"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </motion.article>
  );
}
