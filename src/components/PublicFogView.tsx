import { useState } from 'react';
import { usePublicFog } from '@/hooks/usePublicFog';
import { ThoughtCard } from '@/components/ThoughtCard';
import { EchoCard } from '@/components/EchoCard';
import { EchoComposer } from '@/components/EchoComposer';
import { ThoughtComposer } from '@/components/ThoughtComposer';
import { cn } from '@/lib/utils';

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
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/30 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-thought text-foreground/90">public fog</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {totalCount} thoughts drifting • all will fade
            </p>
          </div>
          
          <button
            onClick={() => setShowComposer(!showComposer)}
            className={cn(
              'px-4 py-2 rounded text-sm',
              'bg-primary/10 text-primary',
              'hover:bg-primary/20',
              'transition-all duration-300',
              showComposer && 'bg-primary/20'
            )}
          >
            {showComposer ? 'close' : 'release thought'}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Composer */}
        {showComposer && (
          <div className="mb-8 p-5 bg-card/40 rounded-lg border border-border/30 fog-appear">
            <ThoughtComposer
              isPublic
              onSubmit={(content, mode, speed) => {
                createPublicThought(content, mode, speed);
                setShowComposer(false);
              }}
            />
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs whitespace-nowrap',
                'transition-all duration-300',
                filter === f.value
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-20">
            <p className="text-muted-foreground/50 text-sm font-thought animate-pulse">
              gathering fog...
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && visibleThoughts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground/50 text-sm font-thought">
              {filter === 'all' 
                ? 'the fog is empty. release a thought.' 
                : 'no thoughts match this filter.'}
            </p>
          </div>
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
