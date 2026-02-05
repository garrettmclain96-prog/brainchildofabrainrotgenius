 import { useState, useEffect, useRef, useCallback } from 'react';
import { useThoughtStore } from '@/stores/thoughtStore';
import { FogBackground } from '@/components/FogBackground';
import { PublicFogView } from '@/components/PublicFogView';
import { PrivateThoughtsView } from '@/components/PrivateThoughtsView';
import { IntroScene } from '@/components/IntroScene';
 import { LoadingScreen } from '@/components/LoadingScreen';
 import { CursorGlow } from '@/components/CursorGlow';
 import { SubmitBurst } from '@/components/SubmitBurst';
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

type View = 'private' | 'fog';

const INTRO_SEEN_KEY = 'brainchild-intro-seen';
 const LOADING_SEEN_KEY = 'brainchild-loading-seen';

const Index = () => {
  const [view, setView] = useState<View>('private');
  const { socialEnabled, socialPermanentlyDisabled, toggleSocial, nuclearDisableSocial } = useThoughtStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
   const [showLoading, setShowLoading] = useState(false);
   const [bursts, setBursts] = useState<Array<{ id: number; x: number; y: number }>>([]);
   const burstIdRef = useRef(0);

  useEffect(() => {
    // Check for reset parameter or if intro hasn't been seen
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
    <div className="min-h-screen bg-background relative overflow-hidden">
       {showLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
      {showIntro && <IntroScene onComplete={handleIntroComplete} />}
       <CursorGlow />
       
       {/* Submit burst effects */}
       {bursts.map(burst => (
         <SubmitBurst 
           key={burst.id} 
           x={burst.x} 
           y={burst.y} 
           onComplete={() => removeBurst(burst.id)} 
         />
       ))}
       
      <FogBackground />
       
       {/* Cinematic overlays */}
       <div className="noise-overlay" />
       <div className="vignette" />
 
      {/* Navigation with enhanced styling */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1 rounded-full glass-strong relative overflow-hidden group">
        {/* Animated border glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        
        <button
          onClick={() => setView('private')}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-thought transition-all duration-300 relative overflow-hidden',
            view === 'private'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <span className="relative z-10">private</span>
          {view === 'private' && (
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
          )}
        </button>
        
        {!socialPermanentlyDisabled && (
          <button
            onClick={() => {
              if (!socialEnabled) {
                toggleSocial();
              }
              setView('fog');
            }}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-thought transition-all duration-300 relative overflow-hidden',
              view === 'fog' && socialEnabled
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="relative z-10">public fog</span>
            {view === 'fog' && socialEnabled && (
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-echo/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            )}
          </button>
        )}
        
        {/* Settings toggle with rotation animation */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            'text-muted-foreground hover:text-foreground',
            'transition-all duration-300',
            showSettings && 'bg-secondary/50 rotate-90'
          )}
          aria-label="Settings"
        >
          ⚙
        </button>
      </nav>

      {/* Settings panel with enhanced styling */}
      {showSettings && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 w-72 p-4 rounded-lg glass-strong fog-appear relative overflow-hidden">
          {/* Animated border */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
          
          <div className="relative">
            <h3 className="text-sm font-thought text-foreground mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse" />
              controls
            </h3>
          
          <div className="space-y-4">
            {/* Social toggle */}
            {!socialPermanentlyDisabled && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">social layer</span>
                <button
                  onClick={toggleSocial}
                  className={cn(
                    'w-10 h-5 rounded-full transition-all duration-300 relative',
                    socialEnabled ? 'bg-primary' : 'bg-secondary'
                  )}
                >
                  <span 
                    className={cn(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-all duration-300',
                      socialEnabled ? 'left-5' : 'left-0.5'
                    )}
                  />
                </button>
              </div>
            )}
            
            {/* Nuclear option */}
            {!socialPermanentlyDisabled && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full px-3 py-2 rounded text-xs text-destructive-foreground/70 bg-destructive/10 hover:bg-destructive/20 transition-colors text-left">
                    permanently disable social
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border/50">
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
            
            {/* Replay intro button */}
            <button
              onClick={handleReplayIntro}
              className="w-full px-3 py-2 rounded text-xs text-muted-foreground hover:text-foreground bg-secondary/30 hover:bg-secondary/50 transition-colors text-left group relative overflow-hidden"
            >
              <span className="relative z-10">replay intro</span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={() => setShowSettings(false)}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-transform hover:rotate-90 duration-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 pt-16">
        {view === 'private' && <PrivateThoughtsView />}
        {view === 'fog' && socialEnabled && !socialPermanentlyDisabled && <PublicFogView />}
        {view === 'fog' && !socialEnabled && !socialPermanentlyDisabled && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
            <p className="text-muted-foreground font-thought text-sm mb-4">
              the social layer is disabled
            </p>
            <button
              onClick={toggleSocial}
              className="px-4 py-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm"
            >
              enable public fog
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
