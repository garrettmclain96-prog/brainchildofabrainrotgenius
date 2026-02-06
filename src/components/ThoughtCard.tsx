import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Thought, getDecayState, applyRotEffect } from '@/types/thought';
import { TiltCard } from '@/components/effects/MotionEffects';
import { cn } from '@/lib/utils';

interface ThoughtCardProps {
  thought: Thought;
  onEcho?: (thoughtId: string) => void;
  showEchoButton?: boolean;
}

export function ThoughtCard({ thought, onEcho, showEchoButton = true }: ThoughtCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const decayState = getDecayState(thought.decayLevel);
  
  const displayContent = useMemo(() => {
    if (thought.mode === 'rot') {
      return applyRotEffect(thought.content, thought.decayLevel);
    }
    return thought.content;
  }, [thought.content, thought.mode, thought.decayLevel]);

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

  const decayColors = {
    fresh: 'from-cyan-500/50 to-teal-500/50',
    fading: 'from-cyan-500/30 to-cyan-600/30',
    rotting: 'from-slate-500/30 to-slate-600/30',
    extinct: 'from-slate-700/20 to-slate-800/20',
  };

  return (
    <TiltCard maxTilt={8}>
      <motion.article
        className={cn(
          'group relative p-5 rounded-xl overflow-hidden',
          'glass-premium',
          'transition-all duration-500 ease-out',
          stateStyles[decayState],
          thought.mode === 'rot' && thought.decayLevel > 30 && 'text-glitch'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        whileHover={{ 
          y: -5,
          transition: { duration: 0.3 }
        }}
        aria-label={`Thought, ${decayState} state`}
      >
        {/* Animated gradient background */}
        <motion.div 
          className={cn(
            'absolute inset-0 opacity-0 transition-opacity duration-500',
            'bg-gradient-to-br',
            decayColors[decayState]
          )}
          animate={{ opacity: isHovered ? 0.3 : 0 }}
        />
        
        {/* Holographic shimmer on hover */}
        <motion.div 
          className="absolute inset-0 opacity-0"
          style={{
            background: 'linear-gradient(135deg, transparent 20%, hsl(var(--primary) / 0.1) 40%, hsl(var(--accent) / 0.1) 60%, transparent 80%)',
            backgroundSize: '200% 200%',
          }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            backgroundPosition: isHovered ? ['0% 0%', '200% 200%'] : '0% 0%',
          }}
          transition={{ 
            backgroundPosition: { duration: 2, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 0.3 }
          }}
        />

        {/* Decay progress bar with glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-secondary/30 rounded-t-xl overflow-hidden">
          <motion.div 
            className="h-full relative"
            style={{ 
              width: `${100 - thought.decayLevel}%`,
              background: `linear-gradient(90deg, hsl(var(--decay-${decayState})), hsl(var(--decay-${decayState}) / 0.5))`,
            }}
            initial={{ width: '100%' }}
            animate={{ width: `${100 - thought.decayLevel}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            {/* Animated glow pulse */}
            <motion.div 
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, transparent, hsl(var(--decay-${decayState})), transparent)`,
                backgroundSize: '200% 100%',
              }}
              animate={{
                backgroundPosition: ['0% 0%', '200% 0%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            
            {/* Glow effect at the edge */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-4"
              style={{
                background: `radial-gradient(circle at right, hsl(var(--decay-${decayState})), transparent)`,
                filter: 'blur(2px)',
              }}
            />
          </motion.div>
        </div>

        {/* Content with chromatic shift on rot mode */}
        <motion.p 
          className={cn(
            'font-thought text-sm leading-relaxed text-card-foreground',
            'whitespace-pre-wrap break-words relative z-10',
            'transition-all duration-500',
            decayTextStyles[decayState],
            thought.mode === 'rot' && thought.decayLevel > 50 && 'chromatic-shift'
          )}
          style={{
            textShadow: isHovered ? '0 0 30px hsl(var(--primary) / 0.2)' : 'none',
          }}
        >
          {displayContent}
        </motion.p>

        {/* Footer */}
        <footer className="mt-4 flex items-center justify-between text-xs text-muted-foreground relative z-10">
          <motion.span 
            className="opacity-60"
            animate={{ opacity: isHovered ? 0.9 : 0.6 }}
          >
            {decayState === 'extinct' ? (
              <span className="inline-flex items-center gap-0.5">
                {['f','a','d','i','n','g','.','.','.'].map((char, i) => (
                  <motion.span 
                    key={i}
                    animate={{ 
                      y: [0, -3, 0],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.1,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </span>
            ) : (
              <span className="tabular-nums">{100 - thought.decayLevel}% remaining</span>
            )}
          </motion.span>
          
          {showEchoButton && thought.visibility === 'public' && thought.decayLevel < 90 && (
            <motion.button
              onClick={() => onEcho?.(thought.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs relative overflow-hidden',
                'bg-secondary/30 text-secondary-foreground/70',
                'hover:bg-echo/20 hover:text-echo',
                'transition-all duration-300'
              )}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Leave an echo"
            >
              <span className="relative z-10">echo</span>
              <motion.span 
                className="absolute inset-0 bg-echo/20 rounded-lg"
                initial={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          )}
        </footer>

        {/* Rot mode indicator with enhanced animation */}
        {thought.mode === 'rot' && (
          <div className="absolute top-3 right-3">
            <motion.div 
              className="w-2.5 h-2.5 rounded-full bg-destructive/70"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              title="Rot mode: text will decay visually"
            />
            <motion.div 
              className="absolute inset-0 rounded-full border border-destructive/30"
              animate={{ 
                scale: [1, 2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          </div>
        )}

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-primary/20 rounded-tl-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-primary/20 rounded-br-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </motion.article>
    </TiltCard>
  );
}
