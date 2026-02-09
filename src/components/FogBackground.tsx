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
  lightness: number;
}

export function FogBackground() {
  const [mounted, setMounted] = useState(false);
  const { mode } = useAppMode();
  const isRot = mode === 'rot';
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate psychedelic luminous orbs — bright pastel washes
  const particles = useMemo(() => {
    const count = 10;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 350 + 120,
      opacity: Math.random() * 0.12 + 0.04,
      duration: Math.random() * 35 + 30,
      delay: Math.random() * -25,
      hue: isRot 
        ? (Math.random() > 0.5 ? 330 + Math.random() * 20 : 140 + Math.random() * 20)
        : [280, 330, 180, 220, 45][Math.floor(Math.random() * 5)] + Math.random() * 30,
      saturation: isRot ? 40 + Math.random() * 20 : 30 + Math.random() * 35,
      lightness: 75 + Math.random() * 15,
    }));
  }, [isRot]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Mesh gradient base — psychedelic pastel wash */}
      <div 
        className="absolute inset-0"
        style={{
          background: isRot
            ? `
              radial-gradient(ellipse 65% 55% at 15% 25%, hsl(330 30% 85% / 0.25) 0%, transparent 50%),
              radial-gradient(ellipse 55% 50% at 85% 75%, hsl(0 25% 82% / 0.2) 0%, transparent 40%),
              radial-gradient(ellipse 85% 65% at 50% 100%, hsl(140 20% 80% / 0.2) 0%, transparent 50%)
            `
            : `
              radial-gradient(ellipse 65% 55% at 20% 30%, hsl(280 35% 88% / 0.2) 0%, transparent 50%),
              radial-gradient(ellipse 55% 50% at 80% 70%, hsl(330 25% 85% / 0.15) 0%, transparent 40%),
              radial-gradient(ellipse 85% 65% at 50% 100%, hsl(180 30% 82% / 0.18) 0%, transparent 50%)
            `
        }}
      />

      {/* Aurora wash — slow-moving color field */}
      <div className="absolute inset-0 aurora-bg" />
      
      {/* Ethereal light rays — soft psychedelic sweep */}
      <div 
        className="absolute inset-0 animate-light-ray"
        style={{
          background: 'linear-gradient(105deg, transparent 30%, hsl(280 60% 75% / 0.06) 50%, transparent 70%)',
          width: '200%',
        }}
      />
      
      {/* Animated fog particles — bright pastel mist orbs */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-slow-drift"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, hsl(${particle.hue} ${particle.saturation}% ${particle.lightness}% / ${particle.opacity}) 0%, transparent 65%)`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            filter: 'blur(50px)',
          }}
        />
      ))}
      
      {/* Soft vignette — gentle edges */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 75% 75% at center, transparent 40%, hsl(270 20% 88% / 0.15) 100%)'
        }}
      />
      
      {/* Rising mist at bottom — soft pastel lift */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1/3 animate-mist-rise"
        style={{
          background: 'linear-gradient(to top, hsl(260 25% 90% / 0.12), transparent)'
        }}
      />
    </div>
  );
}
