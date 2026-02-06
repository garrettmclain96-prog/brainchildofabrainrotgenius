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
import { FogBackground } from '@/components/FogBackground';
import { PublicFogView } from '@/components/PublicFogView';
import { PrivateThoughtsView } from '@/components/PrivateThoughtsView';
import { SettingsView } from '@/components/SettingsView';
import { IntroScene } from '@/components/IntroScene';
import { LoadingScreen } from '@/components/LoadingScreen';
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
import { AppMoodIndicator } from '@/components/AppMoodIndicator';
import { BoredomOverlay } from '@/components/BoredomOverlay';
import { ExitInterviewOverlay } from '@/components/ExitInterviewOverlay';
import { DangerWarning, hasDismissedWarning } from '@/components/DangerWarning';
import { OneTimeWhisper } from '@/components/OneTimeWhisper';
import { TrueEndingScreen } from '@/components/TrueEndingScreen';

// Lazy load heavy 3D scene
const FogScene = lazy(() => import('@/components/three/FogScene').then((m) => ({ default: m.FogScene })));

type View = 'private' | 'fog' | 'settings';

const INTRO_SEEN_KEY = 'brainchild-intro-seen';
const LOADING_SEEN_KEY = 'brainchild-loading-seen';

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
  const { socialEnabled, socialPermanentlyDisabled, toggleSocial, privateThoughts } = useThoughtStore();
  const { mode } = useAppMode();
  const [showIntro, setShowIntro] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [is3DReady, setIs3DReady] = useState(false);
  const [showForbidden, setShowForbidden] = useState(false);
  const [showDangerWarning, setShowDangerWarning] = useState(!hasDismissedWarning());

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

  useEffect(() => {
    if (showDangerWarning) return;

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

    const timer = setTimeout(() => setIs3DReady(true), 2500);
    return () => clearTimeout(timer);
  }, [showDangerWarning]);

  useEffect(() => {
    if (activeEgg) haptics.discoveryPattern();
  }, [activeEgg, haptics]);

  const handleDangerWarningAccept = useCallback(() => {
    setShowDangerWarning(false);
  }, []);

  const handleLoadingComplete = useCallback(() => {
    sessionStorage.setItem(LOADING_SEEN_KEY, 'true');
    setShowLoading(false);
    if (!localStorage.getItem(INTRO_SEEN_KEY)) {
      setShowIntro(true);
    }
  }, []);

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

  // Danger Warning — first gate
  if (showDangerWarning) {
    return <DangerWarning onAccept={handleDangerWarningAccept} />;
  }

  // Quiet ending — inert state
  if (quietEnding.isInert) {
    return <QuietEndingScreen state={quietEnding} onDismiss={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Loading & Intro */}
      <AnimatePresence mode="wait">
        {showLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
      </AnimatePresence>
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
      <RareEventOverlay event={activeEvent} onDismiss={dismissEvent} />

      {/* Co-thinking presence */}
      <CoThinkingIndicator presence={coThinking} />

      {/* Cognitive hauntings */}
      <HauntingOverlay haunting={haunting} onDismiss={dismissHaunting} />

      {/* Temporal inversions */}
      <TemporalInversionOverlay inversion={inversion} onDismiss={dismissInversion} />

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

      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-30 safe-area-top">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <motion.h1
              className="font-thought text-[10px] text-muted-foreground/30 tracking-[0.25em] uppercase cursor-default select-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 1.2 }}
              onClick={() => setHeaderTaps((t) => t + 1)}
            >
              brainchild
            </motion.h1>
            <AppMoodIndicator moodState={appMood} />
          </div>
          <ModeToggle />
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 pt-10">
        <AnimatePresence mode="wait">
          {view === 'private' && (
            <motion.div key="private" variants={pageVariants} initial="initial" animate="enter" exit="exit">
              <PrivateThoughtsView
                onAction={overload.recordAction}
                appMood={appMood}
                drift={drift}
                identity={identity}
                consequences={consequences.consequences}
                onNearDeletion={exitInterview.recordNearDeletion}
                onRecordMark={consequences.recordMark}
              />
            </motion.div>
          )}

          {view === 'fog' && socialEnabled && !socialPermanentlyDisabled && (
            <motion.div key="fog" variants={pageVariants} initial="initial" animate="enter" exit="exit">
              <PublicFogView onAction={overload.recordAction} appMood={appMood} />
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
              <p className="text-muted-foreground/40 font-thought text-sm mb-4 tracking-wide">the social layer is dormant</p>
              <motion.button
                onClick={toggleSocial}
                className="px-5 py-2.5 rounded-xl bg-primary/8 text-primary/70 hover:bg-primary/15 transition-all duration-700 text-sm font-thought tracking-wider"
                whileTap={{ scale: 0.95 }}
              >
                awaken the fog
              </motion.button>
            </motion.div>
          )}

          {view === 'settings' && (
            <motion.div key="settings" variants={pageVariants} initial="initial" animate="enter" exit="exit">
              <SettingsView
                onReplayIntro={handleReplayIntro}
                audio={audio}
                appMood={appMood}
                identity={identity}
                consequences={consequences.consequences}
              />
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
  );
};

export default Index;
