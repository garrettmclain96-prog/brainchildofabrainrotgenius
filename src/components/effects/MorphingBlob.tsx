import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface MorphingBlobProps {
  className?: string;
  color?: string;
  size?: number;
  speed?: number;
}

export function MorphingBlob({ 
  className = '', 
  color = 'primary',
  size = 400,
  speed = 8
}: MorphingBlobProps) {
  const [path, setPath] = useState(generateBlobPath());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPath(generateBlobPath());
    }, speed * 1000);
    
    return () => clearInterval(interval);
  }, [speed]);
  
  return (
    <motion.div 
      className={`absolute pointer-events-none ${className}`}
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 2, ease: 'easeOut' }}
    >
      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full"
        style={{ filter: 'blur(40px)' }}
      >
        <defs>
          <linearGradient id={`blob-gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`hsl(var(--${color}))`} stopOpacity="0.3" />
            <stop offset="50%" stopColor={`hsl(var(--${color}))`} stopOpacity="0.15" />
            <stop offset="100%" stopColor={`hsl(var(--accent))`} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <motion.path
          d={path}
          fill={`url(#blob-gradient-${color})`}
          initial={{ d: path }}
          animate={{ d: path }}
          transition={{ duration: speed, ease: 'easeInOut' }}
        />
      </svg>
    </motion.div>
  );
}

function generateBlobPath(): string {
  const points = 8;
  const angleStep = (Math.PI * 2) / points;
  const center = 100;
  const baseRadius = 60;
  
  let path = '';
  const controlPoints: { x: number; y: number }[] = [];
  
  for (let i = 0; i < points; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const variance = Math.random() * 25 + 15;
    const radius = baseRadius + variance;
    
    controlPoints.push({
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    });
  }
  
  // Create smooth curve through points
  path = `M ${controlPoints[0].x} ${controlPoints[0].y}`;
  
  for (let i = 0; i < points; i++) {
    const current = controlPoints[i];
    const next = controlPoints[(i + 1) % points];
    const afterNext = controlPoints[(i + 2) % points];
    
    const cp1x = current.x + (next.x - controlPoints[(i - 1 + points) % points].x) / 4;
    const cp1y = current.y + (next.y - controlPoints[(i - 1 + points) % points].y) / 4;
    const cp2x = next.x - (afterNext.x - current.x) / 4;
    const cp2y = next.y - (afterNext.y - current.y) / 4;
    
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }
  
  path += ' Z';
  return path;
}
