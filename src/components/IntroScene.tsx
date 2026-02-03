import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useIntroSounds } from '@/hooks/useIntroSounds';

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
    delay: 6000, // Slowed from 3500
  },
  {
    title: "private by default",
    body: "your thoughts stay on your device until you choose to release them into the fog. even then, they remain anonymous.",
    delay: 12000, // Slowed from 7000
  },
  {
    title: "the public fog",
    body: "a shared space where thoughts drift and fade. no feeds, no followers, no likes. just brief encounters with other minds.",
    delay: 18000, // Slowed from 10500
  },
  {
    title: "echoes",
    body: "leave a brief response to a passing thought. a word. a question. a moment of connection—then it too fades away.",
    delay: 24000, // Slowed from 14000
  },
  {
    title: "how it works",
    bullets: [
      "write thoughts in your private space",
      "choose to release some to the fog",
      "watch them decay and disappear",
      "leave echoes on thoughts that move you"
    ],
    delay: 30000, // Slowed from 17500
  },
];

// Floating symbols that drift across the screen
const FLOATING_SYMBOLS = ['◌', '◯', '○', '◦', '·', '∘', '⊙', '◉', '⦿', '⊚'];

// Generate random floating elements
const generateFloatingElements = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    symbol: FLOATING_SYMBOLS[Math.floor(Math.random() * FLOATING_SYMBOLS.length)],
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 12 + Math.random() * 24,
    duration: 20 + Math.random() * 30,
    delay: Math.random() * -20,
    opacity: 0.1 + Math.random() * 0.2,
  }));
};

// Generate glowing orbs
const generateOrbs = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 150 + Math.random() * 250,
    duration: 25 + Math.random() * 20,
    delay: Math.random() * -15,
    hue: 200 + Math.random() * 30, // Blue-ish hues
  }));
};

