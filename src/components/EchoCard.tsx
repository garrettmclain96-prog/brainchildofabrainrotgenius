import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Echo, calculateDecayLevel, getDecayState } from '@/types/thought';
import { cn } from '@/lib/utils';

interface EchoCardProps {
  echo: Echo;
}

export function EchoCard({ echo }: EchoCardProps) {
  const decayLevel = useMemo(() => 
    calculateDecayLevel(echo.createdAt, echo.expiresAt),
    [echo.createdAt, echo.expiresAt]
  );
  
  const decayState = getDecayState(decayLevel);

  const decayTextStyles = {
    fresh: 'opacity-90',
    fading: 'opacity-70',
    rotting: 'opacity-50 blur-[0.3px]',
    extinct: 'opacity-25 blur-[0.6px]',
  };

  return (
    <motion.div
      className={cn(
        'group relative inline-block px-4 py-2 rounded-full',
        'bg-echo/10 backdrop-blur-sm',
        'border border-echo/20',
        'text-xs font-thought text-echo-foreground',
        'transition-all duration-500',
        'overflow-hidden',
        decayTextStyles[decayState]
      )}
      initial={{ opacity: 0, scale: 0.8, x: -20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: 20 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ 
        scale: 1.05,
        boxShadow: '0 0 20px hsl(var(--echo) / 0.3)',
      }}
    >
      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 rounded-full"
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(var(--echo) / 0.15), transparent)',
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '200% 0%'],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Pulsing connection indicator */}
      <motion.span 
        className="mr-2 opacity-60 inline-block"
        animate={{
          opacity: [0.4, 0.8, 0.4],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        ↳
      </motion.span>
      
      <span className="relative z-10">{echo.fragmentText}</span>
      
      {/* Decay glow */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow: `inset 0 0 ${10 + decayLevel * 0.2}px hsl(var(--echo) / ${0.1 - decayLevel * 0.001})`,
        }}
      />
    </motion.div>
  );
}
