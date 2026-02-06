import { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Thought, getDecayState, applyRotEffect, applyWordDecay, CATEGORY_META } from '@/types/thought';
import { useAppMode } from '@/hooks/useAppMode';
import { DecayShader } from '@/components/DecayShader';
import { TypographyDecay } from '@/components/TypographyDecay';
import { cn } from '@/lib/utils';

interface ThoughtCardProps {
  thought: Thought;
  onEcho?: (thoughtId: string) => void;
  onWater?: () => void;
  showEchoButton?: boolean;
  showWaterButton?: boolean;
}

// Organic spring transition
const spring = { type: 'spring' as const, stiffness: 200, damping: 25, mass: 0.8 };

export function ThoughtCard({ thought, onEcho, onWater, showEchoButton = true, showWaterButton = false }: ThoughtCardProps) {
  const [isWatered, setIsWatered] = useState(false);
  const { mode: appMode } = useAppMode();
  const decayState = getDecayState(thought.decayLevel);
  const isRotMode = thought.mode === 'rot' || appMode === 'rot';

  const displayContent = useMemo(() => {
    let text = thought.content;
    if (isRotMode) {
      text = applyWordDecay(text, thought.decayLevel);
      text = applyRotEffect(text, thought.decayLevel);
    }
    return text;
  }, [thought.content, thought.mode, thought.decayLevel, appMode]);

  const handleWater = useCallback(() => {
    setIsWatered(true);
    onWater?.();
    // Reset reconstitution animation after it plays
    setTimeout(() => setIsWatered(false), 1500);
  }, [onWater]);

  const stateStyles = {
    fresh: 'thought-fresh',
    fading: 'thought-fading',
    rotting: 'thought-rotting',
    extinct: 'thought-extinct',
  };

  // Should we use per-character animation?
  const useTypographyDecay = isRotMode && thought.decayLevel > 25;

  return (
    <motion.article
      className={cn(
        'group relative rounded-xl overflow-hidden',
        stateStyles[decayState],
        isRotMode && thought.decayLevel > 30 && 'text-glitch'
      )}
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96, filter: 'blur(8px)' }}
      transition={{ ...spring, duration: 0.6 }}
      layout
      aria-label={`Thought, ${decayState} state`}
    >
      <DecayShader decayLevel={thought.decayLevel} isWatered={isWatered}>
        <div className="p-4 glass-premium rounded-xl">
          {/* Decay progress — organic bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-secondary/10 overflow-hidden rounded-t-xl">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, hsl(var(--decay-${decayState})), hsl(var(--decay-${decayState}) / 0.2))`,
              }}
              initial={{ width: '100%' }}
              animate={{ width: `${100 - thought.decayLevel}%` }}
              transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
            />
          </div>

          {/* Category badge */}
          {thought.category !== 'uncategorized' && (
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs">{CATEGORY_META[thought.category].icon}</span>
              <span className="text-[10px] text-muted-foreground/35 font-thought tracking-wider">
                {CATEGORY_META[thought.category].label}
              </span>
            </div>
          )}

          {/* Content — with typography decay */}
          <div className="relative z-10">
            {useTypographyDecay ? (
              <TypographyDecay
                text={displayContent}
                decayLevel={thought.decayLevel}
                className={cn(
                  'font-thought text-sm leading-relaxed text-card-foreground',
                  'whitespace-pre-wrap break-words',
                  isRotMode && thought.decayLevel > 50 && 'chromatic-shift'
                )}
              />
            ) : (
              <p
                className={cn(
                  'font-thought text-sm leading-relaxed text-card-foreground',
                  'whitespace-pre-wrap break-words',
                  'transition-all duration-700',
                  thought.decayLevel > 60 && 'animate-letter-drift',
                )}
                style={{
                  letterSpacing: `${thought.decayLevel * 0.001}em`,
                  wordSpacing: `${thought.decayLevel * 0.002}em`,
                }}
              >
                {displayContent}
              </p>
            )}
          </div>

          {/* Footer */}
          <footer className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground/40 relative z-10">
            <div className="flex items-center gap-2">
              <span className="tabular-nums font-thought">{100 - thought.decayLevel}%</span>

              {thought.waterCount > 0 && (
                <span className="text-primary/35">💧×{thought.waterCount}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Water button */}
              {showWaterButton && thought.decayLevel > 10 && (
                <motion.button
                  onClick={handleWater}
                  className="px-2 py-1 rounded-lg bg-primary/8 text-primary/50 hover:bg-primary/15 hover:text-primary/80 transition-all duration-500"
                  whileTap={{ scale: 0.92 }}
                  title="Water this thought (extend life)"
                >
                  💧
                </motion.button>
              )}

              {/* Echo button */}
              {showEchoButton && thought.visibility === 'public' && thought.decayLevel < 90 && (
                <motion.button
                  onClick={() => onEcho?.(thought.id)}
                  className="px-2.5 py-1 rounded-lg bg-echo/8 text-echo/50 hover:bg-echo/15 hover:text-echo/80 transition-all duration-500 font-thought"
                  whileTap={{ scale: 0.92 }}
                  aria-label="Leave an echo"
                >
                  echo
                </motion.button>
              )}
            </div>
          </footer>

          {/* Rot mode indicator — breathing dot */}
          {isRotMode && (
            <motion.div
              className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full"
              style={{ background: 'hsl(var(--destructive) / 0.5)' }}
              animate={{ 
                scale: [1, 1.4, 1], 
                opacity: [0.4, 0.8, 0.4] 
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>
      </DecayShader>
    </motion.article>
  );
}
