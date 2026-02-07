import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThoughtStore } from '@/stores/thoughtStore';
import { usePublicFog } from '@/hooks/usePublicFog';
import { useAppMode } from '@/hooks/useAppMode';
import { useAncestralEchoes } from '@/hooks/useAncestralEchoes';
import { useTimeGravity } from '@/hooks/useTimeGravity';
import { usePreservationFriction } from '@/hooks/usePreservationFriction';
import { useNightDecay } from '@/hooks/useNightDecay';
import { ThoughtCard } from '@/components/ThoughtCard';
import { ThoughtComposer } from '@/components/ThoughtComposer';
import { CategoryFilter } from '@/components/CategoryFilter';
import { AnimatedEmptyState } from '@/components/AnimatedEmptyState';
import { AncestralEchoOverlay } from '@/components/AncestralEchoOverlay';
import { CompassMode } from '@/components/CompassMode';
import { ForgettingCeremony } from '@/components/ForgettingCeremony';
import { DecaySpeed, FragmentCategory } from '@/types/thought';
import { AppMoodState } from '@/hooks/useAppMoods';
import { IdentityState } from '@/hooks/useIdentityDrift';
import { cn } from '@/lib/utils';
import { SubmitBurst } from '@/components/SubmitBurst';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PrivateThoughtsViewProps {
  onAction?: () => void;
  appMood?: AppMoodState;
  identity?: IdentityState;
}