export const IntroScene = ({ onComplete }: IntroSceneProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [showSkip, setShowSkip] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const hasInteractedRef = useRef(false);
  
  const { startAmbient, stopAmbient, playTyping, playWhoosh } = useIntroSounds();

  // Pre-generate visual elements
  const [floatingElements] = useState(() => generateFloatingElements(20));
  const [glowingOrbs] = useState(() => generateOrbs(6));

  // Start ambient sound on first user interaction
  const handleFirstInteraction = () => {
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      setSoundEnabled(true);
      startAmbient();
    }
  };

  // Play typing sounds when text appears
  useEffect(() => {
    if (!soundEnabled) return;
    
    // Play whoosh on step change
    playWhoosh();
    
    // Simulate typing sounds for text content
    const step = INTRO_STEPS[currentStep];
    const textLength = (step.title?.length || 0) + (step.body?.length || 0) + (step.subtitle?.length || 0);
    const typingSounds: NodeJS.Timeout[] = [];
    
    // Create random typing sounds spread over the text appearance
    for (let i = 0; i < Math.min(textLength / 5, 15); i++) {
      typingSounds.push(
        setTimeout(() => playTyping(), 50 + Math.random() * 300)
      );
    }
    
    return () => typingSounds.forEach(t => clearTimeout(t));
  }, [currentStep, soundEnabled, playTyping, playWhoosh]);

  useEffect(() => {
    // Show skip button after first step
    const skipTimer = setTimeout(() => setShowSkip(true), 3000);
    
    // Progress through steps
    const timers = INTRO_STEPS.map((step, index) => {
      if (index === 0) return null;
      return setTimeout(() => setCurrentStep(index), step.delay);
    });

    // Auto-complete after all steps (longer now)
    const completeTimer = setTimeout(() => {
      handleComplete();
    }, 38000);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(completeTimer);
      timers.forEach(t => t && clearTimeout(t));
    };
  }, []);

  const handleComplete = () => {
    stopAmbient();
    setIsVisible(false);
    setTimeout(onComplete, 600);
  };

  const handleContinue = () => {
    handleFirstInteraction();
    setCurrentStep(prev => Math.min(prev + 1, INTRO_STEPS.length - 1));
  };

  const handleEnterFog = () => {
    handleFirstInteraction();
    playWhoosh();
    setTimeout(handleComplete, 200);
  };

  const handleSkip = () => {
    handleFirstInteraction();
    handleComplete();
  };

  const step = INTRO_STEPS[currentStep];

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-background flex flex-col items-center justify-center overflow-hidden",
        "transition-opacity duration-700",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      {/* Scan lines overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--foreground)) 2px, hsl(var(--foreground)) 3px)',
        }}
      />

      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 animate-gradient-shift"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 20%, hsl(220 20% 12% / 0.8) 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 80% 80%, hsl(200 15% 10% / 0.6) 0%, transparent 40%),
            radial-gradient(ellipse 100% 80% at 50% 120%, hsl(210 25% 8% / 0.9) 0%, transparent 60%)
          `,
        }}
      />

      {/* Glowing orbs */}
      {glowingOrbs.map((orb) => (
        <div
          key={`orb-${orb.id}`}
          className="absolute rounded-full animate-float-slow blur-3xl"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, hsl(${orb.hue} 30% 20% / 0.15) 0%, transparent 70%)`,
            animationDuration: `${orb.duration}s`,
            animationDelay: `${orb.delay}s`,
          }}
        />
      ))}

      {/* Fog particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-muted/10 blur-3xl animate-fog-drift"
            style={{
              width: `${80 + Math.random() * 180}px`,
              height: `${80 + Math.random() * 180}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${20 + Math.random() * 15}s`,
            }}
          />
        ))}
      </div>

      {/* Floating symbols */}
      {floatingElements.map((el) => (
        <div
          key={`symbol-${el.id}`}
          className="absolute text-primary/20 animate-float-symbol font-mono select-none pointer-events-none"
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            fontSize: el.size,
            opacity: el.opacity,
            animationDuration: `${el.duration}s`,
            animationDelay: `${el.delay}s`,
          }}
        >
          {el.symbol}
        </div>
      ))}

      {/* Pulsing center glow */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] animate-pulse-slow"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Horizontal lines that sweep across */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-sweep-line"
          style={{ animationDuration: '8s', top: '30%' }}
        />
        <div 
          className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-sweep-line"
          style={{ animationDuration: '12s', animationDelay: '4s', top: '70%' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-lg px-8 text-center">
        {/* Step indicators with glow */}
        <div className="flex justify-center gap-2 mb-14">
          {INTRO_STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-700",
                i === currentStep 
                  ? "bg-primary w-8 shadow-[0_0_12px_hsl(var(--primary)/0.5)]" 
                  : i < currentStep 
                    ? "bg-primary/50 w-2" 
                    : "bg-muted/20 w-2"
              )}
            />
          ))}
        </div>

        {/* Step content with enhanced animations */}
        <div key={currentStep} className="space-y-6">
          {/* Title with glitch effect on first step */}
          <div className="relative">
            <h1 
              className={cn(
                "font-thought text-3xl md:text-4xl text-foreground tracking-wider fog-appear",
                currentStep === 0 && "animate-glitch-subtle"
              )}
            >
              {step.title}
            </h1>
            {/* Title glow */}
            <div 
              className="absolute inset-0 blur-xl opacity-30 fog-appear"
              style={{ animationDelay: '200ms' }}
            >
              <h1 className="font-thought text-3xl md:text-4xl text-primary tracking-wider">
                {step.title}
              </h1>
            </div>
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
          
          {step.bullets && (
            <ul className="text-left space-y-4 mt-6">
              {step.bullets.map((bullet, i) => (
                <li 
                  key={i} 
                  className="text-muted-foreground/90 flex items-start gap-4 fog-appear group"
                  style={{ animationDelay: `${300 + i * 250}ms` }}
                >
                  <span className="text-primary/60 mt-1 text-lg group-hover:text-primary transition-colors">◦</span>
                  <span className="text-base">{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-14 flex flex-col items-center gap-5">
          {currentStep === INTRO_STEPS.length - 1 ? (
            <button
              onClick={handleEnterFog}
              className={cn(
                "relative px-10 py-4 rounded-full font-thought text-base",
                "bg-primary/10 text-primary border border-primary/30",
                "hover:bg-primary/20 hover:border-primary/50 transition-all duration-500",
                "shadow-[0_0_30px_hsl(var(--primary)/0.2)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.3)]",
                "fog-appear group overflow-hidden"
              )}
            >
              {/* Button shimmer effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
              </div>
              <span className="relative z-10">enter the fog</span>
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
              onClick={handleSkip}
              className="text-muted-foreground/30 hover:text-muted-foreground/50 text-xs transition-colors"
            >
              skip intro
            </button>
          )}
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l border-t border-primary/10 rounded-tl-lg opacity-50" />
      <div className="absolute top-8 right-8 w-16 h-16 border-r border-t border-primary/10 rounded-tr-lg opacity-50" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l border-b border-primary/10 rounded-bl-lg opacity-50" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r border-b border-primary/10 rounded-br-lg opacity-50" />

      {/* Bottom hint with fade */}
      <div className="absolute bottom-10 text-center fog-appear" style={{ animationDelay: '1000ms' }}>
        <p className="text-muted-foreground/25 text-xs tracking-widest uppercase">
          no tracking · no accounts · just thoughts
        </p>
      </div>
    </div>
  );
};
