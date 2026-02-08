import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppMode } from '@/hooks/useAppMode';
import { supabase } from '@/integrations/supabase/client';

interface HomeScreenProps {
  onEnter: () => void;
  isFirstVisit: boolean;
}

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

  useEffect(() => {
    supabase.rpc('count_faded_thoughts').then(({ data }) => {
      if (typeof data === 'number') setFadedCount(data);
    });
  }, []);

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

  const handleInteraction = useCallback((choice: 'save' | 'rot') => {
    setInteractionChoice(choice);
    setTimeout(() => {
      setPostChoiceMessage(true);
    }, 600);
    setTimeout(() => {
      setInteractionDone(true);
      setTimeout(handleEnter, 1200);
    }, 2200);
  }, [handleEnter]);

  const showInteraction = isFirstVisit && phase >= selectedLines.length && !interactionDone;
  const showEnterButton = (!isFirstVisit && phase >= selectedLines.length) || interactionDone;

  return (
    <motion.div
      className={cn(
        'fixed inset-0 z-50 bg-background flex flex-col items-center justify-center',
        'cursor-pointer select-none overflow-hidden'
      )}
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.8, ease: smoothEase }}
      onClick={() => {
        if (showEnterButton) handleEnter();
        else if (!showInteraction) setPhase(selectedLines.length);
      }}
    >
      {/* Ethereal luminous orbs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full"
        style={{
          background: `radial-gradient(circle, hsl(38 60% 55% / 0.06) 0%, hsl(330 30% 45% / 0.03) 40%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.4, 0.7, 0.4],
          x: [0, 20, 0],
          y: [0, -15, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      <motion.div
        className="absolute w-72 h-72 rounded-full"
        style={{
          background: `radial-gradient(circle, hsl(260 30% 50% / 0.05) 0%, hsl(38 40% 50% / 0.02) 40%, transparent 70%)`,
          filter: 'blur(50px)',
          top: '20%',
          right: '10%',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.55, 0.3],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* Title — display font */}
      <motion.h1
        className="font-display text-foreground/70 tracking-[0.25em] text-lg uppercase mb-14"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.3 }}
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
                className="text-center font-thought text-foreground/50 text-base tracking-wide leading-relaxed italic"
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

      {/* Faded count */}
      <AnimatePresence>
        {fadedCount !== null && fadedCount > 0 && phase >= selectedLines.length && (
          <motion.p
            className="text-xs font-thought text-muted-foreground/40 tracking-[0.12em] mt-5 italic"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, delay: 0.3 }}
          >
            {fadedCount} thoughts have already faded.
          </motion.p>
        )}
      </AnimatePresence>

      {/* First-time interaction */}
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
            <div className="glass-premium rounded-2xl p-5 mb-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-secondary/10 overflow-hidden rounded-t-2xl">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'hsl(var(--decay-fading))' }}
                  initial={{ width: '65%' }}
                  animate={{ width: '30%' }}
                  transition={{ duration: 10, ease: 'linear' }}
                />
              </div>

              <p className="font-thought text-base text-card-foreground/80 leading-relaxed tracking-wide italic">
                {interactionThought}
              </p>

              <div className="mt-3 flex items-center gap-2 text-[10px] font-sans text-muted-foreground/30 tracking-wider">
                <span>unclaimed</span>
                <span>·</span>
                <span>fading</span>
              </div>
            </div>

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
                    className="px-5 py-2.5 rounded-xl text-sm font-thought text-foreground/50 
                               border border-foreground/10 hover:border-foreground/20 hover:text-foreground/70
                               transition-all duration-500 italic"
                    whileTap={{ scale: 0.95 }}
                  >
                    let it rot
                  </motion.button>
                  <motion.button
                    onClick={() => handleInteraction('save')}
                    className="px-5 py-2.5 rounded-xl text-sm font-thought text-foreground/40 
                               border border-foreground/08 hover:border-foreground/15 hover:text-foreground/60
                               transition-all duration-500 italic"
                    whileTap={{ scale: 0.95 }}
                  >
                    save
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {interactionChoice && !postChoiceMessage && (
                <motion.p
                  className="text-center text-xs font-thought text-foreground/30 tracking-wider mt-3 italic"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  {interactionChoice === 'rot' ? 'lighter.' : 'heavier.'}
                </motion.p>
              )}
              {postChoiceMessage && (
                <motion.p
                  className="text-center text-xs font-thought text-foreground/30 tracking-wider mt-3 italic"
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

      {/* Enter prompt */}
      <motion.div
        className="absolute bottom-14 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: showEnterButton ? 1 : 0 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            handleEnter();
          }}
          className="px-7 py-3 rounded-2xl text-sm font-thought text-foreground/50 
                     border border-foreground/10 hover:border-primary/30 hover:text-foreground/70
                     transition-all duration-700 hover:shadow-[0_0_20px_hsl(38_75%_65%_/_0.1)] italic"
          whileTap={{ scale: 0.95 }}
        >
          enter
        </motion.button>
      </motion.div>

      {/* Ambient status */}
      <motion.p
        className="absolute bottom-5 text-[10px] font-sans text-muted-foreground/20 tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 3, delay: 1 }}
      >
        things are always disappearing
      </motion.p>
    </motion.div>
  );
}
