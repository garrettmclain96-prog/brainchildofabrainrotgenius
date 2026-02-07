import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThoughtStore } from '@/stores/thoughtStore';
import { useAppMode } from '@/hooks/useAppMode';
import { useEasterEggs } from '@/hooks/useEasterEggs';
import { useOverloadSensor } from '@/hooks/useOverloadSensor';
import { useOvernightSynthesis } from '@/hooks/useOvernightSynthesis';
import { useAmbientAudio } from '@/hooks/useAmbientAudio';
import { useHaptics } from '@/hooks/useHaptics';
import { useMemoryDrift } from '@/hooks/useMemoryDrift';
import { useRareCognitiveEvents } from '@/hooks/useRareCognitiveEvents';
import { useQuietEnding } from '@/hooks/useQuietEnding';
import { useCoThinking } from '@/hooks/useCoThinking';
import { useAppMoods } from '@/hooks/useAppMoods';
import { useCognitiveHauntings } from '@/hooks/useCognitiveHauntings';
import { useTemporalInversions } from '@/hooks/useTemporalInversions';
import { useIntentionalBoredom } from '@/hooks/useIntentionalBoredom';
import { useExitInterview } from '@/hooks/useExitInterview';
import { usePerceptualDrift } from '@/hooks/usePerceptualDrift';
import { usePermanentConsequences } from '@/hooks/usePermanentConsequences';
import { useIdentityDrift } from '@/hooks/useIdentityDrift';
import { useTrueEnding } from '@/hooks/useTrueEnding';
import { PoeticErrorBoundary } from '@/components/PoeticErrorBoundary';
import { FogBackground } from '@/components/FogBackground';
import { PublicFogView } from '@/components/PublicFogView';
import { PrivateThoughtsView } from '@/components/PrivateThoughtsView';
import { SettingsView } from '@/components/SettingsView';
import { IntroScene } from '@/components/IntroScene';
import { BottomNav } from '@/components/BottomNav';
import { ModeToggle } from '@/components/ModeToggle';
import { SystemKoan } from '@/components/SystemKoan';
import { OverloadOverlay } from '@/components/OverloadOverlay';
import { OvernightSynthesisOverlay } from '@/components/OvernightSynthesis';
import { RareEventOverlay } from '@/components/RareEventOverlay';
import { QuietEndingScreen } from '@/components/QuietEndingScreen';
import { CoThinkingIndicator } from '@/components/CoThinkingIndicator';
import { EndOfDayCompost } from '@/components/EndOfDayCompost';
import { ForbiddenScreen } from '@/components/ForbiddenScreen';
import { HauntingOverlay } from '@/components/HauntingOverlay';
import { TemporalInversionOverlay } from '@/components/TemporalInversionOverlay';

import { BoredomOverlay } from '@/components/BoredomOverlay';
import { ExitInterviewOverlay } from '@/components/ExitInterviewOverlay';

import { OneTimeWhisper } from '@/components/OneTimeWhisper';
import { TrueEndingScreen } from '@/components/TrueEndingScreen';

// Lazy load heavy 3D scene — deferred for performance
const FogScene = lazy(() => import('@/components/three/FogScene').then((m) => ({ default: m.FogScene })));

type View = 'private' | 'fog' | 'settings';

