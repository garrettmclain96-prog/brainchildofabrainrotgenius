import { motion } from 'framer-motion';
import { useThoughtStore } from '@/stores/thoughtStore';
import { useAppMode } from '@/hooks/useAppMode';
import { ModeToggle } from '@/components/ModeToggle';
import { DissolveButton } from '@/components/DissolveButton';
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
}

export function SettingsView({ onReplayIntro }: SettingsViewProps) {
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
          <h1 className="text-xl font-thought text-foreground/90 text-gradient">controls</h1>
          <p className="text-xs text-muted-foreground mt-1">
            shape how your mind breathes here
          </p>
        </header>

        {/* Mode Toggle */}
        <section className="space-y-3">
          <h2 className="text-sm font-thought text-muted-foreground">experience mode</h2>
          <div className="glass rounded-xl p-4 space-y-3">
            <ModeToggle />
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              {mode === 'rot'
                ? 'embrace the rot: faster decay, visual glitching, text mutation, creative chaos.'
                : 'prune the decay: clean typography, calm colors, slower decay, focused clarity.'}
            </p>
          </div>
        </section>

        {/* Social Layer */}
        <section className="space-y-3">
          <h2 className="text-sm font-thought text-muted-foreground">social layer</h2>
          <div className="glass rounded-xl p-4 space-y-4">
            {!socialPermanentlyDisabled ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-foreground/80">public fog</span>
                    <p className="text-xs text-muted-foreground/50 mt-0.5">
                      anonymous shared idea field
                    </p>
                  </div>
                  <motion.button
                    onClick={toggleSocial}
                    className={cn(
                      'w-12 h-6 rounded-full transition-colors duration-300 relative',
                      socialEnabled ? 'bg-primary' : 'bg-secondary'
                    )}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.span
                      className="absolute top-1 w-4 h-4 rounded-full bg-foreground shadow-lg"
                      animate={{ left: socialEnabled ? 26 : 4 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <motion.button
                      className="w-full px-3 py-2 rounded-lg text-xs text-destructive-foreground/60 bg-destructive/10 hover:bg-destructive/20 transition-colors text-left"
                      whileTap={{ scale: 0.98 }}
                    >
                      permanently disable social (nuclear option)
                    </motion.button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/50 max-w-sm mx-4">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-thought text-foreground">
                        nuclear option
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
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
              <p className="text-xs text-muted-foreground/40 text-center py-2">
                social layer permanently disabled
              </p>
            )}
          </div>
        </section>

        {/* Dissolve */}
        <section className="space-y-3">
          <h2 className="text-sm font-thought text-muted-foreground">dissolution</h2>
          <div className="glass rounded-xl p-4 space-y-3">
            <DissolveButton />
            {privateThoughts.length > 0 && (
              <p className="text-xs text-muted-foreground/40 text-center">
                {privateThoughts.length} fragment{privateThoughts.length !== 1 ? 's' : ''} in memory
              </p>
            )}
          </div>
        </section>

        {/* Other */}
        <section className="space-y-3">
          <h2 className="text-sm font-thought text-muted-foreground">other</h2>
          <div className="glass rounded-xl p-4 space-y-3">
            <motion.button
              onClick={onReplayIntro}
              className="w-full px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
              whileTap={{ scale: 0.98 }}
            >
              replay intro
            </motion.button>
          </div>
        </section>

        {/* Philosophy footer */}
        <footer className="text-center pt-8 pb-4">
          <p className="text-xs text-muted-foreground/20 font-thought italic">
            "rot to root. decay to dream."
          </p>
          <p className="text-[10px] text-muted-foreground/10 mt-2 tracking-widest uppercase">
            no tracking · no accounts · no analytics
          </p>
        </footer>
      </div>
    </div>
  );
}
