import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppMode } from '@/hooks/useAppMode';

interface HomeScreenProps {
  onEnter: () => void;
  isFirstVisit: boolean;
}

const FIRST_VISIT_LINES = [
  "You're not early. You're not late.",
  "Things have been decaying here for a while.",
  "Some thoughts survived. Most didn't.",
];

const RETURNING_LINES = [
  "Things kept disappearing while you were gone.",
  "The rot continued without you.",
  "Some fragments held on. Barely.",
  "Nothing waited for you. That's the point.",
  "The decay doesn't pause.",
];

const ERA_HINTS = [
  'from the quiet period',
  'recovered fragment',
  'unclaimed rot',
  'survived 17 days',
  'origin unknown',
];

const smoothEase: [number, number, number, number] = [0.23, 1, 0.32, 1];

export function HomeScreen({ onEnter, isFirstVisit }: HomeScreenProps) {
  const [phase, setPhase] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const { mode } = useAppMode();
  const isRot = mode === 'rot';

  const lines = isFirstVisit ? FIRST_VISIT_LINES : RETURNING_LINES;
  const selectedLines = useMemo(() => {
    if (isFirstVisit) return FIRST_VISIT_LINES;
    // Pick 2 random returning lines
    const shuffled = [...RETURNING_LINES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
  }, [isFirstVisit]);

  // Auto-advance through lines
  useEffect(() => {
    if (phase >= selectedLines.length) return;
    const timer = setTimeout(() => {
      setPhase((p) => p + 1);
    }, phase === 0 ? 2800 : 2200);
    return () => clearTimeout(timer);
  }, [phase, selectedLines.length]);

  const handleEnter = () => {
    setIsExiting(true);
    setTimeout(onEnter, 800);
  };

  // Pick a random era hint
  const eraHint = useMemo(() => ERA_HINTS[Math.floor(Math.random() * ERA_HINTS.length)], []);

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
        if (phase >= selectedLines.length) handleEnter();
        else setPhase(selectedLines.length);
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

      {/* Lines container */}
      <div className="relative h-32 flex flex-col items-center justify-center gap-4 px-8">
        <AnimatePresence mode="wait">
          {selectedLines.map((line, i) => (
            i <= phase - 1 && (
              <motion.p
                key={line}
                className="text-center font-thought text-muted-foreground/50 text-sm tracking-wide leading-relaxed"
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ 
                  opacity: i === phase - 1 ? 0.7 : 0.3,
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

      {/* Era hint — tiny lore crumb */}
      <motion.span
        className="absolute bottom-24 text-[9px] font-thought text-muted-foreground/15 tracking-[0.2em] italic"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= selectedLines.length ? 1 : 0 }}
        transition={{ duration: 1.5, delay: 0.5 }}
      >
        {eraHint}
      </motion.span>

      {/* Enter prompt */}
      <motion.div
        className="absolute bottom-12 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= selectedLines.length ? 1 : 0 }}
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
