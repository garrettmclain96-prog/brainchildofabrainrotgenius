import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface IntroSceneProps {
  onComplete: () => void;
}

const INTRO_STEPS = [
  {
    title: "brainchild",
    subtitle: "a place for thoughts that want to disappear",
    delay: 0,
  },
  {
    title: "nothing lasts here",
    body: "every thought you release decays over time. no archives. no permanence. just the natural rhythm of forgetting.",
    delay: 3500,
  },
  {
    title: "private by default",
    body: "your thoughts stay on your device until you choose to release them into the fog. even then, they remain anonymous.",
    delay: 7000,
  },
  {
    title: "the public fog",
    body: "a shared space where thoughts drift and fade. no feeds, no followers, no likes. just brief encounters with other minds.",
    delay: 10500,
  },
  {
    title: "echoes",
    body: "leave a brief response to a passing thought. a word. a question. a moment of connection—then it too fades away.",
    delay: 14000,
  },
  {
    title: "how it works",
    bullets: [
      "write thoughts in your private space",
      "choose to release some to the fog",
      "watch them decay and disappear",
      "leave echoes on thoughts that move you"
    ],
    delay: 17500,
  },
];

export const IntroScene = ({ onComplete }: IntroSceneProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    // Show skip button after first step
    const skipTimer = setTimeout(() => setShowSkip(true), 2000);
    
    // Progress through steps
    const timers = INTRO_STEPS.map((step, index) => {
      if (index === 0) return null;
      return setTimeout(() => setCurrentStep(index), step.delay);
    });

    // Auto-complete after all steps
    const completeTimer = setTimeout(() => {
      handleComplete();
    }, 22000);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(completeTimer);
      timers.forEach(t => t && clearTimeout(t));
    };
  }, []);

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(onComplete, 600);
  };

  const step = INTRO_STEPS[currentStep];

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-background flex flex-col items-center justify-center",
        "transition-opacity duration-500",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      {/* Fog particles in background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-muted/20 blur-3xl animate-fog-drift"
            style={{
              width: `${100 + Math.random() * 200}px`,
              height: `${100 + Math.random() * 200}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md px-8 text-center">
        {/* Step indicators */}
        <div className="flex justify-center gap-1.5 mb-12">
          {INTRO_STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-500",
                i === currentStep ? "bg-primary w-4" : i < currentStep ? "bg-primary/40" : "bg-muted/30"
              )}
            />
          ))}
        </div>

        {/* Step content with fade transition */}
        <div key={currentStep} className="fog-appear">
          <h1 className="font-thought text-2xl md:text-3xl text-foreground mb-4 tracking-wide">
            {step.title}
          </h1>
          
          {step.subtitle && (
            <p className="text-muted-foreground text-lg font-light">
              {step.subtitle}
            </p>
          )}
          
          {step.body && (
            <p className="text-muted-foreground leading-relaxed">
              {step.body}
            </p>
          )}
          
          {step.bullets && (
            <ul className="text-left space-y-3 mt-4">
              {step.bullets.map((bullet, i) => (
                <li 
                  key={i} 
                  className="text-muted-foreground flex items-start gap-3 fog-appear"
                  style={{ animationDelay: `${i * 200}ms` }}
                >
                  <span className="text-primary/60 mt-1">○</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-12 flex flex-col items-center gap-4">
          {currentStep === INTRO_STEPS.length - 1 ? (
            <button
              onClick={handleComplete}
              className={cn(
                "px-8 py-3 rounded-full font-thought text-sm",
                "bg-primary/10 text-primary border border-primary/20",
                "hover:bg-primary/20 transition-all duration-300",
                "fog-appear"
              )}
            >
              enter the fog
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(prev => Math.min(prev + 1, INTRO_STEPS.length - 1))}
              className="text-muted-foreground/60 hover:text-muted-foreground text-sm transition-colors"
            >
              continue →
            </button>
          )}
          
          {showSkip && currentStep < INTRO_STEPS.length - 1 && (
            <button
              onClick={handleComplete}
              className="text-muted-foreground/40 hover:text-muted-foreground/60 text-xs transition-colors"
            >
              skip intro
            </button>
          )}
        </div>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-8 text-center">
        <p className="text-muted-foreground/30 text-xs">
          no tracking · no accounts · just thoughts
        </p>
      </div>
    </div>
  );
};
