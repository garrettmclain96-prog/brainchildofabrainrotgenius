import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePublicFog } from '@/hooks/usePublicFog';
import { ThoughtCard } from '@/components/ThoughtCard';
import { EchoCard } from '@/components/EchoCard';
import { EchoComposer } from '@/components/EchoComposer';
import { ThoughtComposer } from '@/components/ThoughtComposer';
import { AnimatedEmptyState } from '@/components/AnimatedEmptyState';
import { FloatingParticles } from '@/components/FloatingParticles';
import { GlowingOrb } from '@/components/GlowingOrb';
import { cn } from '@/lib/utils';
import { SubmitBurst } from '@/components/SubmitBurst';
import { StaggerChildren, StaggerItem } from '@/components/effects/MotionEffects';

type FogFilter = 'all' | 'fading' | 'near-extinction' | 'recently-disturbed';

const filters: { value: FogFilter; label: string }[] = [
  { value: 'all', label: 'all' },
  { value: 'fading', label: 'fading' },
  { value: 'near-extinction', label: 'near extinction' },
  { value: 'recently-disturbed', label: 'echoed' },
];

export function PublicFogView() {
  const { 
    thoughts, 
    echoes, 
    filter, 
    setFilter, 
    addEcho, 
    createPublicThought,
    totalCount,
    isLoading 
  } = usePublicFog();
  
  const [echoingThoughtId, setEchoingThoughtId] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
   const [bursts, setBursts] = useState<Array<{ id: number; x: number; y: number }>>([]);

   const handleBurst = useCallback((x: number, y: number) => {
     const id = Date.now();
     setBursts(prev => [...prev, { id, x, y }]);
   }, []);
 
   const removeBurst = useCallback((id: number) => {
     setBursts(prev => prev.filter(b => b.id !== id));
   }, []);
 
  // Limit visible thoughts for anti-feed (max 6)
  const visibleThoughts = thoughts.slice(0, 6);

  const handleEcho = (thoughtId: string) => {
    setEchoingThoughtId(thoughtId);
  };

  const handleEchoSubmit = (thoughtId: string, text: string) => {
    addEcho(thoughtId, text);
    setEchoingThoughtId(null);
  };

  return (
    <div className="min-h-screen relative">
       {/* Submit burst effects */}
       {bursts.map(burst => (
         <SubmitBurst 
           key={burst.id} 
           x={burst.x} 
           y={burst.y} 
           onComplete={() => removeBurst(burst.id)} 
         />
       ))}
       
      {/* Ambient visual elements */}
      <FloatingParticles />
      <GlowingOrb className="top-40 right-20" color="echo" size="lg" intensity="medium" />
      <GlowingOrb className="bottom-20 left-20" color="primary" size="md" intensity="low" />
      <GlowingOrb className="top-1/2 left-1/3" color="accent" size="sm" intensity="low" />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/30 px-6 py-4 relative overflow-hidden">
        {/* Animated gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-echo/50 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-thought text-foreground/90 text-gradient">public fog</h1>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-echo/50 animate-pulse" />
              {totalCount} thoughts drifting • all will fade
            </p>
          </div>
          
          <button
            onClick={() => setShowComposer(!showComposer)}
            className={cn(
              'px-4 py-2 rounded text-sm relative overflow-hidden group',
              'bg-primary/10 text-primary',
              'hover:bg-primary/20',
              'transition-all duration-300',
              showComposer && 'bg-primary/20 animate-glow-pulse'
            )}
          >
            <span className="relative z-10">{showComposer ? 'close' : 'release thought'}</span>
            <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 relative">
        {/* Composer */}
        {showComposer && (
          <div className="mb-8 p-5 glass rounded-lg fog-appear relative group hover-glow">
            <div className="absolute -inset-1 bg-gradient-to-r from-echo/5 via-primary/5 to-echo/5 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <ThoughtComposer
                isPublic
                onSubmit={(content, mode, speed) => {
                  createPublicThought(content, mode, speed);
                  setShowComposer(false);
                }}
               onBurst={handleBurst}
              />
            </div>
          </div>
        )}

        {/* Filters with animated selection */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs whitespace-nowrap relative overflow-hidden',
                'transition-all duration-300',
                filter === f.value
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30'
              )}
            >
              <span className="relative z-10">{f.label}</span>
              {filter === f.value && (
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
              )}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-20">
            <div className="relative inline-block">
              <span className="text-muted-foreground/50 text-sm font-thought">
                gathering fog
              </span>
              <span className="inline-flex ml-1">
                <span className="animate-wave" style={{ animationDelay: '0s' }}>.</span>
                <span className="animate-wave" style={{ animationDelay: '0.2s' }}>.</span>
                <span className="animate-wave" style={{ animationDelay: '0.4s' }}>.</span>
              </span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && visibleThoughts.length === 0 && (
          <AnimatedEmptyState
            title={filter === 'all' ? 'the fog is empty.' : 'no thoughts match this filter.'}
            subtitle={filter === 'all' ? 'release a thought.' : undefined}
            icon="fog"
          />
        )}

        {/* Thoughts grid - sparse, random placement */}
        <div className="space-y-6">
          {visibleThoughts.map((thought, index) => (
            <div 
              key={thought.id} 
              className="fog-appear"
              style={{ 
                animationDelay: `${index * 200}ms`,
                marginLeft: `${Math.random() * 10}%`,
                maxWidth: `${90 - Math.random() * 15}%`,
              }}
            >
              <ThoughtCard
                thought={thought}
                onEcho={handleEcho}
                showEchoButton={echoingThoughtId !== thought.id}
              />
              
              {/* Echoes for this thought */}
              {echoes.get(thought.id)?.length ? (
                <div className="mt-3 ml-4 space-y-2">
                  {echoes.get(thought.id)?.slice(0, 3).map((echo) => (
                    <EchoCard key={echo.id} echo={echo} />
                  ))}
                </div>
              ) : null}
              
              {/* Echo composer */}
              {echoingThoughtId === thought.id && (
                <div className="mt-3 ml-4">
                  <EchoComposer
                    thoughtId={thought.id}
                    onSubmit={handleEchoSubmit}
                    onCancel={() => setEchoingThoughtId(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* More thoughts indicator */}
        {thoughts.length > 6 && (
          <div className="text-center mt-10 text-xs text-muted-foreground/40">
            {thoughts.length - 6} more thoughts hidden in the fog
          </div>
        )}
      </main>

      {/* Impermanence reminder */}
      <footer className="fixed bottom-0 left-0 right-0 text-center py-3 text-xs text-muted-foreground/30 pointer-events-none">
        everything here will fade
      </footer>
    </div>
  );
}
