import { useMemo } from 'react';
import { useAppMode } from '@/hooks/useAppMode';

interface Particle {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  symbol: string;
}

const PRUNE_SYMBOLS = ['◦', '·', '○', '◌', '∘', '⊙'];
const ROT_SYMBOLS = ['◌', '⊚', '◎', '⟐', '⟡', '⊛', '✧', '⊙'];

export function FloatingParticles() {
  const { mode } = useAppMode();
  const isRot = mode === 'rot';
  const symbols = isRot ? ROT_SYMBOLS : PRUNE_SYMBOLS;

  const particles = useMemo(() => {
    return Array.from({ length: 15 }, (_, i): Particle => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 10 + 6,
      duration: Math.random() * 18 + 22,
      delay: Math.random() * -30,
      opacity: Math.random() * 0.2 + 0.05,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
    }));
  }, [isRot]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-float-up text-muted-foreground/15"
          style={{
            left: `${p.x}%`,
            bottom: '-20px',
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.symbol}
        </div>
      ))}
    </div>
  );
}