const INTRO_SEEN_KEY = 'brainchild-intro-seen';

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
  const [showIntro, setShowIntro] = useState(false);
  const [is3DReady, setIs3DReady] = useState(false);
  const [showForbidden, setShowForbidden] = useState(false);
  

  // Sensory systems
  const audio = useAmbientAudio();
  const haptics = useHaptics();
  const { activeEgg, dismissEgg } = useEasterEggs(privateThoughts);
  const overload = useOverloadSensor();
  const synthesis = useOvernightSynthesis(privateThoughts);

  // Cognitive systems
  useMemoryDrift();
  const { activeEvent, dismissEvent } = useRareCognitiveEvents(privateThoughts);
  const quietEnding = useQuietEnding();
  const coThinking = useCoThinking(privateThoughts.length);

  // Sentient systems
  const appMood = useAppMoods();
  const { haunting, dismissHaunting } = useCognitiveHauntings(privateThoughts);
  const { inversion, dismissInversion } = useTemporalInversions(privateThoughts);
  const boredom = useIntentionalBoredom();
  const exitInterview = useExitInterview();
  const drift = usePerceptualDrift();

  // Irreversibility layer
  const consequences = usePermanentConsequences(privateThoughts);
  const identity = useIdentityDrift(privateThoughts);
  const trueEnding = useTrueEnding(privateThoughts.length);

  // Forbidden screen — 5-tap on header
  const [headerTaps, setHeaderTaps] = useState(0);
  useEffect(() => {
    if (headerTaps >= 5) {
      setShowForbidden(true);
      setHeaderTaps(0);
      consequences.recordMark('hasSeenForbiddenScreen');
    }
    if (headerTaps > 0) {
      const timer = setTimeout(() => setHeaderTaps(0), 2000);
      return () => clearTimeout(timer);
    }
  }, [headerTaps, consequences]);

  // Load notes from database on mount
  useEffect(() => {
    loadFromDB();
  }, [loadFromDB]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'intro') {
      localStorage.removeItem(INTRO_SEEN_KEY);
      window.history.replaceState({}, '', '/');
      setShowIntro(true);
      return;
    }

    if (!localStorage.getItem(INTRO_SEEN_KEY)) {
      setShowIntro(true);
    }

    const timer = setTimeout(() => setIs3DReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activeEgg) haptics.discoveryPattern();
  }, [activeEgg, haptics]);


  const handleIntroComplete = useCallback(() => {
    localStorage.setItem(INTRO_SEEN_KEY, 'true');
    setShowIntro(false);
  }, []);

  const handleReplayIntro = useCallback(() => {
    localStorage.removeItem(INTRO_SEEN_KEY);
    setShowIntro(true);
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

  // True Ending — graduation
  if (trueEnding.phase === 'complete') {
    return <TrueEndingScreen phase="complete" onBegin={() => {}} onAccept={() => {}} onDecline={() => {}} />;
  }

  // Quiet ending — inert state
  if (quietEnding.isInert) {
    return <QuietEndingScreen state={quietEnding} onDismiss={() => {}} />;
  }

  return (
    <PoeticErrorBoundary>
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Intro — max 3 screens, no loading gate */}
        <AnimatePresence mode="wait">
          {showIntro && <IntroScene onComplete={handleIntroComplete} />}
        </AnimatePresence>

        {/* True Ending — offering / ceremony */}
        {(trueEnding.phase === 'offering' || trueEnding.phase === 'ceremony') && (
          <TrueEndingScreen
            phase={trueEnding.phase}
            onBegin={trueEnding.beginCompletion}
            onAccept={() => {
              consequences.recordMark('completionAccepted');
              trueEnding.acceptCompletion();
            }}
            onDecline={trueEnding.declineCompletion}
          />
        )}

        {/* Quiet ending — welcome back */}
        {quietEnding.isActive && !quietEnding.isInert && (
          <QuietEndingScreen state={quietEnding} onDismiss={() => {}} />
        )}

        {/* Background layers */}
        <FogBackground />
        <Suspense fallback={null}>{is3DReady && <FogScene />}</Suspense>

        {/* Film grain & vignette */}
        <div className="noise-overlay" />
        <div className="vignette" />

        {/* One-time whispers (permanent consequences) */}
        <OneTimeWhisper whisper={consequences.oneTimeWhisper} onDismiss={consequences.dismissWhisper} />

        {/* Easter eggs */}
        <SystemKoan egg={activeEgg} onDismiss={dismissEgg} />

        {/* Rare cognitive events */}
        <PoeticErrorBoundary silent>
          <RareEventOverlay event={activeEvent} onDismiss={dismissEvent} />
        </PoeticErrorBoundary>

        {/* Co-thinking presence */}
        <CoThinkingIndicator presence={coThinking} />

        {/* Cognitive hauntings */}
        <PoeticErrorBoundary silent>
          <HauntingOverlay haunting={haunting} onDismiss={dismissHaunting} />
        </PoeticErrorBoundary>

        {/* Temporal inversions */}
        <PoeticErrorBoundary silent>
          <TemporalInversionOverlay inversion={inversion} onDismiss={dismissInversion} />
        </PoeticErrorBoundary>

        {/* Intentional boredom */}
        <BoredomOverlay boredom={boredom} />

        {/* Exit interview */}
        <ExitInterviewOverlay
          isOpen={exitInterview.shouldShow}
          onComplete={(answers) => {
            consequences.recordMark('interviewCompleted');
            exitInterview.completeInterview(answers);
          }}
          onDismiss={exitInterview.dismissInterview}
        />

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

        {/* Forbidden screen */}
        <ForbiddenScreen isOpen={showForbidden} onClose={() => setShowForbidden(false)} />

        {/* Top bar — minimal since PrivateThoughtsView has the title */}
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
                    drift={drift}
                    identity={identity}
                    consequences={consequences.consequences}
                    onNearDeletion={exitInterview.recordNearDeletion}
                    onRecordMark={consequences.recordMark}
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
                    consequences={consequences.consequences}
                  />
                </PoeticErrorBoundary>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Permanent whisper scar */}
        {consequences.consequences.scars.permanentWhisper && (
          <motion.div
            className="fixed top-14 right-4 z-20"
            animate={{ opacity: [0, 0.15, 0] }}
            transition={{ duration: 8, repeat: Infinity, repeatDelay: 30 }}
          >
            <span className="text-[8px] text-muted-foreground/10 font-thought italic">
              {consequences.consequences.scars.permanentWhisper}
            </span>
          </motion.div>
        )}

        {/* Bottom navigation */}
        <BottomNav
          view={view}
          onViewChange={handleViewChange}
          socialEnabled={socialEnabled}
          socialPermanentlyDisabled={socialPermanentlyDisabled}
          navOrder={drift.navOrder}
        />
      </div>
    </PoeticErrorBoundary>
  );
};

export default Index;
