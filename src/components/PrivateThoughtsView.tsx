import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThoughtStore } from '@/stores/thoughtStore';
import { usePublicFog } from '@/hooks/usePublicFog';
import { useAppMode } from '@/hooks/useAppMode';
import { useAncestralEchoes } from '@/hooks/useAncestralEchoes';
import { useTimeGravity } from '@/hooks/useTimeGravity';
import { usePreservationFriction } from '@/hooks/usePreservationFriction';
import { useNightDecay } from '@/hooks/useNightDecay';
import { useAIReflection } from '@/hooks/useAIReflection';
import { ThoughtCard } from '@/components/ThoughtCard';
import { ThoughtComposer } from '@/components/ThoughtComposer';
import { CategoryFilter } from '@/components/CategoryFilter';
import { AnimatedEmptyState } from '@/components/AnimatedEmptyState';
import { AncestralEchoOverlay } from '@/components/AncestralEchoOverlay';
import { CompassMode } from '@/components/CompassMode';
import { ForgettingCeremony } from '@/components/ForgettingCeremony';
import { DecaySpeed, FragmentCategory, PremiumDecayMode, HalfLife, Thought } from '@/types/thought';
import { QuietSearch } from '@/components/QuietSearch';
import { DecayTimeline } from '@/components/DecayTimeline';
import { ThresholdRite } from '@/components/ThresholdRite';
import { useThresholdRite } from '@/hooks/useThresholdRite';
import { LastWords } from '@/components/LastWords';
import { useLastWords } from '@/hooks/useLastWords';
import { useOfflineState } from '@/hooks/useOfflineState';
import { useSeasonOfRot } from '@/hooks/useSeasonOfRot';
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
  const { privateThoughts, addPrivateThought, deletePrivateThought, waterThought, starThought, releaseToFog, stitchThoughts } = useThoughtStore();
  const { addThought: addToPublicFog } = usePublicFog();
  const { mode } = useAppMode();

  const ancestral = useAncestralEchoes();
  const weightedThoughts = useTimeGravity(privateThoughts);
  const nightDecay = useNightDecay();
  const aiReflection = useAIReflection();

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
  const [query, setQuery] = useState('');
  const [timelineThought, setTimelineThought] = useState<Thought | null>(null);
  const [stitchFrom, setStitchFrom] = useState<string | null>(null);

  const threshold = useThresholdRite(privateThoughts.length > 0);
  const lastWords = useLastWords(privateThoughts);
  const offline = useOfflineState();
  const season = useSeasonOfRot();

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
    const needle = query.trim().toLowerCase();
    return base
      .filter(w => !pendingDeleteIds.has(w.thought.id))
      .filter(w => !needle || w.thought.content.toLowerCase().includes(needle));
  }, [weightedThoughts, selectedCategory, pendingDeleteIds, query]);

  const handleRelease = () => {
    if (releaseDialog.thoughtId) {
      const publicThought = releaseToFog(releaseDialog.thoughtId, selectedSpeed);
      if (publicThought) addToPublicFog(publicThought);
      setReleaseDialog({ open: false, thoughtId: null });
    }
  };

  const handleSubmit = useCallback(
    (content: string, decayMode: any, _speed: any, category?: FragmentCategory, premiumDecayMode?: PremiumDecayMode, halfLife?: HalfLife) => {
      addPrivateThought(content, decayMode, category, premiumDecayMode, halfLife);
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

  // Fragment Stitching — pick a first fragment, then a second to absorb into it
  const handleStitch = useCallback((id: string) => {
    if (!stitchFrom) {
      setStitchFrom(id);
      toast('choose a second fragment', { description: 'they will become one' });
      return;
    }
    if (stitchFrom === id) {
      setStitchFrom(null);
      return;
    }
    stitchThoughts(stitchFrom, id);
    setStitchFrom(null);
    toast('stitched', { description: 'one thought now, with the longer life' });
    onAction?.();
  }, [stitchFrom, stitchThoughts, onAction]);

  const handleLastWordsKeep = useCallback((id: string) => {
    starThought(id);
    lastWords.dismiss();
  }, [starThought, lastWords]);

  const handleLastWordsRelease = useCallback((id: string) => {
    deletePrivateThought(id);
    lastWords.dismiss();
  }, [deletePrivateThought, lastWords]);

  return (
    <div className="min-h-screen relative pb-28">
      <ThresholdRite isOpen={threshold.isOpen} question={threshold.question} onComplete={threshold.complete} />

      <DecayTimeline thought={timelineThought} onClose={() => setTimelineThought(null)} />

      <LastWords
        thought={lastWords.candidate}
        onKeep={handleLastWordsKeep}
        onRelease={handleLastWordsRelease}
        onDismiss={lastWords.dismiss}
      />
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
              className="bg-primary/20 text-primary hover:bg-primary/30 w-full font-thought text-xs"
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

      <header className="sticky top-0 z-20 glass-premium border-b border-border/10 px-4 py-4">
        <div className="max-w-lg mx-auto">
          {/* App title — display serif */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className={cn(
                'text-lg font-display text-foreground/85 tracking-[0.2em] uppercase',
                mode === 'rot' && 'animate-glitch-subtle'
              )}>
                brainchild
              </h1>
              <p className="text-[10px] font-sans text-muted-foreground/50 tracking-[0.15em] mt-1">
                {offline.label
                  ? offline.label
                  : nightDecay.isNight
                    ? 'the rot moves faster at night'
                    : season.whisper}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <QuietSearch value={query} onChange={setQuery} matchCount={filteredThoughts.length} />
              <span className="text-[10px] font-sans text-muted-foreground/40 tracking-widest uppercase">
                {mode === 'rot' ? 'rot' : 'prune'}
              </span>
              {privateThoughts.length > 0 && (
                <motion.button
                  onClick={() => setCeremonyOpen(true)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-xs text-muted-foreground/25 hover:text-primary/50 hover:bg-primary/5 transition-all duration-500"
                  whileTap={{ scale: 0.9 }}
                  aria-label="Forgetting ceremony"
                >
                  ~
                </motion.button>
              )}
            </div>
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
                  layout="position"
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
                    showReflectButton
                    onStar={() => handleStarRequest(thought.id)}
                    onWater={() => {
                      waterThought(thought.id);
                      onAction?.();
                    }}
                    onReflect={(id, content) => aiReflection.requestReflection(id, content)}
                    reflectionState={aiReflection}
                    onDismissReflection={aiReflection.dismissReflection}
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
                      className="px-4 py-2 rounded-xl text-xs font-thought bg-primary/15 text-primary/85 hover:bg-primary/25 transition-all"
                    >
                      share to fog
                    </button>
                    <button
                      onClick={() => handleDelete(thought.id)}
                      className="px-4 py-2 rounded-xl text-xs font-thought bg-destructive/10 text-destructive-foreground/65 hover:bg-destructive/20 transition-all"
                    >
                      let it go
                    </button>
                    <button
                      onClick={() => setTimelineThought(thought)}
                      className="min-h-[44px] px-3 rounded-xl text-xs font-thought text-muted-foreground/45 hover:text-primary/65 transition-all"
                      aria-label="See its decay"
                    >
                      trace
                    </button>
                    <button
                      onClick={() => handleStitch(thought.id)}
                      className={cn(
                        'min-h-[44px] px-3 rounded-xl text-xs font-thought transition-all',
                        stitchFrom === thought.id
                          ? 'text-primary/80 bg-primary/10'
                          : 'text-muted-foreground/45 hover:text-primary/65'
                      )}
                      aria-label="Stitch with another fragment"
                    >
                      {stitchFrom === thought.id ? 'stitching…' : 'stitch'}
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
