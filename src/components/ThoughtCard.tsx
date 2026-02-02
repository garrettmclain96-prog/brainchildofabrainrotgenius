import { useMemo } from 'react';
import { Thought, getDecayState, applyRotEffect } from '@/types/thought';
import { cn } from '@/lib/utils';

interface ThoughtCardProps {
  thought: Thought;
  onEcho?: (thoughtId: string) => void;
  showEchoButton?: boolean;
}

export function ThoughtCard({ thought, onEcho, showEchoButton = true }: ThoughtCardProps) {
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
        'group relative p-5 rounded-md bg-card/60 backdrop-blur-sm',
        'transition-all duration-1000 ease-out',
        'hover:bg-card/80',
        stateStyles[decayState],
        thought.mode === 'rot' && thought.decayLevel > 30 && 'text-glitch'
      )}
      aria-label={`Thought, ${decayState} state`}
    >
      {/* Decay indicator bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-secondary rounded-t-md overflow-hidden">
        <div 
          className="h-full transition-all duration-2000 ease-linear"
          style={{ 
            width: `${100 - thought.decayLevel}%`,
            backgroundColor: `hsl(var(--decay-${decayState}))`,
          }}
        />
      </div>

      {/* Content */}
      <p 
        className={cn(
          'font-thought text-sm leading-relaxed text-card-foreground',
          'whitespace-pre-wrap break-words',
          decayTextStyles[decayState]
        )}
      >
        {displayContent}
      </p>

      {/* Footer */}
      <footer className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span className="opacity-60">
          {decayState === 'extinct' ? 'fading...' : `${100 - thought.decayLevel}% remaining`}
        </span>
        
        {showEchoButton && thought.visibility === 'public' && thought.decayLevel < 90 && (
          <button
            onClick={() => onEcho?.(thought.id)}
            className={cn(
              'px-3 py-1 rounded text-xs',
              'bg-secondary/50 text-secondary-foreground/70',
              'hover:bg-echo/20 hover:text-echo',
              'transition-all duration-500',
              'opacity-0 group-hover:opacity-100',
              'focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-echo/30'
            )}
            aria-label="Leave an echo"
          >
            echo
          </button>
        )}
      </footer>

      {/* Mode indicator */}
      {thought.mode === 'rot' && (
        <div 
          className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-destructive/40"
          title="Rot mode: text will decay visually"
        />
      )}
    </article>
  );
}
