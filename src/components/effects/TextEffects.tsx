import { useRef, useEffect } from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
  intensity?: 'subtle' | 'medium' | 'heavy';
}

export function GlitchText({ text, className = '', intensity = 'subtle' }: GlitchTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?~`░▒▓█▀▄';
    let animationFrame: number;
    let lastGlitch = 0;
    
    const glitchInterval = intensity === 'subtle' ? 5000 : intensity === 'medium' ? 2000 : 500;
    
    const glitch = (timestamp: number) => {
      if (timestamp - lastGlitch > glitchInterval) {
        lastGlitch = timestamp;
        
        const spans = container.querySelectorAll('.glitch-char');
        const randomIndex = Math.floor(Math.random() * spans.length);
        const span = spans[randomIndex] as HTMLSpanElement;
        
        if (span) {
          const originalChar = span.dataset.char || '';
          const glitchChar = glitchChars[Math.floor(Math.random() * glitchChars.length)];
          
          span.textContent = glitchChar;
          span.style.color = 'hsl(var(--destructive))';
          span.style.textShadow = '0 0 10px hsl(var(--destructive))';
          
          setTimeout(() => {
            span.textContent = originalChar;
            span.style.color = '';
            span.style.textShadow = '';
          }, 100);
        }
      }
      
      animationFrame = requestAnimationFrame(glitch);
    };
    
    animationFrame = requestAnimationFrame(glitch);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [text, intensity]);
  
  return (
    <span ref={containerRef} className={`relative inline-block ${className}`}>
      {text.split('').map((char, i) => (
        <span 
          key={i} 
          className="glitch-char inline-block transition-all duration-75"
          data-char={char}
        >
          {char}
        </span>
      ))}
      {/* Glitch layers */}
      <span 
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
        style={{
          color: 'hsl(var(--primary))',
          clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)',
          transform: 'translateX(2px)',
          mixBlendMode: 'screen',
        }}
        aria-hidden="true"
      >
        {text}
      </span>
      <span 
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
        style={{
          color: 'hsl(var(--accent))',
          clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)',
          transform: 'translateX(-2px)',
          mixBlendMode: 'screen',
        }}
        aria-hidden="true"
      >
        {text}
      </span>
    </span>
  );
}

// Scramble text effect on hover
interface ScrambleTextProps {
  text: string;
  className?: string;
}

export function ScrambleText({ text, className = '' }: ScrambleTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  
  const handleMouseEnter = () => {
    const container = containerRef.current;
    if (!container) return;
    
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const spans = container.querySelectorAll('.scramble-char');
    
    spans.forEach((span, index) => {
      const htmlSpan = span as HTMLSpanElement;
      const originalChar = htmlSpan.dataset.char || '';
      let iterations = 0;
      
      const interval = setInterval(() => {
        if (iterations >= 5) {
          htmlSpan.textContent = originalChar;
          clearInterval(interval);
          return;
        }
        
        htmlSpan.textContent = chars[Math.floor(Math.random() * chars.length)];
        iterations++;
      }, 30 + index * 10);
    });
  };
  
  return (
    <span 
      ref={containerRef} 
      className={`inline-block cursor-pointer ${className}`}
      onMouseEnter={handleMouseEnter}
    >
      {text.split('').map((char, i) => (
        <span 
          key={i} 
          className="scramble-char inline-block"
          data-char={char}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

// Typewriter effect
interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  cursor?: boolean;
  onComplete?: () => void;
}

export function Typewriter({ 
  text, 
  speed = 50, 
  delay = 0, 
  className = '', 
  cursor = true,
  onComplete 
}: TypewriterProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.textContent = '';
    
    const timeout = setTimeout(() => {
      let index = 0;
      
      const typeInterval = setInterval(() => {
        if (index < text.length) {
          container.textContent += text[index];
          index++;
        } else {
          clearInterval(typeInterval);
          onComplete?.();
        }
      }, speed);
      
      return () => clearInterval(typeInterval);
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [text, speed, delay, onComplete]);
  
  return (
    <span className={`inline-block ${className}`}>
      <span ref={containerRef} />
      {cursor && (
        <span className="inline-block w-[2px] h-[1em] bg-primary ml-1 animate-pulse" />
      )}
    </span>
  );
}
