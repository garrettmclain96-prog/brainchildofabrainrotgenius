import { motion, AnimatePresence } from 'framer-motion';
import { useThoughtStore } from '@/stores/thoughtStore';
import { useAppMode } from '@/hooks/useAppMode';
import { ModeToggle } from '@/components/ModeToggle';
import { DissolveButton } from '@/components/DissolveButton';
import { FinitudeDial } from '@/components/FinitudeDial';
import { AppMoodState } from '@/hooks/useAppMoods';
import { IdentityState } from '@/hooks/useIdentityDrift';
import { PermanentConsequences } from '@/hooks/usePermanentConsequences';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SettingsViewProps {
  onReplayIntro: () => void;
  audio?: {
    isPlaying: boolean;
    volume: number;
    startAmbient: () => void;
    stopAmbient: () => void;
    setVolume: (v: number) => void;
  };
  appMood?: AppMoodState;
  identity?: IdentityState;
  consequences?: PermanentConsequences;
}

export function SettingsView({ onReplayIntro, audio, appMood, identity, consequences }: SettingsViewProps) {
  const {
    socialEnabled,
    socialPermanentlyDisabled,
    toggleSocial,
    nuclearDisableSocial,
    privateThoughts,
  } = useThoughtStore();
  const { mode } = useAppMode();

  return (
    <div className="min-h-screen px-6 py-8 pb-28">
      <div className="max-w-lg mx-auto space-y-8">
        {/* Header */}
        <header>
          <h1 className="text-xl font-thought text-foreground/80 text-gradient tracking-wider">controls</h1>
          <p className="text-xs text-muted-foreground/40 mt-1.5 tracking-wide">
            {identity ? identity.appGreeting : 'shape how your mind breathes here'}
          </p>
        </header>

        {/* Identity Drift — who you're becoming */}
        {identity && identity.tone !== 'neutral' && (
          <section className="space-y-3">
            <h2 className="text-sm font-thought text-muted-foreground/60 tracking-wider">identity</h2>
            <div className="glass-premium rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-foreground/70">{identity.profile}</span>
                  <p className="text-[10px] text-muted-foreground/35 mt-0.5">
                    writing tone: {identity.tone} · {identity.velocityTrend}
                  </p>
                </div>
              </div>
              {identity.previousTone && identity.previousTone !== identity.tone && (
                <p className="text-[9px] text-muted-foreground/20 italic">
                  you used to write {identity.previousTone}. now it's {identity.tone}. the app notices.
                </p>
              )}
            </div>
          </section>
        )}

        {/* Permanent Consequences — scars */}
        {consequences && consequences.marks.totalDissolutions > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-thought text-muted-foreground/60 tracking-wider">scars</h2>
            <div className="glass-premium rounded-xl p-4 space-y-2">
              {consequences.scars.reducedDecayTime && (
                <p className="text-[10px] text-muted-foreground/30 font-thought">
                  ◆ decay runs faster now. you've dissolved too many times.
                </p>
              )}
              {consequences.scars.deeperHauntings && (
                <p className="text-[10px] text-muted-foreground/30 font-thought">
                  ◆ hauntings reach deeper. you looked behind the curtain.
                </p>
              )}
              {consequences.marks.rotModeAbandoned && (
                <p className="text-[10px] text-muted-foreground/30 font-thought">
                  ◆ rot mode is permanently locked. you chose to leave it.
                </p>
              )}
              <p className="text-[8px] text-muted-foreground/10 mt-2 italic">
                these cannot be undone.
              </p>
            </div>
          </section>
        )}

        {/* App Mood indicator */}
        {appMood && (
          <section className="space-y-3">
            <h2 className="text-sm font-thought text-muted-foreground/60 tracking-wider">app state</h2>
            <div className="glass-premium rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-foreground/70">{appMood.mood}</span>
                  <p className="text-[10px] text-muted-foreground/35 mt-0.5 italic">
                    {appMood.description}
                  </p>
                </div>
                <motion.div
                  className="w-3 h-3 rounded-full bg-primary/30"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>
              <p className="text-[9px] text-muted-foreground/20 mt-3 tracking-wide">
                the app's mood shifts on its own. you don't control this.
              </p>
            </div>
          </section>
        )}

        {/* Finitude Dial */}
        <section className="space-y-3">
          <h2 className="text-sm font-thought text-muted-foreground/60 tracking-wider">finitude</h2>
          <FinitudeDial thoughts={privateThoughts} />
        </section>

        {/* Mode Toggle */}
        <section className="space-y-3">
          <h2 className="text-sm font-thought text-muted-foreground/60 tracking-wider">experience mode</h2>
          <div className="glass-premium rounded-xl p-4 space-y-3">
            <ModeToggle />
            <p className="text-xs text-muted-foreground/40 leading-relaxed">
              {mode === 'rot'
                ? 'embrace the rot: faster decay, visual glitching, text mutation, creative chaos.'
                : 'prune the decay: clean typography, calm colors, slower decay, focused clarity.'}
            </p>
          </div>
        </section>

        {/* Ambient Audio */}
        {audio && (
          <section className="space-y-3">
            <h2 className="text-sm font-thought text-muted-foreground/60 tracking-wider">soundscape</h2>
            <div className="glass-premium rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-foreground/70">ambient audio</span>
                  <p className="text-[10px] text-muted-foreground/35 mt-0.5">
                    procedural hums, tape hiss, organic textures
                  </p>
                </div>
                <motion.button
                  onClick={audio.isPlaying ? audio.stopAmbient : audio.startAmbient}
                  className={cn(
                    'w-12 h-6 rounded-full transition-all duration-700 relative',
                    audio.isPlaying ? 'bg-primary/80' : 'bg-secondary/50'
                  )}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.span
                    className="absolute top-1 w-4 h-4 rounded-full bg-foreground/90 shadow-lg"
                    animate={{ left: audio.isPlaying ? 26 : 4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  />
                </motion.button>
              </div>

              {/* Volume slider */}
              <AnimatePresence>
                {audio.isPlaying && (
                  <motion.div
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <span className="text-[10px] text-muted-foreground/30">quiet</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={audio.volume}
                      onChange={(e) => audio.setVolume(parseFloat(e.target.value))}
                      className="flex-1 h-1 rounded-full appearance-none bg-secondary/30 accent-primary"
                    />
                    <span className="text-[10px] text-muted-foreground/30">loud</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Social Layer */}
        <section className="space-y-3">
          <h2 className="text-sm font-thought text-muted-foreground/60 tracking-wider">social layer</h2>
          <div className="glass-premium rounded-xl p-4 space-y-4">
            {!socialPermanentlyDisabled ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-foreground/70">public fog</span>
                    <p className="text-[10px] text-muted-foreground/35 mt-0.5">
                      anonymous shared idea field
                    </p>
                  </div>
                  <motion.button
                    onClick={toggleSocial}
                    className={cn(
                      'w-12 h-6 rounded-full transition-all duration-700 relative',
                      socialEnabled ? 'bg-primary/80' : 'bg-secondary/50'
                    )}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.span
                      className="absolute top-1 w-4 h-4 rounded-full bg-foreground/90 shadow-lg"
                      animate={{ left: socialEnabled ? 26 : 4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    />
                  </motion.button>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <motion.button
                      className="w-full px-3 py-2.5 rounded-lg text-xs text-destructive-foreground/50 bg-destructive/8 hover:bg-destructive/15 transition-all duration-700 text-left font-thought tracking-wide"
                      whileTap={{ scale: 0.98 }}
                    >
                      permanently disable social (nuclear option)
                    </motion.button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card/95 backdrop-blur-2xl border-border/30 max-w-sm mx-4">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-thought text-foreground/80">
                        nuclear option
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground/60">
                        This permanently disables the social layer for this device. You will never
                        access the public fog again. Private thoughts remain untouched.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-col gap-2">
                      <AlertDialogAction
                        onClick={nuclearDisableSocial}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full"
                      >
                        disable forever
                      </AlertDialogAction>
                      <AlertDialogCancel className="bg-secondary text-secondary-foreground hover:bg-secondary/80 w-full mt-0">
                        cancel
                      </AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <p className="text-xs text-muted-foreground/30 text-center py-2 font-thought">
                social layer permanently disabled
              </p>
            )}
          </div>
        </section>

        {/* Dissolve */}
        <section className="space-y-3">
          <h2 className="text-sm font-thought text-muted-foreground/60 tracking-wider">dissolution</h2>
          <div className="glass-premium rounded-xl p-4 space-y-3">
            <DissolveButton />
            {privateThoughts.length > 0 && (
              <p className="text-xs text-muted-foreground/30 text-center font-thought">
                {privateThoughts.length} fragment{privateThoughts.length !== 1 ? 's' : ''} in memory
              </p>
            )}
          </div>
        </section>

        {/* Other */}
        <section className="space-y-3">
          <h2 className="text-sm font-thought text-muted-foreground/60 tracking-wider">other</h2>
          <div className="glass-premium rounded-xl p-4 space-y-3">
            <motion.button
              onClick={onReplayIntro}
              className="w-full px-3 py-2.5 rounded-lg text-xs text-muted-foreground/50 hover:text-foreground/60 bg-secondary/20 hover:bg-secondary/35 transition-all duration-700 text-left font-thought tracking-wide"
              whileTap={{ scale: 0.98 }}
            >
              replay intro
            </motion.button>
          </div>
        </section>

        {/* Philosophy footer */}
        <footer className="text-center pt-10 pb-6">
          <motion.p 
            className="text-xs text-muted-foreground/15 font-thought italic"
            animate={{ opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 8, repeat: Infinity }}
          >
            "rot to root. decay to dream."
          </motion.p>
          <p className="text-[10px] text-muted-foreground/8 mt-2 tracking-[0.3em] uppercase">
            no tracking · no accounts · no analytics
          </p>
        </footer>
      </div>
    </div>
  );
}
