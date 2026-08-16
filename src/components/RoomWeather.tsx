import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Thought, ThoughtZone } from '@/types/thought';

interface RoomWeatherProps {
  zone: ThoughtZone;
  thoughts: Thought[];
}

type Weather = 'still' | 'drifting' | 'thickening' | 'clearing' | 'heavy';

const WEATHER_COPY: Record<Weather, string> = {
  still: 'the air here is not moving',
  drifting: 'things are drifting through',
  thickening: 'the fog is thickening',
  clearing: 'it is clearing out',
  heavy: 'everything here is sinking',
};

/**
 * Room Weather — an atmospheric read of a room's decay density.
 * Deliberately expressed as weather, never as counts or activity metrics.
 */
export function RoomWeather({ zone, thoughts }: RoomWeatherProps) {
  const weather: Weather = useMemo(() => {
    if (thoughts.length === 0) return 'still';
    const avgDecay =
      thoughts.reduce((sum, t) => sum + t.decayLevel, 0) / thoughts.length;
    const density = thoughts.length;

    if (avgDecay > 70) return 'clearing';
    if (density >= 10) return 'thickening';
    if (avgDecay > 45) return 'heavy';
    if (density <= 2) return 'still';
    return 'drifting';
  }, [thoughts]);

  return (
    <motion.p
      key={`${zone}-${weather}`}
      className="text-[10px] font-sans tracking-[0.16em] text-muted-foreground/35 lowercase"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.1, ease: [0.23, 1, 0.32, 1] }}
    >
      {WEATHER_COPY[weather]}
    </motion.p>
  );
}
