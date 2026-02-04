import { useMemo, useState } from 'react';
import { Thought, getDecayState, applyRotEffect } from '@/types/thought';
import { cn } from '@/lib/utils';

interface ThoughtCardProps {
  thought: Thought;
  onEcho?: (thoughtId: string) => void;
  showEchoButton?: boolean;
}

export function ThoughtCard({ thought, onEcho, showEchoButton = true }: ThoughtCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const decayState = getDecayState(thought.decayLevel);
  
  // Apply rot effect if in rot mode
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

  return (
    <article
      className={cn(
        'group relative p-5 rounded-md',
        'bg-card/60 backdrop-blur-sm',
        'transition-all duration-500 ease-out',
        'hover:bg-card/80 hover-lift card-interactive',
        stateStyles[decayState],
        thought.mode === 'rot' && thought.decayLevel > 30 && 'text-glitch',
        isHovered && 'animate-border-glow'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`Thought, ${decayState} state`}
    >
      {/* Animated glow effect on hover */}
      <div 
        className={cn(
          'absolute -inset-px rounded-md opacity-0 transition-opacity duration-500',
          'bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0',
          isHovered && 'opacity-100 animate-shimmer'
        )}
        style={{ backgroundSize: '200% 100%' }}
      />

      {/* Decay indicator bar with animated gradient */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-secondary rounded-t-md overflow-hidden">
        <div 
          className="h-full transition-all duration-2000 ease-linear relative overflow-hidden"
          style={{ 
            width: `${100 - thought.decayLevel}%`,
            backgroundColor: `hsl(var(--decay-${decayState}))`,
          }}
        >
          {/* Shimmer effect on decay bar */}
          <div className="absolute inset-0 animate-shimmer" />
        </div>
      </div>

      {/* Content */}
      <p 
        className={cn(
          'font-thought text-sm leading-relaxed text-card-foreground',
          'whitespace-pre-wrap break-words',
          'transition-all duration-500',
          decayTextStyles[decayState]
        )}
      >
        {displayContent}
      </p>

      {/* Footer */}
      <footer className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span className={cn(
          'opacity-60 transition-all duration-300',
          isHovered && 'opacity-90'
        )}>
          {decayState === 'extinct' ? (
            <span className="inline-flex items-center gap-1">
              <span className="animate-wave" style={{ animationDelay: '0s' }}>f</span>
              <span className="animate-wave" style={{ animationDelay: '0.1s' }}>a</span>
              <span className="animate-wave" style={{ animationDelay: '0.2s' }}>d</span>
              <span className="animate-wave" style={{ animationDelay: '0.3s' }}>i</span>
              <span className="animate-wave" style={{ animationDelay: '0.4s' }}>n</span>
              <span className="animate-wave" style={{ animationDelay: '0.5s' }}>g</span>
              <span className="animate-wave" style={{ animationDelay: '0.6s' }}>.</span>
              <span className="animate-wave" style={{ animationDelay: '0.7s' }}>.</span>
              <span className="animate-wave" style={{ animationDelay: '0.8s' }}>.</span>
            </span>
          ) : (
            `${100 - thought.decayLevel}% remaining`
          )}
        </span>
        
        {showEchoButton && thought.visibility === 'public' && thought.decayLevel < 90 && (
          <button
            onClick={() => onEcho?.(thought.id)}
            className={cn(
              'px-3 py-1.5 rounded text-xs relative overflow-hidden',
              'bg-secondary/50 text-secondary-foreground/70',
              'hover:bg-echo/20 hover:text-echo',
              'transition-all duration-500',
              'opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0',
              'focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-echo/30'
            )}
            aria-label="Leave an echo"
          >
            <span className="relative z-10">echo</span>
            <span className="absolute inset-0 bg-echo/10 scale-0 group-hover:scale-100 transition-transform duration-500 rounded" />
          </button>
        )}
      </footer>

      {/* Mode indicator with pulse */}
      {thought.mode === 'rot' && (
        <div className="absolute top-2 right-2">
          <div 
            className="w-2 h-2 rounded-full bg-destructive/60 animate-pulse"
            title="Rot mode: text will decay visually"
          />
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-destructive/30 animate-ping" />
        </div>
      )}
    </article>
  );
}