export function PrivateThoughtsView({ onAction, appMood, identity }: PrivateThoughtsViewProps) {
  const { privateThoughts, addPrivateThought, deletePrivateThought, waterThought, starThought, releaseToFog } = useThoughtStore();
  const { addThought: addToPublicFog } = usePublicFog();
  const { mode } = useAppMode();

  const ancestral = useAncestralEchoes();
  const weightedThoughts = useTimeGravity(privateThoughts);
  const nightDecay = useNightDecay();

  // Preservation friction
  const starredCount = useMemo(() => privateThoughts.filter(t => t.starred).length, [privateThoughts]);
  const friction = usePreservationFriction(starredCount);

  const [selectedCategory, setSelectedCategory] = useState<FragmentCategory | 'all'>('all');
  const [compassActive, setCompassActive] = useState(false);
  const [ceremonyOpen, setCeremonyOpen] = useState(false);
  const [releaseDialog, setReleaseDialog] = useState<{ open: boolean; thoughtId: string | null }>({
    open: false,
    thoughtId: null,
  });
  const [selectedSpeed, setSelectedSpeed] = useState<DecaySpeed>('normal');
  const [bursts, setBursts] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // Undo delete — 5s grace period before permanent removal
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());
  const deleteTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    return () => {
      deleteTimers.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  const handleBurst = useCallback((x: number, y: number) => {
    const id = Date.now();
    setBursts((prev) => [...prev, { id, x, y }]);
  }, []);

  const removeBurst = useCallback((id: number) => {
    setBursts((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleTextChange = useCallback((text: string) => {
    ancestral.checkForEchoes(text);
  }, [ancestral]);

  const categoryCounts = useMemo(() => {
    const counts: Record<FragmentCategory, number> = {
      ideas: 0, tasks: 0, journal: 0, projects: 0, uncategorized: 0,
    };
    privateThoughts
      .filter(t => !pendingDeleteIds.has(t.id))
      .forEach((t) => { counts[t.category] = (counts[t.category] || 0) + 1; });
    return counts;
  }, [privateThoughts, pendingDeleteIds]);

  const filteredThoughts = useMemo(() => {
    const base = selectedCategory === 'all'
      ? weightedThoughts
      : weightedThoughts.filter(w => w.thought.category === selectedCategory);
    return base.filter(w => !pendingDeleteIds.has(w.thought.id));
  }, [weightedThoughts, selectedCategory, pendingDeleteIds]);

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

  // Star with emotional friction
  const handleStarRequest = useCallback((id: string) => {
    const thought = privateThoughts.find(t => t.id === id);
    if (!thought) return;

    // Unstarring is always allowed without friction
    if (thought.starred) {
      starThought(id);
      onAction?.();
      return;
    }

    // Starring requires confirmation
    friction.requestStar(id);
  }, [privateThoughts, starThought, onAction, friction]);

  const handleStarConfirm = useCallback(() => {
    const id = friction.confirmStar();
    if (id) {
      starThought(id);
      onAction?.();
    }
  }, [friction, starThought, onAction]);

  const handleDelete = useCallback((id: string) => {
    // Hide immediately (optimistic) but delay actual deletion
    setPendingDeleteIds(prev => new Set(prev).add(id));

    // Get a release reward message
    const reward = friction.getReleaseReward();

    const timer = setTimeout(() => {
      deletePrivateThought(id);
      setPendingDeleteIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      deleteTimers.current.delete(id);
    }, 5000);

    deleteTimers.current.set(id, timer);

    toast(reward, {
      description: 'it has returned to silence',
      action: {
        label: 'undo',
        onClick: () => {
          const existingTimer = deleteTimers.current.get(id);
          if (existingTimer) clearTimeout(existingTimer);
          deleteTimers.current.delete(id);
          setPendingDeleteIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        },
      },
      duration: 5000,
    });

    onAction?.();
  }, [deletePrivateThought, onAction, friction]);

  return (
    <div className="min-h-screen relative pb-28">
      <AnimatePresence>
        {bursts.map((burst) => (
          <SubmitBurst key={burst.id} x={burst.x} y={burst.y} onComplete={() => removeBurst(burst.id)} />
        ))}
      </AnimatePresence>

      <ForgettingCeremony thoughts={privateThoughts} isOpen={ceremonyOpen} onClose={() => setCeremonyOpen(false)} />

      {/* Preservation friction dialog */}
      <Dialog open={friction.showConfirmation} onOpenChange={(open) => !open && friction.cancelStar()}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 max-w-xs mx-4">
          <DialogHeader>
            <DialogTitle className="font-thought text-foreground/70 text-sm tracking-wide">
              {friction.confirmationPrompt}
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleStarConfirm}
              className="bg-amber-500/20 text-amber-400/90 hover:bg-amber-500/30 w-full font-thought text-xs"
              variant="ghost"
            >
              yes, preserve it
            </Button>
            <Button
              variant="ghost"
              onClick={friction.cancelStar}
              className="text-muted-foreground/50 w-full font-thought text-xs"
            >
              let it rot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/20 px-4 py-3">
        <div className="max-w-lg mx-auto">
          {/* App title and subtitle */}
          <div className="mb-3">
            <h1 className={cn('text-xl font-thought text-foreground/90 tracking-wide', mode === 'rot' && 'animate-glitch-subtle')}>
              Brainchild
            </h1>
            <p className="text-[11px] font-thought text-muted-foreground/40 tracking-wider mt-0.5 italic">
              {nightDecay.isNight
                ? 'the rot moves faster at night.'
                : 'if it matters, it survives'}
            </p>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className={cn('text-xs font-thought text-muted-foreground/50')}>
              {mode === 'rot' ? 'dump' : 'local'}
            </span>

            {privateThoughts.length > 0 && (
              <motion.button
                onClick={() => setCeremonyOpen(true)}
                className="px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground/30 hover:text-muted-foreground/60 transition-all"
                whileTap={{ scale: 0.95 }}
              >
                🔥
              </motion.button>
            )}
          </div>

          <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} counts={categoryCounts} />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 relative">
        <div className="mb-4">
          <CompassMode
            thoughts={privateThoughts}
            isActive={compassActive}
            onToggle={() => setCompassActive(!compassActive)}
          />
        </div>

        {!compassActive && (
          <div className="mb-6 p-4 glass rounded-xl">
            <ThoughtComposer
              onSubmit={handleSubmit}
              onBurst={handleBurst}
              onTextChange={handleTextChange}
            />

            <AncestralEchoOverlay
              echo={ancestral.echo}
              onMerge={handleMerge}
              onIgnore={ancestral.dismissEcho}
              onEraseBoth={ancestral.eraseBoth}
            />
          </div>
        )}

        {!compassActive && filteredThoughts.length === 0 && (
          <AnimatedEmptyState icon="thought" />
        )}

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
                  style={{ transform: `translateY(${visualOffset}px)` }}
                >
                  <ThoughtCard
                    thought={thought}
                    showEchoButton={false}
                    showStarButton
                    onStar={() => handleStarRequest(thought.id)}
                    onWater={() => {
                      waterThought(thought.id);
                      onAction?.();
                    }}
                    showWaterButton
                    
                  />

                  <motion.div
                    className="flex gap-2 mt-2 px-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <button
                      onClick={() => setReleaseDialog({ open: true, thoughtId: thought.id })}
                      className="px-4 py-2 rounded-xl text-xs font-thought bg-primary/10 text-primary/70 hover:bg-primary/20 transition-all"
                    >
                      share to fog
                    </button>
                    <button
                      onClick={() => handleDelete(thought.id)}
                      className="px-4 py-2 rounded-xl text-xs font-thought bg-destructive/10 text-destructive-foreground/50 hover:bg-destructive/20 transition-all"
                    >
                      let it go
                    </button>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <Dialog open={releaseDialog.open} onOpenChange={(open) => setReleaseDialog({ open, thoughtId: null })}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="font-thought text-foreground/90">share to fog</DialogTitle>
          </DialogHeader>

          {releaseDialog.thoughtId && (
            <div className="p-3 rounded-lg bg-secondary/20 border border-border/30">
              <p className="text-xs font-thought text-foreground/60 leading-relaxed line-clamp-4">
                {privateThoughts.find(t => t.id === releaseDialog.thoughtId)?.content}
              </p>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground/40 font-thought leading-relaxed">
            once shared, this thought enters the fog anonymously and decays on its own timeline
          </p>

          <div className="py-2">
            <span className="text-[10px] text-muted-foreground/50 font-thought mb-2 block">decay speed</span>
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
                  {speed}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handleRelease} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full font-thought">
              share to fog
            </Button>
            <Button
              variant="ghost"
              onClick={() => setReleaseDialog({ open: false, thoughtId: null })}
              className="text-muted-foreground w-full font-thought"
            >
              keep private
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
