import { Suspense, lazy, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThoughtStore } from '@/stores/thoughtStore';
import { useAppMode } from '@/hooks/useAppMode';
import { useEasterEggs } from '@/hooks/useEasterEggs';
import { useOverloadSensor } from '@/hooks/useOverloadSensor';
import { useAISynthesis } from '@/hooks/useAISynthesis';
import { useAmbientAudio } from '@/hooks/useAmbientAudio';
import { useHaptics } from '@/hooks/useHaptics';
import { useMemoryDrift } from '@/hooks/useMemoryDrift';
import { useRareCognitiveEvents } from '@/hooks/useRareCognitiveEvents';
import { useCoThinking } from '@/hooks/useCoThinking';
import { useAppMoods } from '@/hooks/useAppMoods';
import { useIdentityDrift } from '@/hooks/useIdentityDrift';
import { PoeticErrorBoundary } from '@/components/PoeticErrorBoundary';
import { FogBackground } from '@/components/FogBackground';
import { BottomNav } from '@/components/BottomNav';
import { ModeToggle } from '@/components/ModeToggle';
import { SyncIndicator } from '@/components/SyncIndicator';
import { AmbientLog } from '@/components/AmbientLog';

// Lazy-load views — only one is visible at a time
const PublicFogView = lazy(() => import('@/components/PublicFogView').then((m) => ({ default: m.PublicFogView })));
const PrivateThoughtsView = lazy(() => import('@/components/PrivateThoughtsView').then((m) => ({ default: m.PrivateThoughtsView })));
const SettingsView = lazy(() => import('@/components/SettingsView').then((m) => ({ default: m.SettingsView })));
const HomeScreen = lazy(() => import('@/components/HomeScreen').then((m) => ({ default: m.HomeScreen })));

// Lazy-load overlays — rarely visible, not needed for initial paint
const SystemKoan = lazy(() => import('@/components/SystemKoan').then((m) => ({ default: m.SystemKoan })));
const OverloadOverlay = lazy(() => import('@/components/OverloadOverlay').then((m) => ({ default: m.OverloadOverlay })));
const OvernightSynthesisOverlay = lazy(() => import('@/components/OvernightSynthesis').then((m) => ({ default: m.OvernightSynthesisOverlay })));
const RareEventOverlay = lazy(() => import('@/components/RareEventOverlay').then((m) => ({ default: m.RareEventOverlay })));
const CoThinkingIndicator = lazy(() => import('@/components/CoThinkingIndicator').then((m) => ({ default: m.CoThinkingIndicator })));
const EndOfDayCompost = lazy(() => import('@/components/EndOfDayCompost').then((m) => ({ default: m.EndOfDayCompost })));
const LeavingOverlay = lazy(() => import('@/components/LeavingOverlay').then((m) => ({ default: m.LeavingOverlay })));
import { useLeavingRoom } from '@/components/LeavingOverlay';
import { SponsoredWhisper } from '@/components/SponsoredWhisper';
import { PaymentWhisper } from '@/components/PaymentWhisper';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';

// Lazy load heavy 3D scene — deferred for performance
const FogScene = lazy(() => import('@/components/three/FogScene').then((m) => ({ default: m.FogScene })));

type View = 'private' | 'fog' | 'settings';

const HOME_SEEN_KEY = 'brainchild-home-seen';
const FIRST_VISIT_KEY = 'brainchild-first-visit';

const smoothEase: [number, number, number, number] = [0.23, 1, 0.32, 1];

const pageVariants = {
  initial: { opacity: 0, y: 15, filter: 'blur(6px)' },
  enter: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: smoothEase },
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: 'blur(6px)',
    transition: { duration: 0.35, ease: smoothEase },
  },
};

