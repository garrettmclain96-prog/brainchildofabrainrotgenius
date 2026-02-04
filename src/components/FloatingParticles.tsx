import { useMemo } from 'react';

interface Particle {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  symbol: string;
}

const SYMBOLS = ['◦', '·', '○', '◌', '◎', '∘', '⊙', '⊚'];

export function FloatingParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i): Particle => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 12 + 8,
      duration: Math.random() * 15 + 20,
      delay: Math.random() * -30,
      opacity: Math.random() * 0.3 + 0.1,
      symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-float-up text-muted-foreground/20"
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
