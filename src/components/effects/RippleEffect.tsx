import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

interface RippleContainerProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export function RippleContainer({ children, className = '', color = 'primary' }: RippleContainerProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  
  const addRipple = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple: Ripple = {
      id: Date.now(),
      x,
      y,
    };
    
    setRipples(prev => [...prev, newRipple]);
  }, []);
  
  const removeRipple = useCallback((id: number) => {
    setRipples(prev => prev.filter(r => r.id !== id));
  }, []);
  
  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      onClick={addRipple}
    >
      {children}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              backgroundColor: `hsl(var(--${color}) / 0.3)`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ width: 0, height: 0, opacity: 0.8 }}
            animate={{ width: 400, height: 400, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            onAnimationComplete={() => removeRipple(ripple.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Global mouse ripple effect
export function MouseRippleOverlay() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleMouseMove = (e: MouseEvent) => {
      // Throttle ripple creation
      if (timeout) return;
      
      timeout = setTimeout(() => {
        timeout = undefined as any;
      }, 100);
      
      // Only create ripple occasionally for subtle effect
      if (Math.random() > 0.95) {
        const newRipple: Ripple = {
          id: Date.now() + Math.random(),
          x: e.clientX,
          y: e.clientY,
        };
        
        setRipples(prev => [...prev.slice(-5), newRipple]);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  const removeRipple = useCallback((id: number) => {
    setRipples(prev => prev.filter(r => r.id !== id));
  }, []);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full"
            style={{
              left: ripple.x,
              top: ripple.y,
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)',
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ width: 0, height: 0, opacity: 0.6 }}
            animate={{ width: 200, height: 200, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            onAnimationComplete={() => removeRipple(ripple.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
