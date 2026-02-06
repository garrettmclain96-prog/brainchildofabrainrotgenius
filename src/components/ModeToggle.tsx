import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppMode } from '@/hooks/useAppMode';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';

export function ModeToggle() {
  const { mode, toggleMode } = useAppMode();
  const { modeSwitchPattern } = useHaptics();
  const isRot = mode === 'rot';
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleToggle = useCallback(() => {
    setIsTransitioning(true);
    modeSwitchPattern();
    
    // Apply ritual animation to the whole page
    document.documentElement.classList.add('animate-mode-ritual');
    
    // Delay the actual mode switch to the middle of the ritual
    setTimeout(() => {
      toggleMode();
    }, 400);
    
    setTimeout(() => {
      document.documentElement.classList.remove('animate-mode-ritual');
      setIsTransitioning(false);
    }, 1500);
  }, [toggleMode, modeSwitchPattern]);

  return (
    <motion.button
      onClick={handleToggle}
      disabled={isTransitioning}
      className={cn(
        'relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-thought',
        'transition-all duration-700 overflow-hidden',
        isRot
          ? 'bg-destructive/15 text-destructive-foreground border border-destructive/20'
          : 'bg-primary/8 text-primary border border-primary/15',
        isTransitioning && 'opacity-50 pointer-events-none'
      )}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${isRot ? 'Prune' : 'Rot'} mode`}
    >
      {/* Animated background — slow organic shift */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: isRot
            ? 'linear-gradient(135deg, hsl(var(--destructive) / 0.08), hsl(var(--rot-glitch) / 0.08))'
            : 'linear-gradient(135deg, hsl(var(--primary) / 0.04), hsl(var(--accent) / 0.04))',
        }}
        animate={{
          rotate: isRot ? [0, 360] : [0, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />

      {/* Mode indicator — breathing organism */}
      <motion.span
        className={cn(
          'w-2 h-2 rounded-full relative z-10',
          isRot ? 'bg-destructive' : 'bg-primary'
        )}
        animate={{
          scale: isRot ? [1, 1.4, 1] : [1, 1.15, 1],
          opacity: isRot ? [0.6, 1, 0.6] : [0.5, 0.75, 0.5],
        }}
        transition={{
          duration: isRot ? 1.8 : 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <AnimatePresence mode="wait">
        <motion.span 
          key={mode}
          className={cn('relative z-10 tracking-wider', isRot && 'animate-glitch-subtle')}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.3 }}
        >
          {isRot ? 'rot' : 'prune'}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
