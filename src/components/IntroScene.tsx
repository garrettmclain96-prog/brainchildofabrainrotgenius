import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface IntroSceneProps {
  onComplete: () => void;
}

/**
 * Onboarding: Max 3 tone-setting screens.
 * No tutorials. No walkthroughs. Learnable by exploration.
 */
const INTRO_STEPS = [
  {
    title: 'brainchild',
    subtitle: 'a place for thoughts that want to disappear',
    delay: 0,
  },
  {
    title: 'nothing lasts here',
    body: 'every thought decays. no archives. no permanence. just the rhythm of forgetting.',
    delay: 4000,
  },
  {
    title: 'private by default',
    body: 'your thoughts live on your device. release them into the fog if you choose — anonymous, ephemeral, untraceable.',
    delay: 8000,
  },
];

export const IntroScene = ({ onComplete }: IntroSceneProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), 2000);

    const timers = INTRO_STEPS.map((step, index) => {
      if (index === 0) return null;
      return setTimeout(() => setCurrentStep(index), step.delay);
    });

    // Auto-complete after all steps
    const completeTimer = setTimeout(() => {
      handleComplete();
    }, 14000);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(completeTimer);
      timers.forEach((t) => t && clearTimeout(t));
    };
  }, []);

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(onComplete, 600);
  };

  const handleContinue = () => {
    if (currentStep < INTRO_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const step = INTRO_STEPS[currentStep];

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-background flex flex-col items-center justify-center overflow-hidden',
        'transition-opacity duration-700',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      {/* Subtle gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 20%, hsl(220 20% 12% / 0.8) 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 80% 80%, hsl(200 15% 10% / 0.6) 0%, transparent 40%)
          `,
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-lg px-8 text-center">
        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-14">
          {INTRO_STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-700',
                i === currentStep
                  ? 'bg-primary w-8 shadow-[0_0_12px_hsl(var(--primary)/0.5)]'
                  : i < currentStep
                  ? 'bg-primary/50 w-2'
                  : 'bg-muted/20 w-2'
              )}
            />
          ))}
        </div>

        {/* Step content */}
        <div key={currentStep} className="space-y-6">
          <div className="relative">
            <h1
              className={cn(
                'font-thought text-3xl md:text-4xl text-foreground tracking-wider fog-appear',
                currentStep === 0 && 'animate-glitch-subtle'
              )}
            >
              {step.title}
            </h1>
          </div>

          {step.subtitle && (
            <p
              className="text-muted-foreground text-lg md:text-xl font-light tracking-wide fog-appear"
              style={{ animationDelay: '400ms' }}
            >
              {step.subtitle}
            </p>
          )}

          {step.body && (
            <p
              className="text-muted-foreground/80 leading-relaxed text-base md:text-lg fog-appear"
              style={{ animationDelay: '300ms' }}
            >
              {step.body}
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-14 flex flex-col items-center gap-5">
          {currentStep === INTRO_STEPS.length - 1 ? (
            <button
              onClick={handleComplete}
              className={cn(
                'relative px-10 py-4 rounded-full font-thought text-base',
                'bg-primary/10 text-primary border border-primary/30',
                'hover:bg-primary/20 hover:border-primary/50 transition-all duration-500',
                'shadow-[0_0_30px_hsl(var(--primary)/0.2)]',
                'fog-appear'
              )}
            >
              enter the fog
            </button>
          ) : (
            <button
              onClick={handleContinue}
              className="text-muted-foreground/70 hover:text-foreground text-sm transition-all duration-300 hover:tracking-wider group flex items-center gap-2"
            >
              <span>continue</span>
              <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </button>
          )}

          {showSkip && currentStep < INTRO_STEPS.length - 1 && (
            <button
              onClick={handleComplete}
              className="text-muted-foreground/30 hover:text-muted-foreground/50 text-xs transition-colors"
            >
              skip
            </button>
          )}
        </div>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-10 text-center fog-appear" style={{ animationDelay: '800ms' }}>
        <p className="text-muted-foreground/25 text-xs tracking-widest uppercase">
          no tracking · no accounts · just thoughts
        </p>
      </div>
    </div>
  );
};
