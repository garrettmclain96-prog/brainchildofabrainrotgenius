import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Thought } from '@/types/thought';

/**
 * Permanent Consequences — Some choices cannot be undone.
 * 
 * - Some screens appear only once, ever
 * - Some modes cannot be re-entered once exited
 * - Certain milestones leave permanent marks on the experience
 * 
 * Not in a mean way — in a meaningful way.
 * People remember what costs them something.
 */

const CONSEQUENCES_KEY = 'brainchild-permanent-consequences';

export interface PermanentConsequences {
  // One-time screens — once seen, gone forever
  oneTimeScreensSeen: string[];
  
  // Permanent marks from significant actions
  marks: {
    firstDissolution: string | null;      // ISO date of first "dissolve everything"
    firstCeremony: string | null;         // ISO date of first forgetting ceremony
    totalDissolutions: number;
    hasSeenForbiddenScreen: boolean;
    hasUsedNuclearOption: boolean;
    firstFogRelease: string | null;
    rotModeFirstActivated: string | null;
    rotModeAbandoned: boolean;            // Left rot mode permanently (can't return)
    compassUsed: boolean;
    interviewCompleted: boolean;
    completionOffered: boolean;           // True ending was offered
    completionAccepted: boolean;          // They graduated
  };

  // Cognitive scars — permanent modifications to app behavior
  scars: {
    reducedDecayTime: boolean;      // After 3+ dissolutions, decay is permanently faster
    deeperHauntings: boolean;       // After seeing forbidden screen, hauntings are more intense
    permanentWhisper: string | null; // A phrase that permanently appears sometimes
  };
}

const DEFAULT_CONSEQUENCES: PermanentConsequences = {
  oneTimeScreensSeen: [],
  marks: {
    firstDissolution: null,
    firstCeremony: null,
    totalDissolutions: 0,
    hasSeenForbiddenScreen: false,
    hasUsedNuclearOption: false,
    firstFogRelease: null,
    rotModeFirstActivated: null,
    rotModeAbandoned: false,
    compassUsed: false,
    interviewCompleted: false,
    completionOffered: false,
    completionAccepted: false,
  },
  scars: {
    reducedDecayTime: false,
    deeperHauntings: false,
    permanentWhisper: null,
  },
};

