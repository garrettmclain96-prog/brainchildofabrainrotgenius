import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useThoughtStore } from '@/stores/thoughtStore';
import { useAppMode } from '@/hooks/useAppMode';
import { useDarkMode } from '@/hooks/useDarkMode';
import { usePatternWhisper } from '@/hooks/usePatternWhisper';
import { ModeToggle } from '@/components/ModeToggle';
import { DissolveButton } from '@/components/DissolveButton';
import { FinitudeDial } from '@/components/FinitudeDial';
import { SelfReflection } from '@/components/SelfReflection';
import { PatternWhisper } from '@/components/PatternWhisper';
import { AppMoodState } from '@/hooks/useAppMoods';
import { IdentityState } from '@/hooks/useIdentityDrift';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
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
}

export function SettingsView({ onReplayIntro, audio, appMood, identity }: SettingsViewProps) {
  const {
    socialEnabled,
    socialPermanentlyDisabled,
    toggleSocial,
    nuclearDisableSocial,
    privateThoughts,
  } = useThoughtStore();
  const { mode } = useAppMode();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const patternWhisper = usePatternWhisper();
  return (
    <div className="min-h-screen px-6 py-8 pb-28">
      <div className="max-w-lg mx-auto space-y-8">
        <header>
          <h1 className="text-xl font-thought text-foreground/85 tracking-wider">controls</h1>
        </header>

        {/* Self Reflection — quiet status signals */}
        <SelfReflection thoughts={privateThoughts} />

        {/* Pattern Whisper — AI observations */}
        <PatternWhisper
          whisper={patternWhisper.whisper}
          isLoading={patternWhisper.isLoading}
          thoughts={privateThoughts}
          tone={identity?.tone}
          profile={identity?.profile}
          onRequest={patternWhisper.requestWhisper}
          onDismiss={patternWhisper.dismissWhisper}
        />

        {/* Finitude Dial */}
        <section>
          <FinitudeDial thoughts={privateThoughts} />
        </section>

        {/* Section label — experience */}
        <h2 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 mb-2 mt-2">experience</h2>

        {/* Mode Toggle */}
        <section className="glass-premium rounded-xl p-4">
          <ModeToggle />
        </section>

        {/* Dark Mode Toggle */}
        <section className="glass-premium rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground/70 font-thought">dark mode</span>
            <motion.button
              onClick={toggleDark}
              className={cn(
                'w-12 h-6 rounded-full transition-all duration-700 relative',
                isDark ? 'bg-primary/80' : 'bg-secondary/50'
              )}
              whileTap={{ scale: 0.95 }}
            >
              <motion.span
                className="absolute top-1 w-4 h-4 rounded-full bg-foreground/90 shadow-lg"
                animate={{ left: isDark ? 26 : 4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              />
            </motion.button>
          </div>
        </section>

        {/* Ambient Audio */}
        {audio && (
          <section className="glass-premium rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/70 font-thought">sound</span>
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

            <AnimatePresence>
              {audio.isPlaying && (
                <motion.div
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audio.volume}
                    onChange={(e) => audio.setVolume(parseFloat(e.target.value))}
                    className="flex-1 h-1 rounded-full appearance-none bg-secondary/30 accent-primary"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {/* Section label — social */}
        <h2 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 mb-2 mt-2">social</h2>

        {/* Social Layer */}
        <section className="glass-premium rounded-xl p-4 space-y-4">
          {!socialPermanentlyDisabled ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground/70 font-thought">fog</span>
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
                    className="w-full px-3 py-2.5 rounded-lg text-xs text-destructive-foreground/65 bg-destructive/8 hover:bg-destructive/15 transition-all duration-700 text-left font-thought tracking-wide"
                    whileTap={{ scale: 0.98 }}
                  >
                    disable permanently
                  </motion.button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card/95 backdrop-blur-2xl border-border/30 max-w-sm mx-4">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-thought text-foreground/80">
                      this cannot be undone
                    </AlertDialogTitle>
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
              fog disabled
            </p>
          )}
        </section>

        {/* Section label — actions */}
        <h2 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 mb-2 mt-2">actions</h2>

        {/* Replay intro */}
        <section className="glass-premium rounded-xl p-4">
          <motion.button
            onClick={onReplayIntro}
            className="w-full text-xs text-muted-foreground/55 font-thought tracking-wide hover:text-muted-foreground/75 transition-all py-2"
            whileTap={{ scale: 0.98 }}
          >
            replay entrance
          </motion.button>
        </section>

        {/* Connect Dashboard */}
        <section className="glass-premium rounded-xl p-4">
          <Link
            to="/connect/dashboard"
            className="block w-full text-xs text-muted-foreground/55 font-thought tracking-wide hover:text-muted-foreground/75 transition-all py-2 text-center"
          >
            connect dashboard →
          </Link>
        </section>
        {/* Dissolve */}
        <section className="glass-premium rounded-xl p-4">
          <DissolveButton />
        </section>
      </div>
    </div>
  );
}
