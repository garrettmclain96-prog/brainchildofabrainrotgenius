import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePublicFog } from '@/hooks/usePublicFog';
import { useAppMode } from '@/hooks/useAppMode';
import { useIdeaDrift } from '@/hooks/useIdeaDrift';
import { useThoughtStore } from '@/stores/thoughtStore';
import { ThoughtCard } from '@/components/ThoughtCard';
import { EchoCard } from '@/components/EchoCard';
import { EchoComposer } from '@/components/EchoComposer';
import { ThoughtComposer } from '@/components/ThoughtComposer';
import { AnimatedEmptyState } from '@/components/AnimatedEmptyState';
import { IdeaDriftNotification } from '@/components/IdeaDriftNotification';
import { GraveyardView } from '@/components/GraveyardView';
import { cn } from '@/lib/utils';
import { SubmitBurst } from '@/components/SubmitBurst';

type FogFilter = 'all' | 'fading' | 'near-extinction' | 'recently-disturbed' | 'graveyard';

const filters: { value: FogFilter; label: string }[] = [
  { value: 'all', label: 'all' },
  { value: 'fading', label: 'fading' },
  { value: 'near-extinction', label: 'near extinction' },
  { value: 'recently-disturbed', label: 'echoed' },
  { value: 'graveyard', label: '⟡ graveyard' },
];

interface PublicFogViewProps {
  onAction?: () => void;
}

export function PublicFogView({ onAction }: PublicFogViewProps) {
  const {
    thoughts,
    echoes,
    filter,
    setFilter,
    addEcho,
    createPublicThought,
    totalCount,
    isLoading,
  } = usePublicFog();
  const { mode } = useAppMode();
  const { addPrivateThought } = useThoughtStore();

  // Phase 2: Idea Drift
  const { driftedIdea, dismissDrift, saveDrift } = useIdeaDrift(thoughts);

  const [echoingThoughtId, setEchoingThoughtId] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FogFilter>('all');
  const [bursts, setBursts] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleBurst = useCallback((x: number, y: number) => {
    const id = Date.now();
    setBursts((prev) => [...prev, { id, x, y }]);
  }, []);

  const removeBurst = useCallback((id: number) => {
    setBursts((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleFilterChange = (f: FogFilter) => {
    setActiveFilter(f);
    if (f !== 'graveyard') {
      setFilter(f as any);
    }
  };

  const handleSaveDrift = useCallback(() => {
    const idea = saveDrift();
    if (idea) {
      addPrivateThought(idea.mutatedContent, mode === 'rot' ? 'rot' : 'clean', 'ideas');
    }
  }, [saveDrift, addPrivateThought, mode]);

  const visibleThoughts = thoughts.slice(0, 6);
  const isGraveyard = activeFilter === 'graveyard';

  return (
    <div className="min-h-screen relative pb-28">
      {/* Submit burst effects */}
      <AnimatePresence>
        {bursts.map((burst) => (
          <SubmitBurst key={burst.id} x={burst.x} y={burst.y} onComplete={() => removeBurst(burst.id)} />
        ))}
      </AnimatePresence>

      {/* Phase 2: Idea Drift Notification */}
      <IdeaDriftNotification
        drift={driftedIdea}
        onSave={handleSaveDrift}
        onDismiss={dismissDrift}
      />

      {/* Header */}
      <header className="sticky top-10 z-20 bg-background/80 backdrop-blur-md border-b border-border/20 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className={cn('text-lg font-thought text-foreground/90', mode === 'rot' && 'animate-glitch-subtle')}>
                {isGraveyard
                  ? mode === 'rot' ? 'the graveyard' : 'resting place'
                  : mode === 'rot' ? 'the void' : 'public fog'}
              </h1>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5 flex items-center gap-1.5">
                <span className="inline-block w-1 h-1 rounded-full bg-echo/50 animate-pulse" />
                {isGraveyard
                  ? 'where thoughts go to rest'
                  : `${totalCount} thoughts drifting · all will fade`}
              </p>
            </div>

            {!isGraveyard && (
              <motion.button
                onClick={() => setShowComposer(!showComposer)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-thought',
                  'bg-primary/10 text-primary hover:bg-primary/20',
                  'transition-all duration-300',
                  showComposer && 'bg-primary/20'
                )}
                whileTap={{ scale: 0.95 }}
              >
                {showComposer ? 'close' : 'release'}
              </motion.button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => handleFilterChange(f.value)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[10px] font-thought whitespace-nowrap',
                  'transition-all duration-300',
                  activeFilter === f.value
                    ? f.value === 'graveyard'
                      ? 'bg-destructive/20 text-destructive-foreground/70'
                      : 'bg-secondary/50 text-secondary-foreground'
                    : 'text-muted-foreground/50 hover:text-muted-foreground'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 relative">
        {/* Graveyard view */}
        {isGraveyard && <GraveyardView />}

        {/* Regular fog view */}
        {!isGraveyard && (
          <>
            {/* Composer */}
            <AnimatePresence>
              {showComposer && (
                <motion.div
                  className="mb-6 p-4 glass rounded-xl"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ThoughtComposer
                    isPublic
                    onSubmit={(content, decayMode, speed) => {
                      createPublicThought(content, decayMode, speed);
                      setShowComposer(false);
                      onAction?.();
                    }}
                    onBurst={handleBurst}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading */}
            {isLoading && (
              <div className="text-center py-20">
                <span className="text-muted-foreground/40 text-sm font-thought">gathering fog...</span>
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

            {/* Thoughts */}
            <div className="space-y-4">
              {visibleThoughts.map((thought, index) => (
                <motion.div
                  key={thought.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  style={{
                    marginLeft: `${Math.sin(index * 1.5) * 5 + 5}%`,
                    maxWidth: `${92 - Math.sin(index * 2) * 8}%`,
                  }}
                >
                  <ThoughtCard
                    thought={thought}
                    onEcho={(id) => setEchoingThoughtId(id)}
                    showEchoButton={echoingThoughtId !== thought.id}
                  />

                  {/* Echoes */}
                  {echoes.get(thought.id)?.length ? (
                    <div className="mt-2 ml-3 space-y-1.5">
                      {echoes
                        .get(thought.id)
                        ?.slice(0, 3)
                        .map((echo) => (
                          <EchoCard key={echo.id} echo={echo} />
                        ))}
                    </div>
                  ) : null}

                  {/* Echo composer */}
                  {echoingThoughtId === thought.id && (
                    <div className="mt-2 ml-3">
                      <EchoComposer
                        thoughtId={thought.id}
                        onSubmit={(tid, text) => {
                          addEcho(tid, text);
                          setEchoingThoughtId(null);
                          onAction?.();
                        }}
                        onCancel={() => setEchoingThoughtId(null)}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* More indicator */}
            {thoughts.length > 6 && (
              <div className="text-center mt-8 text-[10px] text-muted-foreground/25 font-thought">
                {thoughts.length - 6} more thoughts hidden in the fog
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-16 left-0 right-0 text-center py-2 text-[10px] text-muted-foreground/15 pointer-events-none font-thought">
        everything here will fade
      </footer>
    </div>
  );
}
