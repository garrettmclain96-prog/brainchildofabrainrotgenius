import { motion, AnimatePresence } from 'framer-motion';
import { AppMoodState } from '@/hooks/useAppMoods';

interface AppMoodIndicatorProps {
  moodState: AppMoodState;
}

const MOOD_ICONS: Record<string, string> = {
  lucid: '◈',
  fragmented: '◇',
  withholding: '◆',
  attentive: '◉',
  silent: '○',
};

export function AppMoodIndicator({ moodState }: AppMoodIndicatorProps) {
  return (
    <motion.div
      className="flex items-center gap-1.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    >
      <motion.span
        className="text-[10px] text-muted-foreground/20"
        animate={{
          opacity: moodState.mood === 'silent' ? [0.1, 0.2, 0.1] : [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        {MOOD_ICONS[moodState.mood]}
      </motion.span>
      
      <AnimatePresence mode="wait">
        <motion.span
          key={moodState.mood}
          className="text-[9px] text-muted-foreground/15 font-thought tracking-wider"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 1 }}
        >
          {moodState.mood}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}
