import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePublicFog } from '@/hooks/usePublicFog';
import { useAppMode } from '@/hooks/useAppMode';
import { useIdeaDrift } from '@/hooks/useIdeaDrift';
import { useThoughtStore } from '@/stores/thoughtStore';
import { useThoughtWeather } from '@/hooks/useThoughtWeather';
import { ThoughtCard } from '@/components/ThoughtCard';
import { EchoCard } from '@/components/EchoCard';
import { EchoComposer } from '@/components/EchoComposer';
import { ThoughtComposer } from '@/components/ThoughtComposer';
import { AnimatedEmptyState } from '@/components/AnimatedEmptyState';
import { IdeaDriftNotification } from '@/components/IdeaDriftNotification';
import { GraveyardView } from '@/components/GraveyardView';
import { ThoughtWeatherIndicator } from '@/components/ThoughtWeatherIndicator';
import { AppMoodState } from '@/hooks/useAppMoods';
import { ThoughtZone, ZONE_META, ZONE_PATTERNS } from '@/types/thought';
import { cn } from '@/lib/utils';
import { SubmitBurst } from '@/components/SubmitBurst';

const ZONES: ThoughtZone[] = ['overflow', 'quiet', 'noise', 'preserved'];

interface PublicFogViewProps {
  onAction?: () => void;
  appMood?: AppMoodState;
}

export function PublicFogView({ onAction, appMood }: PublicFogViewProps) {
  const {
    thoughts, echoes, activeZone, setZone, addEcho, createPublicThought,
    totalCount, isLoading, fadedCount, zoneCounts,
  } = usePublicFog();
  const { mode } = useAppMode();
  const { addPrivateThought } = useThoughtStore();

  const { driftedIdea, dismissDrift, saveDrift } = useIdeaDrift(thoughts);
  const weather = useThoughtWeather();

  const [echoingThoughtId, setEchoingThoughtId] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [showGraveyard, setShowGraveyard] = useState(false);
  const [bursts, setBursts] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // Pick a random pattern phrase for the active zone
  const patternPhrase = useMemo(() => {
    const patterns = ZONE_PATTERNS[activeZone];
    return patterns[Math.floor(Math.random() * patterns.length)];
  }, [activeZone]);

  const handleBurst = useCallback((x: number, y: number) => {
    const id = Date.now();
    setBursts((prev) => [...prev, { id, x, y }]);
  }, []);

  const removeBurst = useCallback((id: number) => {
    setBursts((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleSaveDrift = useCallback(() => {
    const idea = saveDrift();
    if (idea) {
      addPrivateThought(idea.mutatedContent, mode === 'rot' ? 'rot' : 'clean', 'ideas');
    }
  }, [saveDrift, addPrivateThought, mode]);

  const thoughtLimit = appMood?.mood === 'silent' ? 3 : appMood?.mood === 'fragmented' ? 8 : 6;
  const displayThoughts = thoughts.slice(0, thoughtLimit);
  const zoneInfo = ZONE_META[activeZone];

  return (
    <div className="min-h-screen relative pb-28">
      <AnimatePresence>
        {bursts.map((burst) => (
          <SubmitBurst key={burst.id} x={burst.x} y={burst.y} onComplete={() => removeBurst(burst.id)} />
        ))}
      </AnimatePresence>

      <IdeaDriftNotification drift={driftedIdea} onSave={handleSaveDrift} onDismiss={dismissDrift} />

      <header className="sticky top-10 z-20 bg-background/80 backdrop-blur-md border-b border-border/20 px-4 py-3">
        <div className="max-w-lg mx-auto">
          {/* Title + faded count */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h1 className={cn('text-lg font-thought text-foreground/90', mode === 'rot' && 'animate-glitch-subtle')}>
                fog
              </h1>
              <ThoughtWeatherIndicator weather={weather} />
            </div>

            <div className="flex items-center gap-2">
              {/* Graveyard toggle */}
              <motion.button
                onClick={() => setShowGraveyard(!showGraveyard)}
                className={cn(
                  'px-2 py-1 rounded-xl text-[10px] font-thought transition-all duration-300',
                  showGraveyard
                    ? 'text-muted-foreground/60'
                    : 'text-muted-foreground/25 hover:text-muted-foreground/40'
                )}
                whileTap={{ scale: 0.95 }}
              >
                ⟡
              </motion.button>

              {!showGraveyard && appMood?.mood !== 'withholding' && (
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
                  {showComposer ? '×' : '+'}
                </motion.button>
              )}
            </div>
          </div>

          {/* Faded count — ambient status */}
          {fadedCount > 0 && (
            <motion.p
              className="text-[10px] font-thought text-muted-foreground/25 tracking-wider mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.5 }}
            >
              {fadedCount} thoughts have already faded.
            </motion.p>
          )}

          {/* Room navigation — pre-existing zones */}
          {!showGraveyard && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {ZONES.map((zone) => {
                const meta = ZONE_META[zone];
                const isActive = activeZone === zone;
                const count = zoneCounts[zone];

                return (
                  <button
                    key={zone}
                    onClick={() => setZone(zone)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-thought whitespace-nowrap',
                      'transition-all duration-300 flex items-center gap-1.5',
                      isActive
                        ? 'bg-secondary/50 text-secondary-foreground'
                        : 'text-muted-foreground/40 hover:text-muted-foreground/60'
                    )}
                  >
                    <span className="opacity-60">{meta.icon}</span>
                    {meta.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 relative">
        {showGraveyard && <GraveyardView />}

        {!showGraveyard && (
          <>
            {/* Zone description + pattern phrase */}
            <motion.div
              key={activeZone}
              className="mb-5 px-1"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[10px] font-thought text-muted-foreground/30 tracking-wider italic">
                {zoneInfo.description}
              </p>
              <p className="text-[9px] font-thought text-muted-foreground/18 tracking-[0.15em] mt-1">
                {patternPhrase}
              </p>
            </motion.div>

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

            {!isLoading && displayThoughts.length === 0 && (
              <AnimatedEmptyState icon="fog" />
            )}

            <div className="space-y-4">
              {displayThoughts.map((thought, index) => (
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

                  {echoes.get(thought.id)?.length ? (
                    <div className="mt-2 ml-3 space-y-1.5">
                      {echoes.get(thought.id)?.slice(0, 3).map((echo) => (
                        <EchoCard key={echo.id} echo={echo} />
                      ))}
                    </div>
                  ) : null}

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
          </>
        )}
      </main>
    </div>
  );
}
