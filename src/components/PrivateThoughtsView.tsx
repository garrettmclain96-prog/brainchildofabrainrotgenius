import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThoughtStore } from '@/stores/thoughtStore';
import { usePublicFog } from '@/hooks/usePublicFog';
import { useAppMode } from '@/hooks/useAppMode';
import { useResonance } from '@/hooks/useResonance';
import { useAncestralEchoes } from '@/hooks/useAncestralEchoes';
import { useTimeGravity } from '@/hooks/useTimeGravity';
import { ThoughtCard } from '@/components/ThoughtCard';
import { ThoughtComposer } from '@/components/ThoughtComposer';
import { CategoryFilter } from '@/components/CategoryFilter';
import { AnimatedEmptyState } from '@/components/AnimatedEmptyState';
import { ResonancePanel } from '@/components/ResonancePanel';
import { ProductivityInsight } from '@/components/ProductivityInsight';
import { AncestralEchoOverlay } from '@/components/AncestralEchoOverlay';
import { CompassMode } from '@/components/CompassMode';
import { ForgettingCeremony } from '@/components/ForgettingCeremony';
import { DecaySpeed, FragmentCategory } from '@/types/thought';
import { cn } from '@/lib/utils';
import { SubmitBurst } from '@/components/SubmitBurst';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PrivateThoughtsViewProps {
  onAction?: () => void;
}

