import { useEffect, useState, useMemo } from 'react';

interface FogParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

export function FogBackground() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate fog particles
  const particles = useMemo(() => {
    const count = 12;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 300 + 100,
      opacity: Math.random() * 0.08 + 0.02,
      duration: Math.random() * 20 + 25,
      delay: Math.random() * -20,
    }));
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Static gradient base */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 30%, hsl(210 10% 20% / 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 70%, hsl(215 10% 18% / 0.12) 0%, transparent 40%),
            radial-gradient(ellipse 100% 60% at 50% 100%, hsl(220 15% 8% / 0.2) 0%, transparent 50%)
          `
        }}
      />
      
      {/* Animated fog particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-slow-drift"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, hsl(210 10% 25% / ${particle.opacity}) 0%, transparent 70%)`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            filter: 'blur(40px)',
          }}
        />
      ))}
      
      {/* Subtle vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, hsl(220 15% 4% / 0.4) 100%)'
        }}
      />
    </div>
  );
}
