import { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface LiquidCursorProps {
  color?: string;
  size?: number;
}

export function LiquidCursor({ color = 'primary', size = 40 }: LiquidCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 200 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      
      // Check if hovering over interactive element
      const target = e.target as HTMLElement;
      const isInteractive = target.closest('button, a, input, textarea, [role="button"]');
      setIsHovering(!!isInteractive);
    };
    
    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mouseX, mouseY]);
  
  return (
    <>
      {/* Main cursor */}
      <motion.div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: cursorX,
          y: cursorY,
        }}
      >
        <motion.div
          className="rounded-full"
          style={{
            width: size,
            height: size,
            marginLeft: -size / 2,
            marginTop: -size / 2,
            background: `radial-gradient(circle, hsl(var(--${color})) 0%, hsl(var(--${color}) / 0.5) 50%, transparent 70%)`,
          }}
          animate={{
            scale: isClicking ? 0.8 : isHovering ? 1.5 : 1,
            opacity: isHovering ? 0.8 : 0.6,
          }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>
      
      {/* Trailing orbs */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="fixed top-0 left-0 pointer-events-none z-[9998] rounded-full"
          style={{
            x: cursorX,
            y: cursorY,
            width: size * (0.6 - i * 0.15),
            height: size * (0.6 - i * 0.15),
            marginLeft: -(size * (0.6 - i * 0.15)) / 2,
            marginTop: -(size * (0.6 - i * 0.15)) / 2,
            background: `hsl(var(--${color}) / ${0.3 - i * 0.08})`,
            filter: 'blur(2px)',
          }}
          transition={{ 
            type: 'spring',
            damping: 20 - i * 3,
            stiffness: 150 - i * 30,
          }}
        />
      ))}
    </>
  );
}

// Magnetic cursor that pulls toward elements
export function useMagneticCursor(strength: number = 0.4) {
  const elementRef = useRef<HTMLDivElement>(null);
  const posX = useMotionValue(0);
  const posY = useMotionValue(0);
  
  const springX = useSpring(posX, { damping: 15, stiffness: 150 });
  const springY = useSpring(posY, { damping: 15, stiffness: 150 });
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      
      posX.set(distX * strength);
      posY.set(distY * strength);
    };
    
    const handleMouseLeave = () => {
      posX.set(0);
      posY.set(0);
    };
    
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength, posX, posY]);
  
  return { elementRef, springX, springY };
}
