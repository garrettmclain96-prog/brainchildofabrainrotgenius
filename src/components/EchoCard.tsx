import { useMemo } from 'react';
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
    <div
      className={cn(
        'inline-block px-3 py-1.5 rounded-full',
        'bg-echo/10 backdrop-blur-sm',
        'border border-echo/20',
        'text-xs font-thought text-echo-foreground',
        'transition-all duration-2000',
        decayTextStyles[decayState]
      )}
    >
      <span className="mr-1.5 opacity-50">↳</span>
      {echo.fragmentText}
    </div>
  );
}