export function PrivateThoughtsView({ onAction }: PrivateThoughtsViewProps) {
  const { privateThoughts, addPrivateThought, deletePrivateThought, waterThought, releaseToFog } = useThoughtStore();
  const { addThought: addToPublicFog } = usePublicFog();
  const { mode } = useAppMode();

  // Cognitive systems
  const resonancePatterns = useResonance(privateThoughts);
  const ancestral = useAncestralEchoes();
  const weightedThoughts = useTimeGravity(privateThoughts);

  const [selectedCategory, setSelectedCategory] = useState<FragmentCategory | 'all'>('all');
  const [compassActive, setCompassActive] = useState(false);
  const [ceremonyOpen, setCeremonyOpen] = useState(false);
  const [releaseDialog, setReleaseDialog] = useState<{ open: boolean; thoughtId: string | null }>({
    open: false,
    thoughtId: null,
  });
  const [selectedSpeed, setSelectedSpeed] = useState<DecaySpeed>('normal');
  const [bursts, setBursts] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleBurst = useCallback((x: number, y: number) => {
    const id = Date.now();
    setBursts((prev) => [...prev, { id, x, y }]);
  }, []);

  const removeBurst = useCallback((id: number) => {
    setBursts((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<FragmentCategory, number> = {
      ideas: 0, tasks: 0, journal: 0, projects: 0, uncategorized: 0,
    };
    privateThoughts.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [privateThoughts]);

  // Filter by category, apply gravity sorting
  const filteredThoughts = useMemo(() => {
    const weighted = selectedCategory === 'all'
      ? weightedThoughts
      : weightedThoughts.filter((w) => w.thought.category === selectedCategory);
    return weighted;
  }, [weightedThoughts, selectedCategory]);

  const handleRelease = () => {
    if (releaseDialog.thoughtId) {
      const publicThought = releaseToFog(releaseDialog.thoughtId, selectedSpeed);
      if (publicThought) addToPublicFog(publicThought);
      setReleaseDialog({ open: false, thoughtId: null });
    }
  };

  const handleSubmit = useCallback(
    (content: string, decayMode: any, _speed: any, category?: FragmentCategory) => {
      addPrivateThought(content, decayMode, category);
      ancestral.dismissEcho();
      onAction?.();
    },
    [addPrivateThought, onAction, ancestral]
  );

  const handleMerge = useCallback(() => {
    const merged = ancestral.mergeWithAncestor();
    if (merged) {
      addPrivateThought(merged, mode === 'rot' ? 'rot' : 'clean', 'ideas');
    }
  }, [ancestral, addPrivateThought, mode]);

  return (
    <div className="min-h-screen relative pb-28">
      {/* Submit bursts */}
      <AnimatePresence>
        {bursts.map((burst) => (
          <SubmitBurst key={burst.id} x={burst.x} y={burst.y} onComplete={() => removeBurst(burst.id)} />
        ))}
      </AnimatePresence>

      {/* Forgetting Ceremony */}
      <ForgettingCeremony thoughts={privateThoughts} isOpen={ceremonyOpen} onClose={() => setCeremonyOpen(false)} />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/20 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className={cn('text-lg font-thought text-foreground/90', mode === 'rot' && 'animate-glitch-subtle')}>
                {mode === 'rot' ? 'brain dump' : 'fragments'}
              </h1>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5 flex items-center gap-1.5">
                <span className="inline-block w-1 h-1 rounded-full bg-primary/50 animate-pulse" />
                {mode === 'rot' ? 'let the rot flow' : 'private · local · yours'}
              </p>
            </div>

            {/* Ceremony button */}
            {privateThoughts.length > 0 && (
              <motion.button
                onClick={() => setCeremonyOpen(true)}
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-thought text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-secondary/20 transition-all"
                whileTap={{ scale: 0.95 }}
              >
                🔥 ceremony
              </motion.button>
            )}
          </div>

          <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} counts={categoryCounts} />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 relative">
        {/* Compass Mode */}
        <div className="mb-4">
          <CompassMode
            thoughts={privateThoughts}
            isActive={compassActive}
            onToggle={() => setCompassActive(!compassActive)}
          />
        </div>

        {/* Composer */}
        {!compassActive && (
          <div className="mb-6 p-4 glass rounded-xl">
            <ThoughtComposer
              onSubmit={handleSubmit}
              onBurst={handleBurst}
              onTextChange={ancestral.checkForEchoes}
            />
            {/* Ancestral echo overlay */}
            <AncestralEchoOverlay
              echo={ancestral.echo}
              onMerge={handleMerge}
              onIgnore={ancestral.dismissEcho}
              onEraseBoth={ancestral.eraseBoth}
            />
          </div>
        )}

        {/* Resonance & Insights */}
        {!compassActive && (
          <>
            <ResonancePanel patterns={resonancePatterns} />
            <ProductivityInsight thoughts={privateThoughts} />
          </>
        )}

        {/* Empty state */}
        {!compassActive && filteredThoughts.length === 0 && (
          <AnimatedEmptyState
            title={selectedCategory === 'all' ? 'no fragments yet.' : `no ${selectedCategory} yet.`}
            subtitle={mode === 'rot' ? 'feed the compost heap.' : 'write something above.'}
            icon="thought"
          />
        )}

        {/* Thoughts list — with time gravity */}
        {!compassActive && (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredThoughts.map(({ thought, weight, visualOffset }) => (
                <motion.div
                  key={thought.id}
                  className="group relative"
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: visualOffset }}
                  exit={{ opacity: 0, x: -100, filter: 'blur(10px)' }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }}
                  style={{
                    // Heavy thoughts have subtle visual weight
                    transform: `translateY(${visualOffset}px)`,
                  }}
                >
                  {/* Weight indicator */}
                  {weight > 0.6 && (
                    <motion.div
                      className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 rounded-full bg-muted-foreground/10"
                      style={{ height: `${weight * 30}px` }}
                      animate={{ opacity: [0.1, 0.2, 0.1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  )}

                  <ThoughtCard
                    thought={thought}
                    showEchoButton={false}
                    onWater={() => {
                      waterThought(thought.id);
                      onAction?.();
                    }}
                    showWaterButton
                  />

                  {/* Actions */}
                  <motion.div
                    className="flex gap-2 mt-2 px-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <button
                      onClick={() => setReleaseDialog({ open: true, thoughtId: thought.id })}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-thought bg-primary/10 text-primary/70 hover:bg-primary/20 transition-all"
                    >
                      release to fog
                    </button>
                    <button
                      onClick={() => {
                        deletePrivateThought(thought.id);
                        onAction?.();
                      }}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-thought bg-destructive/10 text-destructive-foreground/50 hover:bg-destructive/20 transition-all"
                    >
                      delete
                    </button>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Release dialog */}
      <Dialog open={releaseDialog.open} onOpenChange={(open) => setReleaseDialog({ open, thoughtId: null })}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="font-thought text-foreground/90">release to fog</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {mode === 'rot'
                ? 'once released, this thought dissolves into the collective unconscious. you cannot retrieve it.'
                : 'Once released, this thought becomes anonymous and will decay. You cannot retrieve it.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-3">
            <p className="text-xs text-muted-foreground/60 mb-2">decay speed:</p>
            <div className="flex gap-2">
              {(['normal', 'fast', 'sink'] as DecaySpeed[]).map((speed) => (
                <button
                  key={speed}
                  onClick={() => setSelectedSpeed(speed)}
                  className={cn(
                    'flex-1 px-3 py-2.5 rounded-xl text-xs font-thought',
                    'transition-all duration-200',
                    selectedSpeed === speed
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/30 text-secondary-foreground hover:bg-secondary/50'
                  )}
                >
                  <span className="block font-medium">{speed}</span>
                  <span className="block text-[10px] opacity-50 mt-0.5">
                    {speed === 'normal' ? '1 hour' : speed === 'fast' ? '15 min' : '5 min'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handleRelease} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
              release
            </Button>
            <Button
              variant="ghost"
              onClick={() => setReleaseDialog({ open: false, thoughtId: null })}
              className="text-muted-foreground w-full"
            >
              keep private
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
