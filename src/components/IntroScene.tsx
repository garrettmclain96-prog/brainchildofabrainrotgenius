import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface IntroSceneProps {
  onComplete: () => void;
}

const INTRO_STEPS = [
  { text: 'brainchild', style: 'title' as const },
  { text: 'a quiet place for thoughts that decay', style: 'body' as const },
  { text: 'star what matters. let the rest go.', style: 'body' as const },
];

const STEP_DURATION = 2500;

export const IntroScene = ({ onComplete }: IntroSceneProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= INTRO_STEPS.length - 1) {
          clearInterval(timer);
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 600);
          }, STEP_DURATION);
          return prev;
        }
        return prev + 1;
      });
    }, STEP_DURATION);

    return () => clearInterval(timer);
  }, [onComplete]);

  const handleTap = () => {
    if (currentStep < INTRO_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsVisible(false);
      setTimeout(onComplete, 600);
    }
  };

  const step = INTRO_STEPS[currentStep];

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-background flex flex-col items-center justify-center cursor-pointer',
        'transition-opacity duration-700',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={handleTap}
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={currentStep}
          className={cn(
            'font-thought text-center px-10',
            step.style === 'title'
              ? 'text-lg text-foreground/70 tracking-[0.2em]'
              : 'text-sm text-muted-foreground/45 tracking-wide leading-relaxed'
          )}
          initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        >
          {step.text}
        </motion.p>
      </AnimatePresence>

      {/* Step indicators — subtle dots */}
      <div className="absolute bottom-16 flex gap-2.5">
        {INTRO_STEPS.map((_, i) => (
          <motion.div
            key={i}
            className="rounded-full"
            animate={{
              width: i === currentStep ? 6 : 3,
              height: 3,
              backgroundColor: i === currentStep
                ? 'hsl(var(--foreground) / 0.25)'
                : 'hsl(var(--foreground) / 0.08)',
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        ))}
      </div>

      {/* Tap hint on last step */}
      {currentStep === INTRO_STEPS.length - 1 && (
        <motion.span
          className="absolute bottom-8 text-[10px] font-thought text-muted-foreground/20 tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          tap to begin
        </motion.span>
      )}
    </div>
  );
};
