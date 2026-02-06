import { Suspense, lazy, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThoughtStore } from '@/stores/thoughtStore';
import { FogBackground } from '@/components/FogBackground';
import { PublicFogView } from '@/components/PublicFogView';
import { PrivateThoughtsView } from '@/components/PrivateThoughtsView';
import { IntroScene } from '@/components/IntroScene';
import { LoadingScreen } from '@/components/LoadingScreen';
import { SubmitBurst } from '@/components/SubmitBurst';
import { MorphingBlob } from '@/components/effects/MorphingBlob';
import { ParticleField } from '@/components/effects/ParticleField';
import { MouseRippleOverlay } from '@/components/effects/RippleEffect';
import { LiquidCursor } from '@/components/effects/LiquidCursor';
import { MagneticWrapper, Reveal } from '@/components/effects/MotionEffects';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Lazy load heavy 3D scene
const FogScene = lazy(() => import('@/components/three/FogScene').then(m => ({ default: m.FogScene })));

type View = 'private' | 'fog';

const INTRO_SEEN_KEY = 'brainchild-intro-seen';
const LOADING_SEEN_KEY = 'brainchild-loading-seen';

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 20, filter: 'blur(10px)' },
  enter: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] }
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    filter: 'blur(10px)',
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
  }
};

const Index = () => {
  const [view, setView] = useState<View>('private');
  const { socialEnabled, socialPermanentlyDisabled, toggleSocial, nuclearDisableSocial } = useThoughtStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [bursts, setBursts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [is3DReady, setIs3DReady] = useState(false);
  const burstIdRef = useRef(0);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'intro') {
      localStorage.removeItem(INTRO_SEEN_KEY);
      window.history.replaceState({}, '', '/');
      setShowIntro(true);
      return;
    }
    
    const hasSeenLoading = sessionStorage.getItem(LOADING_SEEN_KEY);
    
    if (!hasSeenLoading) {
      setShowLoading(true);
    } else if (!localStorage.getItem(INTRO_SEEN_KEY)) {
      setShowIntro(true);
    }
    
    // Delay 3D scene loading for performance
    const timer = setTimeout(() => setIs3DReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleLoadingComplete = () => {
    sessionStorage.setItem(LOADING_SEEN_KEY, 'true');
    setShowLoading(false);
    if (!localStorage.getItem(INTRO_SEEN_KEY)) {
      setShowIntro(true);
    }
  };

  const triggerBurst = useCallback((x: number, y: number) => {
    const id = burstIdRef.current++;
    setBursts(prev => [...prev, { id, x, y }]);
  }, []);

  const removeBurst = useCallback((id: number) => {
    setBursts(prev => prev.filter(b => b.id !== id));
  }, []);

  const handleReplayIntro = () => {
    localStorage.removeItem(INTRO_SEEN_KEY);
    setShowIntro(true);
    setShowSettings(false);
  };

  const handleIntroComplete = () => {
    localStorage.setItem(INTRO_SEEN_KEY, 'true');
    setShowIntro(false);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden cursor-none">
      {/* Custom liquid cursor */}
      <LiquidCursor color="primary" size={30} />
      
      {/* Loading & Intro */}
      <AnimatePresence mode="wait">
        {showLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {showIntro && <IntroScene onComplete={handleIntroComplete} />}
      </AnimatePresence>
      
      {/* Submit burst effects */}
      <AnimatePresence>
        {bursts.map(burst => (
          <SubmitBurst 
            key={burst.id} 
            x={burst.x} 
            y={burst.y} 
            onComplete={() => removeBurst(burst.id)} 
          />
        ))}
      </AnimatePresence>
      
      {/* Background layers */}
      <FogBackground />
      
      {/* 3D Scene - lazy loaded */}
      <Suspense fallback={null}>
        {is3DReady && <FogScene />}
      </Suspense>
      
      {/* Morphing blobs */}
      <MorphingBlob className="top-20 -left-40" color="primary" size={600} speed={12} />
      <MorphingBlob className="bottom-20 -right-40" color="echo" size={500} speed={15} />
      <MorphingBlob className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" color="accent" size={400} speed={10} />
      
      {/* Particle field */}
      <ParticleField density="low" color="primary" />
      
      {/* Mouse ripples */}
      <MouseRippleOverlay />
      
      {/* Cinematic overlays */}
      <div className="noise-overlay" />
      <div className="vignette" />
      
      {/* Scan lines effect */}
      <div className="scanlines" />

      {/* Navigation with magnetic effect */}
      <Reveal delay={0.3}>
        <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1 rounded-full glass-strong relative overflow-hidden group backdrop-blur-xl">
          {/* Animated gradient border */}
          <motion.div 
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            style={{
              background: 'linear-gradient(90deg, hsl(var(--primary) / 0.3), hsl(var(--accent) / 0.3), hsl(var(--primary) / 0.3))',
              backgroundSize: '200% 100%',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '200% 0%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          
          <MagneticWrapper strength={0.2}>
            <motion.button
              onClick={() => setView('private')}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-thought transition-all duration-300 relative overflow-hidden cursor-none',
                view === 'private'
                  ? 'bg-card text-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10">private</span>
              {view === 'private' && (
                <motion.span 
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20"
                  animate={{
                    backgroundPosition: ['0% 0%', '200% 0%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{ backgroundSize: '200% 100%' }}
                />
              )}
            </motion.button>
          </MagneticWrapper>
          
          {!socialPermanentlyDisabled && (
            <MagneticWrapper strength={0.2}>
              <motion.button
                onClick={() => {
                  if (!socialEnabled) toggleSocial();
                  setView('fog');
                }}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-thought transition-all duration-300 relative overflow-hidden cursor-none',
                  view === 'fog' && socialEnabled
                    ? 'bg-card text-foreground shadow-lg shadow-echo/20'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">public fog</span>
                {view === 'fog' && socialEnabled && (
                  <motion.span 
                    className="absolute inset-0 bg-gradient-to-r from-echo/20 via-echo/10 to-echo/20"
                    animate={{
                      backgroundPosition: ['0% 0%', '200% 0%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    style={{ backgroundSize: '200% 100%' }}
                  />
                )}
              </motion.button>
            </MagneticWrapper>
          )}
          
          <MagneticWrapper strength={0.3}>
            <motion.button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center cursor-none',
                'text-muted-foreground hover:text-foreground',
                'transition-all duration-300',
                showSettings && 'bg-secondary/50'
              )}
              animate={{ rotate: showSettings ? 90 : 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Settings"
            >
              ⚙
            </motion.button>
          </MagneticWrapper>
        </nav>
      </Reveal>

      {/* Settings panel with glass morphism */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            className="fixed top-16 left-1/2 -translate-x-1/2 z-30 w-72 p-4 rounded-2xl glass-strong relative overflow-hidden backdrop-blur-xl"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Animated shimmer */}
            <motion.div 
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary) / 0.05) 0%, transparent 50%, hsl(var(--accent) / 0.05) 100%)',
              }}
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            
            <div className="relative">
              <h3 className="text-sm font-thought text-foreground mb-4 flex items-center gap-2">
                <motion.span 
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                controls
              </h3>
            
              <div className="space-y-4">
                {!socialPermanentlyDisabled && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">social layer</span>
                    <motion.button
                      onClick={toggleSocial}
                      className={cn(
                        'w-12 h-6 rounded-full transition-colors duration-300 relative',
                        socialEnabled ? 'bg-primary' : 'bg-secondary'
                      )}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.span 
                        className="absolute top-1 w-4 h-4 rounded-full bg-foreground shadow-lg"
                        animate={{ left: socialEnabled ? 26 : 4 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </motion.button>
                  </div>
                )}
                
                {!socialPermanentlyDisabled && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <motion.button 
                        className="w-full px-3 py-2 rounded-lg text-xs text-destructive-foreground/70 bg-destructive/10 hover:bg-destructive/20 transition-colors text-left"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        permanently disable social
                      </motion.button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card/90 backdrop-blur-xl border-border/50">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-thought text-foreground">nuclear option</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                          This will permanently disable the social layer for this device. 
                          You will never be able to access the public fog again.
                          Your private thoughts remain untouched.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
                          cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={nuclearDisableSocial}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          disable forever
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                
                {socialPermanentlyDisabled && (
                  <p className="text-xs text-muted-foreground/50 text-center py-2">
                    social layer permanently disabled
                  </p>
                )}
                
                <motion.button
                  onClick={handleReplayIntro}
                  className="w-full px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground bg-secondary/30 hover:bg-secondary/50 transition-colors text-left group relative overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10">replay intro</span>
                </motion.button>
              </div>
            </div>
            
            <motion.button
              onClick={() => setShowSettings(false)}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary/50"
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ×
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content with page transitions */}
      <div className="relative z-10 pt-16">
        <AnimatePresence mode="wait">
          {view === 'private' && (
            <motion.div
              key="private"
              variants={pageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              <PrivateThoughtsView />
            </motion.div>
          )}
          
          {view === 'fog' && socialEnabled && !socialPermanentlyDisabled && (
            <motion.div
              key="fog"
              variants={pageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              <PublicFogView />
            </motion.div>
          )}
          
          {view === 'fog' && !socialEnabled && !socialPermanentlyDisabled && (
            <motion.div
              key="disabled"
              variants={pageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6"
            >
              <p className="text-muted-foreground font-thought text-sm mb-4">
                the social layer is disabled
              </p>
              <motion.button
                onClick={toggleSocial}
                className="px-4 py-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                enable public fog
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
