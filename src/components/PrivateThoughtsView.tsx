import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThoughtStore } from '@/stores/thoughtStore';
import { usePublicFog } from '@/hooks/usePublicFog';
import { ThoughtCard } from '@/components/ThoughtCard';
import { ThoughtComposer } from '@/components/ThoughtComposer';
import { AnimatedEmptyState } from '@/components/AnimatedEmptyState';
import { FloatingParticles } from '@/components/FloatingParticles';
import { GlowingOrb } from '@/components/GlowingOrb';
import { DecaySpeed } from '@/types/thought';
import { cn } from '@/lib/utils';
import { SubmitBurst } from '@/components/SubmitBurst';
import { Reveal, StaggerChildren, StaggerItem } from '@/components/effects/MotionEffects';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function PrivateThoughtsView() {
  const { privateThoughts, addPrivateThought, deletePrivateThought, releaseToFog } = useThoughtStore();
  const { addThought: addToPublicFog } = usePublicFog();
  
  const [releaseDialog, setReleaseDialog] = useState<{ open: boolean; thoughtId: string | null }>({
    open: false,
    thoughtId: null,
  });
  const [selectedSpeed, setSelectedSpeed] = useState<DecaySpeed>('normal');
   const [bursts, setBursts] = useState<Array<{ id: number; x: number; y: number }>>([]);
 
   const handleBurst = useCallback((x: number, y: number) => {
     const id = Date.now();
     setBursts(prev => [...prev, { id, x, y }]);
   }, []);
 
   const removeBurst = useCallback((id: number) => {
     setBursts(prev => prev.filter(b => b.id !== id));
   }, []);

  const handleRelease = () => {
    if (releaseDialog.thoughtId) {
      const publicThought = releaseToFog(releaseDialog.thoughtId, selectedSpeed);
      if (publicThought) {
        addToPublicFog(publicThought);
      }
      setReleaseDialog({ open: false, thoughtId: null });
    }
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
      <GlowingOrb className="top-20 left-10" color="primary" size="lg" intensity="low" />
      <GlowingOrb className="bottom-40 right-10" color="accent" size="md" intensity="low" />

      {/* Header with gradient border */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/30 px-6 py-4 relative overflow-hidden">
        {/* Animated gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-thought text-foreground/90 text-gradient">private thoughts</h1>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse" />
            these never leave unless you release them
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 relative">
        {/* Composer with glow effect */}
        <div className="mb-8 p-5 glass rounded-lg relative group hover-glow transition-all duration-500">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative">
            <ThoughtComposer
              onSubmit={(content, mode) => {
                addPrivateThought(content, mode);
              }}
               onBurst={handleBurst}
            />
          </div>
        </div>

        {/* Empty state */}
        {privateThoughts.length === 0 && (
          <AnimatedEmptyState
            title="no thoughts captured yet."
            subtitle="write something above."
            icon="thought"
          />
        )}

        {/* Thoughts list */}
        <div className="space-y-4">
          {privateThoughts.map((thought, index) => (
            <div 
              key={thought.id} 
              className="group relative fog-appear"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ThoughtCard thought={thought} showEchoButton={false} />
              
              {/* Actions overlay */}
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={() => setReleaseDialog({ open: true, thoughtId: thought.id })}
                  className={cn(
                    'px-2 py-1 rounded text-xs',
                    'bg-primary/20 text-primary',
                    'hover:bg-primary/30',
                    'transition-colors duration-200'
                  )}
                  title="Release to public fog"
                >
                  release
                </button>
                <button
                  onClick={() => deletePrivateThought(thought.id)}
                  className={cn(
                    'px-2 py-1 rounded text-xs',
                    'bg-destructive/20 text-destructive-foreground/70',
                    'hover:bg-destructive/30',
                    'transition-colors duration-200'
                  )}
                  title="Delete permanently"
                >
                  delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Release confirmation dialog */}
      <Dialog open={releaseDialog.open} onOpenChange={(open) => setReleaseDialog({ open, thoughtId: null })}>
        <DialogContent className="bg-card border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-thought text-foreground/90">release to fog</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Once released, this thought becomes anonymous and will decay over time.
              You cannot retrieve it.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-xs text-muted-foreground mb-3">Choose decay speed:</p>
            <div className="flex gap-2">
              {(['normal', 'fast', 'sink'] as DecaySpeed[]).map((speed) => (
                <button
                  key={speed}
                  onClick={() => setSelectedSpeed(speed)}
                  className={cn(
                    'flex-1 px-3 py-2 rounded text-sm',
                    'transition-all duration-200',
                    selectedSpeed === speed
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'
                  )}
                >
                  <span className="block font-medium">{speed}</span>
                  <span className="block text-xs opacity-60 mt-0.5">
                    {speed === 'normal' ? '1 hour' : speed === 'fast' ? '15 min' : '5 min'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setReleaseDialog({ open: false, thoughtId: null })}
              className="text-muted-foreground"
            >
              keep private
            </Button>
            <Button
              onClick={handleRelease}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
