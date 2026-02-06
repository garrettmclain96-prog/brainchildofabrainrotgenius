import { useState, useEffect, useMemo, useRef } from 'react';
import { Thought } from '@/types/thought';

/**
 * Identity Drift — The app slowly reflects who the user is becoming.
 * 
 * Analyzes writing patterns over time and adapts:
 * - Placeholder text in the composer
 * - Subtle prompt language shifts
 * - The app's "voice" when addressing the user
 * 
 * The mirror updates slower than the person. That lag is powerful.
 */

const IDENTITY_KEY = 'brainchild-identity-drift';

export type WritingTone = 'neutral' | 'introspective' | 'chaotic' | 'structured' | 'poetic' | 'urgent';
export type CognitiveProfile = 'explorer' | 'curator' | 'releaser' | 'hoarder' | 'ritualist';

export interface IdentityState {
  tone: WritingTone;
  profile: CognitiveProfile;
  dominantCategory: string;
  avgWordCount: number;
  velocityTrend: 'accelerating' | 'steady' | 'decelerating';
  
  // Adaptive prompts based on who they're becoming
  composerPlaceholder: string;
  appGreeting: string;
  dissolveSuggestion: string;
  
  // Historical snapshots (the "lag")
  previousTone: WritingTone | null;
  toneLastUpdated: number;
}

const TONE_PLACEHOLDERS: Record<WritingTone, string[]> = {
  neutral: ['capture a fragment...', 'what\'s on your mind?', 'a thought worth holding...'],
  introspective: ['what are you noticing?', 'go deeper...', 'what\'s underneath this?'],
  chaotic: ['let the chaos out...', 'don\'t think, just write...', 'spill it...'],
  structured: ['organize the signal...', 'what\'s the core idea?', 'name what matters...'],
  poetic: ['find the words...', 'what wants to be said?', 'the shape of this thought...'],
  urgent: ['get it down before it fades...', 'this feels important...', 'quick — before you forget...'],
};

const PROFILE_GREETINGS: Record<CognitiveProfile, string[]> = {
  explorer: ['you\'re mapping new territory', 'your mind is wandering — that\'s good', 'another direction today'],
  curator: ['your collection is carefully tended', 'you know what to keep', 'selective as always'],
  releaser: ['you let go easily. that\'s rare.', 'the fog receives what you give', 'lightening the load'],
  hoarder: ['you hold on tight. that\'s okay.', 'not everything needs to leave', 'these thoughts trust you'],
  ritualist: ['the ceremony calls', 'you return with intention', 'your practice deepens'],
};

const DISSOLVE_SUGGESTIONS: Record<CognitiveProfile, string> = {
  explorer: 'some paths need clearing to find new ones.',
  curator: 'even the best collections need pruning.',
  releaser: 'you already know how to do this.',
  hoarder: 'holding on is valid. so is letting go.',
  ritualist: 'this could be tonight\'s ceremony.',
};