function loadConsequences(): PermanentConsequences {
  try {
    const data = localStorage.getItem(CONSEQUENCES_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return { ...DEFAULT_CONSEQUENCES, ...parsed, marks: { ...DEFAULT_CONSEQUENCES.marks, ...parsed.marks }, scars: { ...DEFAULT_CONSEQUENCES.scars, ...parsed.scars } };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_CONSEQUENCES };
}

function saveConsequences(consequences: PermanentConsequences) {
  localStorage.setItem(CONSEQUENCES_KEY, JSON.stringify(consequences));
}

// One-time whispers that appear ONCE then never again
const ONE_TIME_WHISPERS = [
  { id: 'first-return', trigger: 'session-5', text: 'you came back. not everyone does.' },
  { id: 'tenth-thought', trigger: 'thought-10', text: 'ten thoughts in. you\'re building a mind here.' },
  { id: 'first-dissolution', trigger: 'dissolution-1', text: 'you let go. the app remembers this, even if you don\'t.' },
  { id: 'hundredth-thought', trigger: 'thought-100', text: 'one hundred fragments. some people never write that many in a lifetime.' },
  { id: 'week-anniversary', trigger: 'days-7', text: 'seven days. you\'re no longer a visitor.' },
  { id: 'month-mark', trigger: 'days-30', text: 'a month of thinking. the app is different now. so are you.' },
];

export function usePermanentConsequences(thoughts: Thought[]) {
  const [consequences, setConsequences] = useState<PermanentConsequences>(loadConsequences);
  const [oneTimeWhisper, setOneTimeWhisper] = useState<{ id: string; text: string } | null>(null);
  const checkedRef = useRef(false);

  // Check for one-time whisper triggers
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const c = loadConsequences();
    const stats = getBasicStats();

    for (const whisper of ONE_TIME_WHISPERS) {
      if (c.oneTimeScreensSeen.includes(whisper.id)) continue;

      let triggered = false;
      if (whisper.trigger === 'session-5' && stats.sessions >= 5) triggered = true;
      if (whisper.trigger === 'thought-10' && stats.totalCreated >= 10) triggered = true;
      if (whisper.trigger === 'thought-100' && stats.totalCreated >= 100) triggered = true;
      if (whisper.trigger === 'dissolution-1' && c.marks.totalDissolutions >= 1) triggered = true;
      if (whisper.trigger === 'days-7' && stats.daysSinceFirst >= 7) triggered = true;
      if (whisper.trigger === 'days-30' && stats.daysSinceFirst >= 30) triggered = true;

      if (triggered) {
        c.oneTimeScreensSeen.push(whisper.id);
        saveConsequences(c);
        setConsequences({ ...c });

        // Show after a delay
        setTimeout(() => {
          setOneTimeWhisper(whisper);
          setTimeout(() => setOneTimeWhisper(null), 8000);
        }, 10_000 + Math.random() * 30_000);
        break; // Only one per session
      }
    }
  }, []);

  const recordMark = useCallback((mark: keyof PermanentConsequences['marks'], value?: any) => {
    const c = loadConsequences();
    
    if (mark === 'totalDissolutions') {
      c.marks.totalDissolutions++;
      if (!c.marks.firstDissolution) c.marks.firstDissolution = new Date().toISOString();
      // Scar: after 3 dissolutions, decay becomes permanently faster
      if (c.marks.totalDissolutions >= 3) c.scars.reducedDecayTime = true;
    } else if (mark === 'hasSeenForbiddenScreen') {
      c.marks.hasSeenForbiddenScreen = true;
      c.scars.deeperHauntings = true;
    } else if (mark === 'firstCeremony' && !c.marks.firstCeremony) {
      c.marks.firstCeremony = new Date().toISOString();
    } else if (mark === 'firstFogRelease' && !c.marks.firstFogRelease) {
      c.marks.firstFogRelease = new Date().toISOString();
    } else if (mark === 'rotModeFirstActivated' && !c.marks.rotModeFirstActivated) {
      c.marks.rotModeFirstActivated = new Date().toISOString();
    } else if (mark === 'rotModeAbandoned') {
      c.marks.rotModeAbandoned = true;
    } else if (mark === 'hasUsedNuclearOption') {
      c.marks.hasUsedNuclearOption = true;
      c.scars.permanentWhisper = 'you chose silence once.';
    } else if (mark === 'compassUsed') {
      c.marks.compassUsed = true;
    } else if (mark === 'interviewCompleted') {
      c.marks.interviewCompleted = true;
    } else if (mark === 'completionOffered') {
      c.marks.completionOffered = true;
    } else if (mark === 'completionAccepted') {
      c.marks.completionAccepted = true;
    } else {
      (c.marks as any)[mark] = value ?? true;
    }
    
    saveConsequences(c);
    setConsequences({ ...c });
  }, []);

  const isRotLocked = consequences.marks.rotModeAbandoned;

  const dismissWhisper = useCallback(() => setOneTimeWhisper(null), []);

  return {
    consequences,
    oneTimeWhisper,
    dismissWhisper,
    recordMark,
    isRotLocked,
  };
}

// Helper to get basic stats from other localStorage keys
function getBasicStats() {
  let sessions = 0;
  let totalCreated = 0;
  let daysSinceFirst = 0;

  try {
    const exitData = localStorage.getItem('brainchild-exit-interview');
    if (exitData) {
      const parsed = JSON.parse(exitData);
      sessions = parsed.sessionsCount || 0;
      daysSinceFirst = parsed.firstSession 
        ? Math.floor((Date.now() - parsed.firstSession) / (24 * 60 * 60_000))
        : 0;
    }
  } catch { /* ignore */ }

  try {
    const statsData = localStorage.getItem('brainchild-lifetime-stats');
    if (statsData) {
      const parsed = JSON.parse(statsData);
      totalCreated = parsed.totalCreated || 0;
    }
  } catch { /* ignore */ }

  return { sessions, totalCreated, daysSinceFirst };
}
