import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface IntroSceneProps {
  onComplete: () => void;
}

const INTRO_STEPS = [
  { text: 'brainchild' },
  { text: 'a place for thoughts that want to disappear' },
  { text: 'nothing lasts here' },
];

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
          }, 3000);
          return prev;
        }
        return prev + 1;
      });
    }, 3000);

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

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-background flex items-center justify-center cursor-pointer',
        'transition-opacity duration-700',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={handleTap}
    >
      <p
        key={currentStep}
        className="text-muted-foreground/50 font-thought text-sm tracking-wide text-center px-10 fog-appear"
      >
        {INTRO_STEPS[currentStep].text}
      </p>
    </div>
  );
};