function loadIdentity(): IdentityState | null {
  try {
    const data = localStorage.getItem(IDENTITY_KEY);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function saveIdentity(state: IdentityState) {
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(state));
}

function detectTone(thoughts: Thought[]): WritingTone {
  if (thoughts.length < 3) return 'neutral';
  
  const recentTexts = thoughts.slice(0, 10).map(t => t.content);
  const allText = recentTexts.join(' ').toLowerCase();
  const avgWords = recentTexts.reduce((sum, t) => sum + t.split(/\s+/).length, 0) / recentTexts.length;
  
  // Detect question marks (introspective)
  const questionRatio = recentTexts.filter(t => t.includes('?')).length / recentTexts.length;
  
  // Detect short bursts (chaotic/urgent)
  const shortBursts = recentTexts.filter(t => t.split(/\s+/).length < 8).length / recentTexts.length;
  
  // Detect structured language
  const structuredWords = ['because', 'therefore', 'however', 'specifically', 'actually', 'need to', 'should'];
  const structuredScore = structuredWords.filter(w => allText.includes(w)).length;
  
  // Detect poetic language
  const poeticWords = ['like', 'feels', 'maybe', 'almost', 'somehow', 'between', 'beneath', 'quietly'];
  const poeticScore = poeticWords.filter(w => allText.includes(w)).length;

  if (questionRatio > 0.4) return 'introspective';
  if (shortBursts > 0.6 && avgWords < 10) return 'chaotic';
  if (structuredScore >= 3) return 'structured';
  if (poeticScore >= 3) return 'poetic';
  if (shortBursts > 0.5) return 'urgent';
  return 'neutral';
}

function detectProfile(thoughts: Thought[]): CognitiveProfile {
  if (thoughts.length < 5) return 'explorer';
  
  const stats = getQuickStats();
  const categories = new Set(thoughts.map(t => t.category));
  const avgWaterCount = thoughts.reduce((sum, t) => sum + t.waterCount, 0) / thoughts.length;
  
  // High release ratio → releaser
  if (stats.totalReleased > stats.totalCreated * 0.4) return 'releaser';
  
  // High water count, keeps things alive → hoarder
  if (avgWaterCount > 2) return 'hoarder';
  
  // High dissolution count → ritualist
  if (stats.totalDissolved > stats.totalCreated * 0.5) return 'ritualist';
  
  // Many categories, diverse → explorer
  if (categories.size >= 4) return 'explorer';
  
  // Careful, moderate → curator
  return 'curator';
}

function getQuickStats() {
  try {
    const data = localStorage.getItem('brainchild-lifetime-stats');
    if (data) {
      const parsed = JSON.parse(data);
      return {
        totalCreated: parsed.totalCreated || 0,
        totalDissolved: parsed.totalDissolved || 0,
        totalWatered: parsed.totalWatered || 0,
        totalReleased: parsed.totalReleased || 0,
      };
    }
  } catch { /* ignore */ }
  return { totalCreated: 0, totalDissolved: 0, totalWatered: 0, totalReleased: 0 };
}

export function useIdentityDrift(thoughts: Thought[]): IdentityState {
  const [identity, setIdentity] = useState<IdentityState>(() => {
    const saved = loadIdentity();
    if (saved) return saved;
    
    return {
      tone: 'neutral',
      profile: 'explorer',
      dominantCategory: 'uncategorized',
      avgWordCount: 0,
      velocityTrend: 'steady',
      composerPlaceholder: TONE_PLACEHOLDERS.neutral[0],
      appGreeting: PROFILE_GREETINGS.explorer[0],
      dissolveSuggestion: DISSOLVE_SUGGESTIONS.explorer,
      previousTone: null,
      toneLastUpdated: 0,
    };
  });
  
  const analysisRef = useRef(false);

  useEffect(() => {
    if (analysisRef.current || thoughts.length < 3) return;
    analysisRef.current = true;

    // Only update identity every 6 hours (the lag is intentional)
    const now = Date.now();
    if (now - identity.toneLastUpdated < 6 * 60 * 60_000 && identity.toneLastUpdated > 0) return;

    const newTone = detectTone(thoughts);
    const newProfile = detectProfile(thoughts);
    
    // Find dominant category
    const catCounts: Record<string, number> = {};
    thoughts.forEach(t => { catCounts[t.category] = (catCounts[t.category] || 0) + 1; });
    const dominantCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'uncategorized';
    
    // Calculate velocity trend
    const recentCount = thoughts.filter(t => Date.now() - t.createdAt.getTime() < 24 * 60 * 60_000).length;
    const olderCount = thoughts.filter(t => {
      const age = Date.now() - t.createdAt.getTime();
      return age >= 24 * 60 * 60_000 && age < 48 * 60 * 60_000;
    }).length;
    const velocityTrend = recentCount > olderCount + 2 ? 'accelerating' : recentCount < olderCount - 2 ? 'decelerating' : 'steady';

    const placeholders = TONE_PLACEHOLDERS[newTone];
    const greetings = PROFILE_GREETINGS[newProfile];

    const newIdentity: IdentityState = {
      tone: newTone,
      profile: newProfile,
      dominantCategory,
      avgWordCount: thoughts.reduce((sum, t) => sum + t.content.split(/\s+/).length, 0) / thoughts.length,
      velocityTrend,
      composerPlaceholder: placeholders[Math.floor(Math.random() * placeholders.length)],
      appGreeting: greetings[Math.floor(Math.random() * greetings.length)],
      dissolveSuggestion: DISSOLVE_SUGGESTIONS[newProfile],
      previousTone: identity.tone !== newTone ? identity.tone : identity.previousTone,
      toneLastUpdated: now,
    };

    saveIdentity(newIdentity);
    setIdentity(newIdentity);
  }, [thoughts, identity.tone, identity.previousTone, identity.toneLastUpdated]);

  return identity;
}