const Index = () => {
  const [view, setView] = useState<View>('private');
  const { socialEnabled, socialPermanentlyDisabled, toggleSocial, privateThoughts, loadFromDB } = useThoughtStore();
  const { mode } = useAppMode();
  const [showHome, setShowHome] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [is3DReady, setIs3DReady] = useState(false);

  // Sensory systems
  const audio = useAmbientAudio();
  const haptics = useHaptics();
  const { activeEgg, dismissEgg } = useEasterEggs(privateThoughts);
  const overload = useOverloadSensor();
  const synthesis = useAISynthesis(privateThoughts);

  // Cognitive systems
  useMemoryDrift();
  const { activeEvent, dismissEvent } = useRareCognitiveEvents(privateThoughts);
  const coThinking = useCoThinking(privateThoughts.length);

  // Reflective systems (non-manipulative)
  const appMood = useAppMoods();
  const identity = useIdentityDrift(privateThoughts);
  const leaving = useLeavingRoom();

  // Premium status — caches to sessionStorage for thoughtStore access
  const premium = usePremiumStatus();

  // Derived counts for ambient log
  const starredCount = useMemo(
    () => privateThoughts.filter((t) => t.starred).length,
    [privateThoughts]
  );

  // Load notes from database on mount
  useEffect(() => {
    loadFromDB();
  }, [loadFromDB]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'intro') {
      localStorage.removeItem(HOME_SEEN_KEY);
      localStorage.removeItem(FIRST_VISIT_KEY);
      window.history.replaceState({}, '', '/');
      setIsFirstVisit(true);
      setShowHome(true);
      return;
    }

    // Always show home screen on app open — it's the entry ritual
    const hasSeenBefore = localStorage.getItem(FIRST_VISIT_KEY);
    if (!hasSeenBefore) {
      setIsFirstVisit(true);
      localStorage.setItem(FIRST_VISIT_KEY, 'true');
    }
    setShowHome(true);

    const timer = setTimeout(() => setIs3DReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activeEgg) haptics.discoveryPattern();
  }, [activeEgg, haptics]);

  const handleHomeComplete = useCallback(() => {
    localStorage.setItem(HOME_SEEN_KEY, 'true');
    setShowHome(false);
  }, []);

  const handleReplayIntro = useCallback(() => {
    localStorage.removeItem(HOME_SEEN_KEY);
    setIsFirstVisit(false);
    setShowHome(true);
  }, []);

  const handleViewChange = useCallback(
    (newView: View) => {
      overload.recordAction();
      if (newView === 'fog' && !socialEnabled && !socialPermanentlyDisabled) {
        toggleSocial();
      }
      setView(newView);
    },
    [socialEnabled, socialPermanentlyDisabled, toggleSocial, overload]
  );

  return (
    <PoeticErrorBoundary>
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Home screen — atmospheric entry */}
        <AnimatePresence mode="wait">
          {showHome && (
            <HomeScreen
              onEnter={handleHomeComplete}
              isFirstVisit={isFirstVisit}
            />
          )}
        </AnimatePresence>

        {/* Background layers */}
        <FogBackground />
        <Suspense fallback={null}>{is3DReady && <FogScene />}</Suspense>

        {/* Film grain & vignette */}
        <div className="noise-overlay" />
        <div className="vignette" />

        {/* Sync status */}
        <SyncIndicator />

        {/* Easter eggs */}
        <SystemKoan egg={activeEgg} onDismiss={dismissEgg} />

        {/* Rare cognitive events */}
        <PoeticErrorBoundary silent>
          <RareEventOverlay event={activeEvent} onDismiss={dismissEvent} />
        </PoeticErrorBoundary>

        {/* Co-thinking presence */}
        <CoThinkingIndicator presence={coThinking} />

        {/* Overload sensor */}
        <OverloadOverlay
          isOverloaded={overload.isOverloaded}
          intensity={overload.intensity}
          onChoose={overload.choosePath}
          onDismiss={overload.dismiss}
        />

        {/* Overnight synthesis */}
        <OvernightSynthesisOverlay
          hasSynthesis={synthesis.hasSynthesis}
          synthesis={synthesis.synthesis}
          decayedCount={synthesis.decayedCount}
          onDismiss={synthesis.dismissSynthesis}
        />

        {/* End of day compost */}
        <EndOfDayCompost thoughts={privateThoughts} />

        {/* Leaving room — exit-triggered farewell */}
        <LeavingOverlay
          isLeaving={leaving.isLeaving}
          prompt={leaving.prompt}
          onDismiss={leaving.dismiss}
        />

        {/* Ambient log — subtle status line */}
        <AmbientLog thoughtCount={privateThoughts.length} starredCount={starredCount} />

        {/* Sponsored whisper — max 1 per session, delayed */}
        <SponsoredWhisper />

        {/* Payment failure whisper — checks on load */}
        <PaymentWhisper />

        {/* Top bar */}
        <header className="fixed top-0 left-0 right-0 z-30 safe-area-top">
          <div className="flex items-center justify-end px-4 py-2.5">
            <ModeToggle />
          </div>
        </header>

        {/* Main content */}
        <div className="relative z-10 pt-10">
          <AnimatePresence mode="wait">
            {view === 'private' && (
              <motion.div key="private" variants={pageVariants} initial="initial" animate="enter" exit="exit">
                <PoeticErrorBoundary>
                  <PrivateThoughtsView
                    onAction={overload.recordAction}
                    appMood={appMood}
                    identity={identity}
                  />
                </PoeticErrorBoundary>
              </motion.div>
            )}

            {view === 'fog' && socialEnabled && !socialPermanentlyDisabled && (
              <motion.div key="fog" variants={pageVariants} initial="initial" animate="enter" exit="exit">
                <PoeticErrorBoundary>
                  <PublicFogView onAction={overload.recordAction} appMood={appMood} />
                </PoeticErrorBoundary>
              </motion.div>
            )}

            {view === 'fog' && !socialEnabled && !socialPermanentlyDisabled && (
              <motion.div
                key="disabled"
                variants={pageVariants}
                initial="initial"
                animate="enter"
                exit="exit"
                className="flex items-center justify-center min-h-[60vh]"
              >
                <motion.button
                  onClick={toggleSocial}
                  className="text-muted-foreground/30 font-thought text-sm tracking-wider hover:text-muted-foreground/50 transition-all duration-700"
                  whileTap={{ scale: 0.95 }}
                >
                  ☁
                </motion.button>
              </motion.div>
            )}

            {view === 'settings' && (
              <motion.div key="settings" variants={pageVariants} initial="initial" animate="enter" exit="exit">
                <PoeticErrorBoundary>
                  <SettingsView
                    onReplayIntro={handleReplayIntro}
                    audio={audio}
                    appMood={appMood}
                    identity={identity}
                  />
                </PoeticErrorBoundary>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom navigation */}
        <BottomNav
          view={view}
          onViewChange={handleViewChange}
          socialEnabled={socialEnabled}
          socialPermanentlyDisabled={socialPermanentlyDisabled}
        />
      </div>
    </PoeticErrorBoundary>
  );
};

export default Index;
