import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PremiumDecayMode } from '@/types/thought';

interface PremiumDecayEffectsProps {
  mode: PremiumDecayMode;
  decayLevel: number;
  seed: string;
  children?: React.ReactNode;
}

/** Deterministic pseudo-random from seed string */
function seededRandom(seed: string, index: number): number {
  let hash = 0;
  const str = seed + index;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
}

function GlitchEffect({ decayLevel, seed }: { decayLevel: number; seed: string }) {
  const intensity = decayLevel / 100;
  const jitterPx = intensity * 4;
  const scanOpacity = intensity * 0.6;
  const rgbOffset = intensity * 3;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      {/* Scan lines */}
      <div
        className="absolute inset-0 premium-glitch-scan"
        style={{
          opacity: scanOpacity,
          background: `repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 2px,
            hsl(var(--foreground) / 0.08) 2px,
            hsl(var(--foreground) / 0.08) 4px
          )`,
        }}
      />

      {/* RGB channel splits */}
      {intensity > 0.2 && (
        <>
          <motion.div
            className="absolute inset-0 mix-blend-screen"
            style={{
              background: `hsl(var(--rot-glitch) / ${intensity * 0.08})`,
              transform: `translateX(${rgbOffset}px)`,
            }}
            animate={{
              translateX: [rgbOffset, -rgbOffset * 0.5, rgbOffset],
            }}
            transition={{
              duration: 3 + seededRandom(seed, 0) * 2,
              repeat: Infinity,
              ease: 'linear',
              times: [0, 0.5, 1],
            }}
          />
          <motion.div
            className="absolute inset-0 mix-blend-screen"
            style={{
              background: `hsl(var(--echo) / ${intensity * 0.06})`,
              transform: `translateX(${-rgbOffset}px)`,
            }}
            animate={{
              translateX: [-rgbOffset, rgbOffset * 0.7, -rgbOffset],
            }}
            transition={{
              duration: 4 + seededRandom(seed, 1) * 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </>
      )}

      {/* Jitter blocks */}
      {intensity > 0.4 && (
        <motion.div
          className="absolute inset-0"
          animate={{
            x: [0, jitterPx, -jitterPx * 0.5, 0],
            y: [0, -jitterPx * 0.3, jitterPx * 0.2, 0],
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
            repeatDelay: 2 + seededRandom(seed, 2) * 4,
            ease: 'easeInOut',
          }}
          style={{
            clipPath: `inset(${30 + seededRandom(seed, 3) * 40}% 0 ${20 + seededRandom(seed, 4) * 30}% 0)`,
            background: `hsl(var(--foreground) / ${intensity * 0.04})`,
          }}
        />
      )}
    </div>
  );
}

function CrystallizeEffect({ decayLevel, seed }: { decayLevel: number; seed: string }) {
  const intensity = decayLevel / 100;
  const facetCount = Math.floor(2 + intensity * 6);

  const polygons = useMemo(() => {
    return Array.from({ length: facetCount }, (_, i) => {
      const cx = seededRandom(seed, i * 5) * 100;
      const cy = seededRandom(seed, i * 5 + 1) * 100;
      const size = 15 + seededRandom(seed, i * 5 + 2) * 30;
      const sides = 3 + Math.floor(seededRandom(seed, i * 5 + 3) * 4);
      const rotation = seededRandom(seed, i * 5 + 4) * 360;
      const hue = (seededRandom(seed, i * 7) * 360);

      const points = Array.from({ length: sides }, (_, j) => {
        const angle = (j / sides) * Math.PI * 2 + (rotation * Math.PI / 180);
        const r = size * (0.7 + seededRandom(seed, i * 10 + j) * 0.3);
        return `${cx + Math.cos(angle) * r}% ${cy + Math.sin(angle) * r}%`;
      }).join(', ');

      return { points, hue, cx, cy, delay: seededRandom(seed, i * 3) * 2 };
    });
  }, [facetCount, seed]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          {polygons.map((p, i) => (
            <linearGradient key={`g${i}`} id={`crystal-${seed}-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={`hsl(${p.hue}, 70%, 65%)`} stopOpacity={intensity * 0.15} />
              <stop offset="100%" stopColor={`hsl(${(p.hue + 60) % 360}, 60%, 55%)`} stopOpacity={intensity * 0.08} />
            </linearGradient>
          ))}
        </defs>
        {polygons.map((p, i) => (
          <motion.polygon
            key={i}
            points={p.points}
            fill={`url(#crystal-${seed}-${i})`}
            stroke={`hsl(${p.hue}, 50%, 70%)`}
            strokeWidth={0.15}
            strokeOpacity={intensity * 0.3}
            animate={{ opacity: [intensity * 0.3, intensity * 0.6, intensity * 0.3] }}
            transition={{
              duration: 3 + p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </svg>

      {/* Prismatic shimmer overlay */}
      <motion.div
        className="absolute inset-0 premium-crystallize-shimmer"
        style={{
          background: `linear-gradient(135deg, 
            hsl(280 60% 70% / ${intensity * 0.05}) 0%, 
            hsl(200 60% 70% / ${intensity * 0.03}) 50%, 
            hsl(330 60% 70% / ${intensity * 0.05}) 100%)`,
        }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function EchoEffect({ decayLevel, seed, children }: { decayLevel: number; seed: string; children?: React.ReactNode }) {
  const intensity = decayLevel / 100;
  const layerCount = Math.min(Math.floor(1 + intensity * 3), 4);
  const opacities = [0.3, 0.2, 0.1, 0.05];
  const offsets = [6, 12, 20, 30].map(v => v * intensity);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      {Array.from({ length: layerCount }, (_, i) => {
        const xDir = seededRandom(seed, i) > 0.5 ? 1 : -1;
        const yDir = seededRandom(seed, i + 10) > 0.5 ? 1 : -1;
        const offsetX = offsets[i] * xDir;
        const offsetY = offsets[i] * 0.4 * yDir;

        return (
          <motion.div
            key={i}
            className="absolute inset-0"
            style={{
              opacity: opacities[i] * intensity * 2,
              filter: `blur(${(i + 1) * 0.8}px) saturate(${1 - i * 0.15})`,
            }}
            animate={{
              x: [offsetX, offsetX * 1.3, offsetX * 0.7, offsetX],
              y: [offsetY, offsetY * 0.6, offsetY * 1.4, offsetY],
            }}
            transition={{
              duration: 8 + seededRandom(seed, i + 5) * 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {children}
          </motion.div>
        );
      })}
    </div>
  );
}

export function PremiumDecayEffects({ mode, decayLevel, seed, children }: PremiumDecayEffectsProps) {
  if (decayLevel < 2) return null;

  switch (mode) {
    case 'glitch':
      return <GlitchEffect decayLevel={decayLevel} seed={seed} />;
    case 'crystallize':
      return <CrystallizeEffect decayLevel={decayLevel} seed={seed} />;
    case 'echo':
      return <EchoEffect decayLevel={decayLevel} seed={seed}>{children}</EchoEffect>;
    default:
      return null;
  }
}
