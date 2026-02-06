import { motion } from 'framer-motion';
import { ThoughtWeather, WeatherMood } from '@/hooks/useThoughtWeather';
import { cn } from '@/lib/utils';

interface ThoughtWeatherIndicatorProps {
  weather: ThoughtWeather;
}

const moodIcons: Record<WeatherMood, string> = {
  turbulent: '🌊',
  quiet: '🌙',
  fragmented: '🔮',
  lucid: '✧',
};

const moodColors: Record<WeatherMood, string> = {
  turbulent: 'destructive',
  quiet: 'primary',
  fragmented: 'echo',
  lucid: 'decay-fresh',
};

export function ThoughtWeatherIndicator({ weather }: ThoughtWeatherIndicatorProps) {
  const color = moodColors[weather.mood];

  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full glass text-[10px] font-thought"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.span
        animate={{
          scale: weather.mood === 'turbulent' ? [1, 1.2, 1] : [1, 1.05, 1],
          rotate: weather.mood === 'fragmented' ? [0, 5, -5, 0] : 0,
        }}
        transition={{ duration: weather.mood === 'turbulent' ? 1.5 : 3, repeat: Infinity }}
      >
        {moodIcons[weather.mood]}
      </motion.span>

      <span className={cn(`text-muted-foreground/40`)}>
        {weather.description}
      </span>

      {/* Intensity dots */}
      <div className="flex gap-0.5 ml-1">
        {[0.25, 0.5, 0.75].map((threshold, i) => (
          <motion.span
            key={i}
            className="w-1 h-1 rounded-full"
            style={{
              background: weather.intensity >= threshold
                ? `hsl(var(--${color}) / ${0.3 + weather.intensity * 0.4})`
                : 'hsl(var(--muted-foreground) / 0.1)',
            }}
            animate={weather.intensity >= threshold ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
