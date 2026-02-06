import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

// Particle system for loading screen
function Particles({ count = 50 }: { count?: number }) {
  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 8 + Math.random() * 8,
      size: 4 + Math.random() * 8,
      opacity: 0.1 + Math.random() * 0.2,
    })),
    [count]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, hsl(var(--primary) / ${p.opacity}) 0%, transparent 70%)`,
          }}
          initial={{ y: '110vh', opacity: 0 }}
          animate={{ 
            y: '-10vh', 
            opacity: [0, p.opacity, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// DNA helix-like loading animation
function HelixLoader() {
  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      {/* Outer rotating ring */}
      <motion.div 
        className="absolute inset-0 rounded-full border-2 border-primary/20"
        style={{ borderStyle: 'dashed' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Middle pulsing ring */}
      <motion.div 
        className="absolute inset-4 rounded-full border border-primary/30"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Inner rotating ring */}
      <motion.div 
        className="absolute inset-8 rounded-full border border-echo/40"
        style={{ borderStyle: 'dotted' }}
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Orbiting dots */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary"
          style={{
            boxShadow: '0 0 15px hsl(var(--primary) / 0.8)',
          }}
          animate={{
            rotate: 360,
            scale: [1, 1.5, 1],
          }}
          transition={{
            rotate: { duration: 4 + i * 0.5, repeat: Infinity, ease: 'linear', delay: i * 0.2 },
            scale: { duration: 1, repeat: Infinity, delay: i * 0.15 },
          }}
          initial={{
            x: Math.cos((i / 6) * Math.PI * 2) * 50,
            y: Math.sin((i / 6) * Math.PI * 2) * 50,
          }}
        />
      ))}
      
      {/* Center core */}
      <motion.div 
        className="relative w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"
        animate={{
          scale: [1, 1.2, 1],
          boxShadow: [
            '0 0 30px hsl(var(--primary) / 0.3)',
            '0 0 60px hsl(var(--primary) / 0.6)',
            '0 0 30px hsl(var(--primary) / 0.3)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.div 
          className="w-3 h-3 rounded-full bg-primary"
          animate={{
            scale: [1, 0.8, 1],
          }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  );
}

export function LoadingScreen({ onComplete, minDuration = 3000 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'revealing' | 'exiting'>('loading');
  const [loadingText, setLoadingText] = useState('initializing');

  const loadingPhrases = [
    'initializing fog protocols',
    'generating neural pathways',
    'calibrating decay algorithms',
    'syncing consciousness matrix',
    'materializing thought space',
    'entering the void',
  ];

  useEffect(() => {
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / minDuration) * 100, 100);
      setProgress(newProgress);
      
      // Update loading text based on progress
      const phraseIndex = Math.floor((newProgress / 100) * loadingPhrases.length);
      setLoadingText(loadingPhrases[Math.min(phraseIndex, loadingPhrases.length - 1)]);
      
      if (newProgress >= 100) {
        clearInterval(interval);
        setPhase('revealing');
        setTimeout(() => {
          setPhase('exiting');
          setTimeout(onComplete, 800);
        }, 500);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [minDuration, onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background overflow-hidden"
        )}
        initial={{ opacity: 1 }}
        animate={{ 
          opacity: phase === 'exiting' ? 0 : 1,
          scale: phase === 'exiting' ? 1.05 : 1,
        }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Background gradient animation */}
        <motion.div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 30% 30%, hsl(var(--primary) / 0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 70%, hsl(var(--echo) / 0.05) 0%, transparent 50%)
            `,
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Particles */}
        <Particles count={40} />

        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Helix loader */}
          <HelixLoader />

          {/* Brand */}
          <motion.div 
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <motion.h1 
              className="font-thought text-3xl tracking-[0.4em] mb-2"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--foreground)), hsl(var(--primary)), hsl(var(--foreground)))',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            >
              BRAINCHILD
            </motion.h1>
            
            <motion.p 
              className="text-muted-foreground/40 text-xs tracking-[0.3em] uppercase"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              thoughts that fade
            </motion.p>
          </motion.div>

          {/* Progress section */}
          <motion.div 
            className="mt-12 flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {/* Progress bar container */}
            <div className="relative w-64 h-1 bg-secondary/20 rounded-full overflow-hidden">
              {/* Background glow */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.2), transparent)',
                  backgroundSize: '200% 100%',
                }}
                animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              
              {/* Actual progress */}
              <motion.div 
                className="absolute left-0 top-0 bottom-0 rounded-full"
                style={{ 
                  background: 'linear-gradient(90deg, hsl(var(--primary) / 0.5), hsl(var(--primary)), hsl(var(--echo)))',
                  boxShadow: '0 0 20px hsl(var(--primary) / 0.5)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
              
              {/* Progress edge glow */}
              <motion.div
                className="absolute top-0 bottom-0 w-4 rounded-full"
                style={{
                  left: `calc(${progress}% - 8px)`,
                  background: 'radial-gradient(circle, hsl(var(--primary)), transparent)',
                  filter: 'blur(4px)',
                }}
              />
            </div>

            {/* Loading text with typewriter effect */}
            <motion.div 
              className="h-5 overflow-hidden"
              key={loadingText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-muted-foreground/50 text-xs font-thought tracking-wide">
                {loadingText}
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  _
                </motion.span>
              </p>
            </motion.div>

            {/* Percentage */}
            <motion.span 
              className="text-primary/60 text-sm font-thought tabular-nums"
              style={{ textShadow: '0 0 10px hsl(var(--primary) / 0.3)' }}
            >
              {Math.round(progress)}%
            </motion.span>
          </motion.div>
        </div>

        {/* Corner decorations */}
        <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-primary/10 rounded-tl-xl" />
        <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-primary/10 rounded-tr-xl" />
        <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-primary/10 rounded-bl-xl" />
        <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-primary/10 rounded-br-xl" />
      </motion.div>
    </AnimatePresence>
  );
}
