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
  saturation: number;
}

export function FogBackground() {
  const [mounted, setMounted] = useState(false);
  const { mode } = useAppMode();
  const isRot = mode === 'rot';
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate fog particles — bioluminescent deep-sea orbs
  const particles = useMemo(() => {
    const count = 8;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 300 + 100,
      opacity: Math.random() * 0.06 + 0.012,
      duration: Math.random() * 30 + 25,
      delay: Math.random() * -20,
      hue: isRot 
        ? (Math.random() > 0.5 ? 320 + Math.random() * 30 : 120 + Math.random() * 20)
        : (Math.random() > 0.6 ? 175 + Math.random() * 15 : 265 + Math.random() * 20),
      saturation: isRot ? 40 + Math.random() * 20 : 50 + Math.random() * 30,
    }));
  }, [isRot]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Mesh gradient base — deep-ocean bioluminescence */}
      <div 
        className="absolute inset-0 mesh-gradient"
        style={{
          background: isRot
            ? `
              radial-gradient(ellipse 60% 50% at 15% 25%, hsl(320 25% 8% / 0.2) 0%, transparent 50%),
              radial-gradient(ellipse 50% 45% at 85% 75%, hsl(355 18% 7% / 0.15) 0%, transparent 40%),
              radial-gradient(ellipse 80% 60% at 50% 100%, hsl(120 15% 4% / 0.2) 0%, transparent 50%)
            `
            : `
              radial-gradient(ellipse 60% 50% at 20% 30%, hsl(175 30% 8% / 0.15) 0%, transparent 50%),
              radial-gradient(ellipse 50% 45% at 80% 70%, hsl(265 20% 8% / 0.12) 0%, transparent 40%),
              radial-gradient(ellipse 80% 60% at 50% 100%, hsl(225 15% 4% / 0.18) 0%, transparent 50%)
            `
        }}
      />

      {/* Aurora wash — slow-moving color field */}
      <div className="absolute inset-0 aurora-bg" />
      
      {/* Animated fog particles — bioluminescent organisms */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-slow-drift"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, hsl(${particle.hue} ${particle.saturation}% 25% / ${particle.opacity}) 0%, transparent 65%)`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            filter: 'blur(60px)',
          }}
        />
      ))}
      
      {/* Soft vignette — ocean depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 70% at center, transparent 35%, hsl(225 18% 3% / 0.3) 100%)'
        }}
      />
    </div>
  );
}
