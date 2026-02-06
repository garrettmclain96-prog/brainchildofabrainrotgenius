import { useEffect, useState, useMemo } from 'react';
import { useAppMode } from '@/hooks/useAppMode';

interface FogParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  hue: number;
}

export function FogBackground() {
  const [mounted, setMounted] = useState(false);
  const { mode } = useAppMode();
  const isRot = mode === 'rot';
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate fog particles — reduced count for mobile performance
  const particles = useMemo(() => {
    const count = 6;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 250 + 80,
      opacity: Math.random() * 0.06 + 0.015,
      duration: Math.random() * 25 + 30,
      delay: Math.random() * -25,
      // Fungal greens/purples for rot, cool grays for prune
      hue: isRot 
        ? (Math.random() > 0.5 ? 280 + Math.random() * 40 : 90 + Math.random() * 30)
        : 155 + Math.random() * 20,
    }));
  }, [isRot]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Static gradient base — decomposing library */}
      <div 
        className="absolute inset-0"
        style={{
          background: isRot
            ? `
              radial-gradient(ellipse 70% 50% at 15% 25%, hsl(280 15% 10% / 0.15) 0%, transparent 50%),
              radial-gradient(ellipse 50% 40% at 85% 75%, hsl(340 12% 8% / 0.12) 0%, transparent 40%),
              radial-gradient(ellipse 90% 60% at 50% 100%, hsl(90 15% 5% / 0.18) 0%, transparent 50%)
            `
            : `
              radial-gradient(ellipse 70% 50% at 20% 30%, hsl(155 10% 12% / 0.1) 0%, transparent 50%),
              radial-gradient(ellipse 50% 40% at 80% 70%, hsl(45 8% 10% / 0.08) 0%, transparent 40%),
              radial-gradient(ellipse 90% 60% at 50% 100%, hsl(240 10% 4% / 0.15) 0%, transparent 50%)
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
            background: `radial-gradient(circle, hsl(${particle.hue} 12% 18% / ${particle.opacity}) 0%, transparent 70%)`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            filter: 'blur(50px)',
          }}
        />
      ))}
      
      {/* Deep vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 65% 65% at center, transparent 30%, hsl(240 8% 3% / 0.5) 100%)'
        }}
      />
    </div>
  );
}
