import { motion } from 'framer-motion';
import { useAppMode } from '@/hooks/useAppMode';
import { cn } from '@/lib/utils';

export function ModeToggle() {
  const { mode, toggleMode } = useAppMode();
  const isRot = mode === 'rot';

  return (
    <motion.button
      onClick={toggleMode}
      className={cn(
        'relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-thought',
        'transition-all duration-500 overflow-hidden',
        isRot
          ? 'bg-destructive/20 text-destructive-foreground border border-destructive/30'
          : 'bg-primary/10 text-primary border border-primary/20'
      )}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${isRot ? 'Prune' : 'Rot'} mode`}
    >
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: isRot
            ? 'linear-gradient(135deg, hsl(var(--destructive) / 0.1), hsl(var(--rot-glitch) / 0.1))'
            : 'linear-gradient(135deg, hsl(var(--primary) / 0.05), hsl(var(--accent) / 0.05))',
        }}
        animate={{
          backgroundPosition: isRot ? ['0% 0%', '100% 100%'] : ['0% 0%', '0% 0%'],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />

      {/* Mode indicator dot */}
      <motion.span
        className={cn(
          'w-2 h-2 rounded-full relative z-10',
          isRot ? 'bg-destructive' : 'bg-primary'
        )}
        animate={{
          scale: isRot ? [1, 1.3, 1] : [1, 1.1, 1],
          opacity: isRot ? [0.8, 1, 0.8] : [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: isRot ? 1.5 : 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <span className={cn('relative z-10', isRot && 'animate-glitch-subtle')}>
        {isRot ? 'embrace rot' : 'prune decay'}
      </span>
    </motion.button>
  );
}
