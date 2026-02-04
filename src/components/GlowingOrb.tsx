import { cn } from '@/lib/utils';

interface GlowingOrbProps {
  className?: string;
  color?: 'primary' | 'accent' | 'echo';
  size?: 'sm' | 'md' | 'lg';
  intensity?: 'low' | 'medium' | 'high';
}

export function GlowingOrb({ 
  className, 
  color = 'primary',
  size = 'md',
  intensity = 'medium' 
}: GlowingOrbProps) {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-48 h-48',
    lg: 'w-72 h-72',
  };

  const intensityValues = {
    low: 0.15,
    medium: 0.3,
    high: 0.5,
  };

  const colorClasses = {
    primary: 'from-primary/20 via-primary/10',
    accent: 'from-accent/25 via-accent/15',
    echo: 'from-echo/20 via-echo/10',
  };

  return (
    <div 
      className={cn(
        'absolute rounded-full blur-3xl animate-orb-pulse pointer-events-none',
        'bg-gradient-radial to-transparent',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      style={{
        opacity: intensityValues[intensity],
      }}
    />
  );
}
