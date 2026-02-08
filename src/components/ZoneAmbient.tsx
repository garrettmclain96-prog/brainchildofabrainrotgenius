import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ThoughtZone } from '@/types/thought';

interface ZoneAmbientProps {
  zone: ThoughtZone;
}

/** Zone-specific ambient gradient overlays — each room has a unique bioluminescent atmosphere */
const ZONE_GRADIENTS: Record<ThoughtZone, string> = {
  overflow: 'radial-gradient(ellipse at 50% 80%, hsl(225 18% 12% / 0.3) 0%, transparent 60%)',
  quiet: 'radial-gradient(ellipse at 30% 50%, hsl(215 30% 10% / 0.4) 0%, transparent 50%)',
  noise: 'radial-gradient(ellipse at 60% 40%, hsl(350 25% 12% / 0.35) 0%, transparent 50%), radial-gradient(ellipse at 30% 70%, hsl(320 20% 10% / 0.2) 0%, transparent 40%)',
  unclaimed: 'radial-gradient(ellipse at 50% 60%, hsl(200 25% 10% / 0.35) 0%, transparent 55%)',
  preserved: 'radial-gradient(ellipse at 50% 50%, hsl(42 30% 12% / 0.4) 0%, transparent 50%)',
  backlog: 'radial-gradient(ellipse at 40% 30%, hsl(265 22% 12% / 0.35) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, hsl(280 18% 10% / 0.2) 0%, transparent 40%)',
  'late-night': 'radial-gradient(ellipse at 50% 50%, hsl(240 35% 8% / 0.5) 0%, transparent 55%)',
  'almost-gone': 'radial-gradient(ellipse at 50% 50%, hsl(355 22% 10% / 0.4) 0%, transparent 50%)',
  'quiet-period': 'radial-gradient(ellipse at 50% 50%, hsl(180 18% 9% / 0.35) 0%, transparent 50%)',
  flood: 'radial-gradient(ellipse at 30% 30%, hsl(265 22% 12% / 0.3) 0%, transparent 40%), radial-gradient(ellipse at 70% 70%, hsl(175 18% 10% / 0.25) 0%, transparent 40%)',
  heavy: 'radial-gradient(ellipse at 50% 90%, hsl(20 20% 8% / 0.45) 0%, transparent 50%)',
  discarded: 'radial-gradient(ellipse at 50% 50%, hsl(225 5% 8% / 0.35) 0%, transparent 50%)',
  rare: 'radial-gradient(ellipse at 50% 50%, hsl(270 40% 12% / 0.4) 0%, transparent 45%)',
  static: 'radial-gradient(ellipse at 50% 50%, hsl(225 10% 4% / 0.45) 0%, transparent 40%)',
  leaving: 'linear-gradient(to right, hsl(210 25% 8% / 0.35) 0%, transparent 60%)',
};

export function ZoneAmbient({ zone }: ZoneAmbientProps) {
  const gradient = useMemo(() => ZONE_GRADIENTS[zone], [zone]);

  return (
    <motion.div
      key={zone}
      className="zone-ambient-overlay"
      style={{ background: gradient }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.6 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
    />
  );
}

/** Returns the CSS class for zone-specific card/layout effects */
export function getZoneVisualClass(zone: ThoughtZone): string {
  switch (zone) {
    case 'noise': return 'zone-noise-jitter';
    case 'quiet': return 'zone-quiet-minimal';
    case 'discarded': return 'zone-discarded-ghost';
    case 'flood': return 'zone-flood-dense';
    case 'preserved': return 'zone-preserved-glow';
    case 'almost-gone': return 'zone-almost-gone-urgent';
    case 'quiet-period': return 'zone-quiet-period-frozen';
    case 'heavy': return 'zone-heavy-weighted';
    case 'late-night': return 'zone-late-night-deep';
    case 'backlog': return 'zone-backlog-clutter';
    case 'rare': return 'zone-rare-shimmer';
    case 'static': return 'zone-static-still';
    case 'unclaimed': return 'zone-unclaimed-muted';
    case 'leaving': return 'zone-leaving-exit';
    default: return '';
  }
}
