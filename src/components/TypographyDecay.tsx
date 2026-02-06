import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppMode } from '@/hooks/useAppMode';
import { cn } from '@/lib/utils';

/**
 * TypographyDecay — Living text that decays
 * 
 * Implements: letter drift, kerning distortion,
 * glyph mutation, and character substitutions.
 * Text should feel alive but legible.
 */

interface TypographyDecayProps {
  text: string;
  decayLevel: number;
  className?: string;
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3';
}

// Unicode substitution maps for glyph mutation
const MUTATIONS: Record<string, string[]> = {
  'a': ['α', 'ā', 'à', 'â'],
  'e': ['ε', 'ē', 'è', 'ê'],
  'i': ['ι', 'ī', 'ì', 'î'],
  'o': ['ο', 'ō', 'ò', 'ô'],
  'u': ['υ', 'ū', 'ù', 'û'],
  's': ['ş', 'ś', 'ŝ'],
  't': ['ţ', 'ť'],
  'n': ['ñ', 'ń'],
  'c': ['ç', 'ć'],
  'r': ['ŗ', 'ŕ'],
};

function mutateCharacter(char: string, intensity: number, seed: number): string {
  if (intensity < 30) return char;
  
  const lower = char.toLowerCase();
  const mutations = MUTATIONS[lower];
  if (!mutations) return char;
  
  // Probability increases with decay
  const probability = (intensity - 30) / 200;
  const hash = (seed * 2654435761) >>> 0;
  if ((hash % 1000) / 1000 > probability) return char;
  
  const mutated = mutations[(hash % mutations.length)];
  return char === lower ? mutated : mutated.toUpperCase();
}

export function TypographyDecay({ 
  text, 
  decayLevel, 
  className,
  as: Component = 'p' 
}: TypographyDecayProps) {
  const { mode } = useAppMode();
  const isRot = mode === 'rot';
  
  // Apply mutations only in rot mode or at high decay
  const processedChars = useMemo(() => {
    if (!isRot && decayLevel < 60) {
      return text.split('').map((char, i) => ({ char, index: i }));
    }
    
    return text.split('').map((char, i) => ({
      char: mutateCharacter(char, decayLevel, i * 31 + text.length),
      index: i,
    }));
  }, [text, decayLevel, isRot]);
  
  // Calculate per-character drift
  const shouldAnimate = (isRot && decayLevel > 20) || decayLevel > 50;
  
  // Kerning distortion amount
  const kerningBase = decayLevel > 40 ? (decayLevel - 40) * 0.001 : 0;
  
  if (!shouldAnimate) {
    return (
      <Component className={cn(className)}>
        {text}
      </Component>
    );
  }
  
  return (
    <Component className={cn('relative', className)}>
      {processedChars.map(({ char, index }) => {
        if (char === ' ') return <span key={index}>&nbsp;</span>;
        
        // Pseudo-random drift per character
        const hash = ((index * 2654435761) >>> 0) % 1000;
        const driftX = (hash % 5 - 2) * (decayLevel / 200);
        const driftY = ((hash * 3) % 5 - 2) * (decayLevel / 250);
        const kernShift = ((hash * 7) % 3 - 1) * kerningBase;
        
        return (
          <motion.span
            key={index}
            className="inline-block"
            style={{
              letterSpacing: `${kernShift}em`,
            }}
            animate={shouldAnimate ? {
              x: [0, driftX, -driftX * 0.5, 0],
              y: [0, driftY, -driftY * 0.3, 0],
            } : undefined}
            transition={{
              duration: 6 + (hash % 4),
              repeat: Infinity,
              ease: 'easeInOut',
              delay: (hash % 20) * 0.1,
            }}
          >
            {char}
          </motion.span>
        );
      })}
    </Component>
  );
}
