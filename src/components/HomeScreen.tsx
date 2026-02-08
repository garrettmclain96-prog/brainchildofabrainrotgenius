import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppMode } from '@/hooks/useAppMode';
import { supabase } from '@/integrations/supabase/client';

interface HomeScreenProps {
  onEnter: () => void;
  isFirstVisit: boolean;
}

// ─── Step 1: Fade-in text ───
const FIRST_VISIT_LINES = [
  "You're not early. You're not late.",
];

const RETURNING_LINES = [
  "Things kept disappearing while you were gone.",
  "The rot continued without you.",
  "Some fragments held on. Barely.",
  "Nothing waited for you. That's the point.",
  "The decay doesn't pause.",
];

// ─── Starter interaction thoughts — shown mid-decay ───
const INTERACTION_THOUGHTS = [
  "I keep thinking I'll come back to this. I never do.",
  "This was meant for a different version of me.",
  "I don't think this deserves permanence.",
  "This keeps resurfacing for no reason.",
  "I was calmer before I thought this.",
  "This survived longer than it should have.",
  "I don't trust myself to keep this.",
  "This feels heavier every time I open it.",
];

const smoothEase: [number, number, number, number] = [0.23, 1, 0.32, 1];

export function HomeScreen({ onEnter, isFirstVisit }: HomeScreenProps) {
  const [phase, setPhase] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [fadedCount, setFadedCount] = useState<number | null>(null);
  const [interactionDone, setInteractionDone] = useState(false);
  const [interactionChoice, setInteractionChoice] = useState<'save' | 'rot' | null>(null);
  const [postChoiceMessage, setPostChoiceMessage] = useState(false);
  const { mode } = useAppMode();
  const isRot = mode === 'rot';

  const selectedLines = useMemo(() => {
    if (isFirstVisit) return FIRST_VISIT_LINES;
    const shuffled = [...RETURNING_LINES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 1);
  }, [isFirstVisit]);

  const interactionThought = useMemo(
    () => INTERACTION_THOUGHTS[Math.floor(Math.random() * INTERACTION_THOUGHTS.length)],
    []
  );

  // Fetch faded count
  useEffect(() => {
    supabase.rpc('count_faded_thoughts').then(({ data }) => {
      if (typeof data === 'number') setFadedCount(data);
    });
  }, []);

  // Auto-advance through lines — Step 1
  useEffect(() => {
    if (phase >= selectedLines.length) return;
    const timer = setTimeout(() => {
      setPhase((p) => p + 1);
    }, 2800);
    return () => clearTimeout(timer);
  }, [phase, selectedLines.length]);

  const handleEnter = useCallback(() => {
    setIsExiting(true);
    setTimeout(onEnter, 800);
  }, [onEnter]);

  // Step 3 → Step 4 → Step 5
  const handleInteraction = useCallback((choice: 'save' | 'rot') => {
    setInteractionChoice(choice);
    // Step 4: Show "something else faded" message
    setTimeout(() => {
      setPostChoiceMessage(true);
    }, 600);
    // Step 5: Rooms appear silently (enter)
    setTimeout(() => {
      setInteractionDone(true);
      setTimeout(handleEnter, 1200);
    }, 2200);
  }, [handleEnter]);

  // Show Step 2 interaction after Step 1 lines are done (first visit only)
  const showInteraction = isFirstVisit && phase >= selectedLines.length && !interactionDone;
  const showEnterButton = (!isFirstVisit && phase >= selectedLines.length) || interactionDone;

  return (
    <motion.div
      className={cn(
        'fixed inset-0 z-50 bg-background flex flex-col items-center justify-center',
        'cursor-pointer select-none'
      )}
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.8, ease: smoothEase }}
      onClick={() => {
        if (showEnterButton) handleEnter();
        else if (!showInteraction) setPhase(selectedLines.length);
      }}
    >
      {/* Subtle breathing orb */}
      <motion.div
        className="absolute w-64 h-64 rounded-full"
        style={{
          background: `radial-gradient(circle, hsl(var(--${isRot ? 'destructive' : 'primary'}) / 0.04) 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Title */}
      <motion.h1
        className="font-thought text-foreground/60 tracking-[0.3em] text-sm uppercase mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.3 }}
      >
        brainchild
      </motion.h1>

      {/* Step 1: Lines */}
      <div className="relative h-20 flex flex-col items-center justify-center gap-4 px-8">
        <AnimatePresence mode="wait">
          {selectedLines.map((line, i) => (
            i <= phase - 1 && (
              <motion.p
                key={line}
                className="text-center font-thought text-muted-foreground/50 text-sm tracking-wide leading-relaxed"
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ 
                  opacity: 0.7,
                  y: 0, 
                  filter: 'blur(0px)' 
                }}
                transition={{ duration: 0.9, ease: smoothEase }}
              >
                {line}
              </motion.p>
            )
          ))}
        </AnimatePresence>
      </div>

      {/* Faded count — ambient history */}
      <AnimatePresence>
        {fadedCount !== null && fadedCount > 0 && phase >= selectedLines.length && (
          <motion.p
            className="text-[10px] font-thought text-muted-foreground/25 tracking-[0.15em] mt-4"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, delay: 0.3 }}
          >
            {fadedCount} thoughts have already faded.
          </motion.p>
        )}
      </AnimatePresence>

      {/* Step 2 & 3: First-time interaction — a decaying thought */}
      <AnimatePresence>
        {showInteraction && (
          <motion.div
            className="mt-8 max-w-xs w-full px-6"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* The thought card at ~35% decay */}
            <div className="glass-premium rounded-xl p-4 mb-4 relative overflow-hidden">
              {/* Decay bar — ticking countdown */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-secondary/10 overflow-hidden rounded-t-xl">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'hsl(var(--decay-fading))' }}
                  initial={{ width: '65%' }}
                  animate={{ width: '30%' }}
                  transition={{ duration: 10, ease: 'linear' }}
                />
              </div>

              <p className="font-thought text-sm text-card-foreground/80 leading-relaxed tracking-wide">
                {interactionThought}
              </p>

              <div className="mt-2 flex items-center gap-2 text-[9px] font-thought text-muted-foreground/25 tracking-wider">
                <span>unclaimed</span>
                <span>·</span>
                <span>fading</span>
              </div>
            </div>

            {/* Step 3: Two buttons only — no tooltips */}
            <AnimatePresence>
              {!interactionChoice && (
                <motion.div
                  className="flex gap-3 justify-center"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <motion.button
                    onClick={() => handleInteraction('rot')}
                    className="px-4 py-2 rounded-xl text-xs font-thought text-muted-foreground/50 
                               border border-border/20 hover:border-border/40 hover:text-muted-foreground/70
                               transition-all duration-500"
                    whileTap={{ scale: 0.95 }}
                  >
                    let it rot
                  </motion.button>
                  <motion.button
                    onClick={() => handleInteraction('save')}
                    className="px-4 py-2 rounded-xl text-xs font-thought text-muted-foreground/40 
                               border border-border/15 hover:border-border/30 hover:text-muted-foreground/60
                               transition-all duration-500"
                    whileTap={{ scale: 0.95 }}
                  >
                    save
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 4: Post-choice message */}
            <AnimatePresence>
              {interactionChoice && !postChoiceMessage && (
                <motion.p
                  className="text-center text-[10px] font-thought text-muted-foreground/30 tracking-wider mt-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  {interactionChoice === 'rot' ? 'lighter.' : 'heavier.'}
                </motion.p>
              )}
              {postChoiceMessage && (
                <motion.p
                  className="text-center text-[10px] font-thought text-muted-foreground/30 tracking-wider mt-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  something else faded while you decided.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enter prompt (returning users, or after interaction) */}
      <motion.div
        className="absolute bottom-12 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: showEnterButton ? 1 : 0 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            handleEnter();
          }}
          className="px-6 py-2.5 rounded-xl text-xs font-thought text-muted-foreground/40 
                     border border-border/20 hover:border-border/40 hover:text-muted-foreground/60
                     transition-all duration-700"
          whileTap={{ scale: 0.95 }}
        >
          enter
        </motion.button>
      </motion.div>

      {/* Ambient status */}
      <motion.p
        className="absolute bottom-4 text-[10px] font-thought text-muted-foreground/12 tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 3, delay: 1 }}
      >
        things are always disappearing
      </motion.p>
    </motion.div>
  );
}
