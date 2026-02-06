import { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  delay: number;
  char: string;
}

interface ParticleFieldProps {
  density?: 'low' | 'medium' | 'high';
  color?: 'primary' | 'echo' | 'muted';
}

export function ParticleField({ density = 'medium', color = 'primary' }: ParticleFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const particleCount = density === 'low' ? 20 : density === 'medium' ? 40 : 60;
  const chars = ['◦', '◌', '◎', '○', '●', '◐', '◑', '◒', '◓', '∙', '·', '⋅'];
  
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 12 + 8,
      opacity: Math.random() * 0.4 + 0.1,
      speed: Math.random() * 30 + 20,
      delay: Math.random() * -30,
      char: chars[Math.floor(Math.random() * chars.length)],
    }));
  }, [particleCount]);
  
  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
    >
      {particles.map(particle => (
        <motion.span
          key={particle.id}
          className="absolute select-none"
          style={{
            left: `${particle.x}%`,
            fontSize: particle.size,
            color: `hsl(var(--${color}) / ${particle.opacity})`,
            textShadow: `0 0 ${particle.size}px hsl(var(--${color}) / ${particle.opacity * 0.5})`,
          }}
          initial={{ y: '100vh', opacity: 0 }}
          animate={{ 
            y: '-10vh',
            opacity: [0, particle.opacity, particle.opacity, 0],
          }}
          transition={{
            duration: particle.speed,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {particle.char}
        </motion.span>
      ))}
    </div>
  );
}

// Burst particles for interactions
interface BurstParticle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  delay: number;
}

interface ParticleBurstProps {
  x: number;
  y: number;
  count?: number;
  onComplete?: () => void;
}

export function ParticleBurst({ x, y, count = 20, onComplete }: ParticleBurstProps) {
  const particles = useMemo<BurstParticle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5,
      distance: Math.random() * 100 + 50,
      size: Math.random() * 6 + 2,
      delay: Math.random() * 0.1,
    }));
  }, [count]);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      onComplete?.();
    }, 1000);
    return () => clearTimeout(timeout);
  }, [onComplete]);
  
  return (
    <div 
      className="fixed pointer-events-none z-50"
      style={{ left: x, top: y }}
    >
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
            boxShadow: `0 0 ${particle.size * 2}px hsl(var(--primary) / 0.5)`,
          }}
          initial={{ 
            x: 0, 
            y: 0, 
            scale: 1,
            opacity: 1,
          }}
          animate={{ 
            x: Math.cos(particle.angle) * particle.distance,
            y: Math.sin(particle.angle) * particle.distance,
            scale: 0,
            opacity: 0,
          }}
          transition={{
            duration: 0.8,
            delay: particle.delay,
            ease: [0.23, 1, 0.32, 1],
          }}
        />
      ))}
    </div>
  );
}
