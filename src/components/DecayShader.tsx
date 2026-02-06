import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppMode } from '@/hooks/useAppMode';
import { cn } from '@/lib/utils';

/**
 * DecayShader — Visual decay effects for cards
 * 
 * Applies mold growth, noise clusters, warping, and
 * darkening based on decay level. Pure CSS/SVG based
 * for mobile performance.
 */

interface DecayShaderProps {
  decayLevel: number;
  children: React.ReactNode;
  className?: string;
  isWatered?: boolean;
}

// Generate mold cluster positions based on decay
function generateMoldClusters(decayLevel: number, seed: number) {
  if (decayLevel < 30) return [];
  
  const count = Math.floor((decayLevel - 30) / 15) + 1;
  const clusters: Array<{
    x: number;
    y: number;
    size: number;
    delay: number;
  }> = [];
  
  // Deterministic pseudo-random based on seed
  let hash = seed;
  const nextRandom = () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return (hash % 1000) / 1000;
  };
  
  for (let i = 0; i < Math.min(count, 5); i++) {
    clusters.push({
      x: nextRandom() * 80 + 10,
      y: nextRandom() * 80 + 10,
      size: (nextRandom() * 30 + 20) * (decayLevel / 100),
      delay: nextRandom() * 2,
    });
  }
  
  return clusters;
}

// Generate spore particles
function generateSpores(decayLevel: number, seed: number) {
  if (decayLevel < 50) return [];
  
  const count = Math.floor((decayLevel - 50) / 20) + 1;
  const spores: Array<{
    x: number;
    y: number;
    dx: number;
    dy: number;
    delay: number;
    duration: number;
  }> = [];
  
  let hash = seed + 999;
  const nextRandom = () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return (hash % 1000) / 1000;
  };
  
  for (let i = 0; i < Math.min(count, 6); i++) {
    spores.push({
      x: nextRandom() * 100,
      y: nextRandom() * 100,
      dx: (nextRandom() - 0.5) * 40,
      dy: -(nextRandom() * 30 + 10),
      delay: nextRandom() * 3,
      duration: 4 + nextRandom() * 4,
    });
  }
  
  return spores;
}

export function DecayShader({ decayLevel, children, className, isWatered = false }: DecayShaderProps) {
  const { mode } = useAppMode();
  const isRot = mode === 'rot';
  
  // Use decayLevel as seed for consistent visuals
  const seed = useMemo(() => Math.floor(decayLevel * 137.5), [Math.floor(decayLevel / 5)]);
  const moldClusters = useMemo(() => generateMoldClusters(decayLevel, seed), [decayLevel, seed]);
  const spores = useMemo(() => isRot ? generateSpores(decayLevel, seed) : [], [decayLevel, seed, isRot]);
  
  // Card darkening based on decay
  const darkenAmount = Math.min(decayLevel * 0.4, 30);
  
  // Warp intensity
  const warpClass = decayLevel > 70 
    ? 'card-warp-heavy' 
    : decayLevel > 40 
      ? 'card-warp-light' 
      : '';
  
  return (
    <div 
      className={cn(
        'relative transition-all duration-1000',
        warpClass,
        isWatered && 'animate-reconstitute',
        className
      )}
      style={{
        // Darken card as it decays
        filter: isWatered 
          ? 'none' 
          : `brightness(${1 - darkenAmount / 100}) saturate(${1 - decayLevel * 0.005})`,
      }}
    >
      {children}
      
      {/* Mold clusters overlay */}
      {moldClusters.length > 0 && !isWatered && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          {moldClusters.map((cluster, i) => (
            <motion.div
              key={i}
              className="mold-cluster"
              style={{
                left: `${cluster.x}%`,
                top: `${cluster.y}%`,
                width: cluster.size,
                height: cluster.size,
                animationDelay: `${cluster.delay}s`,
              }}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 3, delay: cluster.delay }}
            />
          ))}
        </div>
      )}
      
      {/* Spore particles (rot mode only) */}
      {spores.length > 0 && !isWatered && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          {spores.map((spore, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                left: `${spore.x}%`,
                top: `${spore.y}%`,
                background: `hsl(var(--rot-mold) / 0.5)`,
                '--dx': `${spore.dx}px`,
                '--dy': `${spore.dy}px`,
              } as React.CSSProperties}
              animate={{
                x: [0, spore.dx],
                y: [0, spore.dy],
                opacity: [0, 0.4, 0],
                scale: [1, 0.3],
              }}
              transition={{
                duration: spore.duration,
                delay: spore.delay,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}
      
      {/* Noise cluster overlay for heavy decay */}
      {decayLevel > 60 && !isWatered && (
        <div 
          className="absolute inset-0 pointer-events-none rounded-xl opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.4' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            mixBlendMode: 'multiply',
            opacity: (decayLevel - 60) / 100 * 0.4,
          }}
        />
      )}
    </div>
  );
}
