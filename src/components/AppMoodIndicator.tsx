import { motion } from 'framer-motion';
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
    <motion.span
      className="text-[10px] text-muted-foreground/30"
      animate={{
        opacity: moodState.mood === 'silent' ? [0.1, 0.2, 0.1] : [0.2, 0.4, 0.2],
      }}
      transition={{ duration: 4, repeat: Infinity }}
    >
      {MOOD_ICONS[moodState.mood]}
    </motion.span>
  );
}
