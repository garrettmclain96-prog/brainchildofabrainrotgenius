import { motion } from 'framer-motion';
import { ThoughtWeather, WeatherMood } from '@/hooks/useThoughtWeather';

interface ThoughtWeatherIndicatorProps {
  weather: ThoughtWeather;
}

const moodIcons: Record<WeatherMood, string> = {
  turbulent: '🌊',
  quiet: '🌙',
  fragmented: '🔮',
  lucid: '✧',
};

export function ThoughtWeatherIndicator({ weather }: ThoughtWeatherIndicatorProps) {
  return (
    <motion.span
      className="text-xs text-muted-foreground/25"
      animate={{
        scale: weather.mood === 'turbulent' ? [1, 1.2, 1] : [1, 1.05, 1],
      }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      {moodIcons[weather.mood]}
    </motion.span>
  );
}
