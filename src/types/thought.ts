// Core data models for Brainchild — BrainRot Edition

export type DecayMode = 'clean' | 'rot';
export type AppMode = 'prune' | 'rot';
export type Visibility = 'private' | 'public';
export type DecaySpeed = 'normal' | 'fast' | 'sink';
export type FragmentCategory = 'ideas' | 'tasks' | 'journal' | 'projects' | 'uncategorized';

// All 15 discoverable rooms
export type ThoughtZone =
  | 'overflow'
  | 'quiet'
  | 'noise'
  | 'unclaimed'
  | 'preserved'
  | 'backlog'
  | 'late-night'
  | 'almost-gone'
  | 'quiet-period'
  | 'flood'
  | 'heavy'
  | 'discarded'
  | 'rare'
  | 'static'
  | 'leaving';

export interface Thought {
  id: string;
  content: string;
  createdAt: Date;
  decayLevel: number; // 0-100, where 100 is fully decayed
  mode: DecayMode;
  visibility: Visibility;
  expiresAt: Date;
  decaySpeed: DecaySpeed;
  category: FragmentCategory;
  lastWateredAt?: Date;
  waterCount: number;
  starred: boolean;
  zone?: ThoughtZone;
}

export interface Echo {
  id: string;
  thoughtId: string;
  fragmentText: string;
  createdAt: Date;
  expiresAt: Date;
}

// Decay speed configurations (in minutes)
export const DECAY_DURATIONS: Record<DecaySpeed, number> = {
  normal: 60,    // 1 hour
  fast: 15,      // 15 minutes
  sink: 5,       // 5 minutes
};

export const PRIVATE_DECAY_DURATION = 24 * 60;
export const ECHO_DECAY_DURATION = 10;
export const WATER_EXTENSION_MINUTES = 60;

// Category metadata
export const CATEGORY_META: Record<FragmentCategory, { label: string; icon: string; color: string }> = {
  ideas: { label: 'ideas', icon: '~', color: 'primary' },
  tasks: { label: 'tasks', icon: ':', color: 'accent' },
  journal: { label: 'journal', icon: '—', color: 'echo' },
  projects: { label: 'projects', icon: '+', color: 'decay-fresh' },
  uncategorized: { label: 'all', icon: '·', color: 'muted-foreground' },
};

// ───── Zone metadata — 15 pre-existing rooms users discover ─────

export interface ZoneMeta {
  label: string;
  description: string;
  icon: string;
  decayBehavior: 'fast' | 'slow' | 'very-fast' | 'medium' | 'none' | 'variable' | 'time-based' | 'immediate' | 'frozen' | 'burst' | 'accelerated' | 'random' | 'timed';
  specialRule?: string;
  canSave: boolean;
  canCompose: boolean;
  hidden?: boolean; // rooms that appear unpredictably
}

export const ZONE_META: Record<ThoughtZone, ZoneMeta> = {
  overflow: {
    label: 'overflow',
    description: 'thoughts that no one wanted to keep',
    icon: '≋',
    decayBehavior: 'fast',
    specialRule: 'auto-delete',
    canSave: true,
    canCompose: true,
  },
  quiet: {
    label: 'quiet ones',
    description: 'short, heavy, rarely saved',
    icon: '·',
    decayBehavior: 'slow',
    specialRule: 'minimal UI',
    canSave: true,
    canCompose: true,
  },
  noise: {
    label: 'noise',
    description: 'impulsive, messy, fast-decay',
    icon: '⌇',
    decayBehavior: 'very-fast',
    specialRule: 'visual jitter',
    canSave: true,
    canCompose: true,
  },
  unclaimed: {
    label: 'unclaimed',
    description: 'anonymous, untouched',
    icon: '◌',
    decayBehavior: 'medium',
    specialRule: 'no saves allowed',
    canSave: false,
    canCompose: false,
  },
  preserved: {
    label: 'preserved',
    description: 'rare saved fragments',
    icon: '◈',
    decayBehavior: 'none',
    specialRule: 'locked',
    canSave: false,
    canCompose: false,
  },
  backlog: {
    label: 'the backlog',
    description: 'where overthinkers accumulate',
    icon: '▤',
    decayBehavior: 'variable',
    specialRule: 'too many thoughts = faster rot',
    canSave: true,
    canCompose: true,
  },
  'late-night': {
    label: 'late night',
    description: 'emotional thoughts',
    icon: '☽',
    decayBehavior: 'time-based',
    specialRule: 'faster decay during daytime',
    canSave: true,
    canCompose: true,
  },
  'almost-gone': {
    label: 'almost gone',
    description: 'last chance decisions',
    icon: '◠',
    decayBehavior: 'immediate',
    specialRule: 'no editing allowed',
    canSave: true,
    canCompose: false,
  },
  'quiet-period': {
    label: 'the quiet period',
    description: 'frozen in time',
    icon: '▫',
    decayBehavior: 'frozen',
    specialRule: 'rarely updates',
    canSave: false,
    canCompose: false,
  },
  flood: {
    label: 'the flood',
    description: 'overwhelm simulation',
    icon: '▓',
    decayBehavior: 'burst',
    specialRule: 'thoughts arrive in bursts',
    canSave: true,
    canCompose: true,
  },
  heavy: {
    label: 'heavy',
    description: 'saving has a cost',
    icon: '▼',
    decayBehavior: 'accelerated',
    specialRule: 'saving increases decay speed elsewhere',
    canSave: true,
    canCompose: true,
  },
  discarded: {
    label: 'discarded',
    description: 'cultural memory',
    icon: '⊘',
    decayBehavior: 'none',
    specialRule: 'view-only, ghost content',
    canSave: false,
    canCompose: false,
  },
  rare: {
    label: 'rare',
    description: 'mystery',
    icon: '✧',
    decayBehavior: 'random',
    specialRule: 'appears unpredictably',
    canSave: true,
    canCompose: false,
    hidden: true,
  },
  static: {
    label: 'static',
    description: 'myth',
    icon: '■',
    decayBehavior: 'none',
    specialRule: 'one thought only',
    canSave: false,
    canCompose: false,
  },
  leaving: {
    label: 'leaving',
    description: 'closure',
    icon: '⟶',
    decayBehavior: 'timed',
    specialRule: 'exit-triggered',
    canSave: false,
    canCompose: false,
    hidden: true,
  },
};

// Visible rooms (non-hidden) in discovery order
export const VISIBLE_ZONES: ThoughtZone[] = [
  'overflow', 'quiet', 'noise', 'unclaimed', 'preserved',
  'backlog', 'late-night', 'almost-gone', 'quiet-period',
  'flood', 'heavy', 'discarded', 'static',
];

// All zones including hidden
export const ALL_ZONES: ThoughtZone[] = [
  ...VISIBLE_ZONES, 'rare', 'leaving',
];

// Pattern language per zone — soft norms, not stats
export const ZONE_PATTERNS: Record<ThoughtZone, string[]> = {
  overflow: [
    'most people let this go.',
    'this room fills faster than it empties.',
    'nothing here was meant to stay.',
    'the overflow doesn\'t judge.',
  ],
  quiet: [
    'very few thoughts survive here.',
    'this room rarely updates.',
    'the quiet ones tend to stay longer.',
    'heaviness is not the same as importance.',
  ],
  noise: [
    'this room empties quickly.',
    'most of this will be gone by morning.',
    'speed doesn\'t mean urgency.',
    'the noise is always temporary.',
  ],
  unclaimed: [
    'no one has touched these.',
    'saving is not allowed here.',
    'they arrived without owners.',
    'some things were never meant to be kept.',
  ],
  preserved: [
    'something kept this alive.',
    'survival here is rare and unexplained.',
    'not everything that lasts deserves to.',
    'preservation is not the same as meaning.',
  ],
  backlog: [
    'too many thoughts makes everything rot faster.',
    'this room punishes accumulation.',
    'the more you hold, the less you keep.',
    'clutter has a cost here.',
  ],
  'late-night': [
    'these thoughts arrived after dark.',
    'daylight makes them decay faster.',
    'the night is kinder to heavy thoughts.',
    'this room forgets by morning.',
  ],
  'almost-gone': [
    'these have less than 10% remaining.',
    'last chance. no editing.',
    'most people don\'t save in time.',
    'the decision is final here.',
  ],
  'quiet-period': [
    'decay is frozen here.',
    'this room rarely changes.',
    'from an earlier version.',
    'time stopped in this room.',
  ],
  flood: [
    'everything arrives at once.',
    'the volume is the point.',
    'most of this will be gone in minutes.',
    'overwhelm is not the same as importance.',
  ],
  heavy: [
    'saving here costs you elsewhere.',
    'weight is redistributed, not removed.',
    'the tradeoff is always present.',
    'holding on has consequences.',
  ],
  discarded: [
    'these were intentionally let go.',
    'ghost content. view only.',
    'someone decided these weren\'t worth keeping.',
    'the graveyard has its own beauty.',
  ],
  rare: [
    'this room appears unpredictably.',
    'algorithm-selected. reason unknown.',
    'not everyone sees this room.',
    'rarity is not the same as value.',
  ],
  static: [
    'this one doesn\'t decay.',
    'one thought. no more.',
    'the myth room.',
    'never explained.',
  ],
  leaving: [
    'these appear when you\'re about to leave.',
    'closure is optional.',
    'the exit is also an entrance.',
    'what you leave behind stays.',
  ],
};

// Helper to calculate decay level based on time
export function calculateDecayLevel(createdAt: Date, expiresAt: Date): number {
  const now = Date.now();
  const created = createdAt.getTime();
  const expires = expiresAt.getTime();
  
  const totalDuration = expires - created;
  const elapsed = now - created;
  
  if (elapsed <= 0) return 0;
  if (elapsed >= totalDuration) return 100;
  
  return Math.round((elapsed / totalDuration) * 100);
}

// Get decay state category for styling
export function getDecayState(decayLevel: number): 'fresh' | 'fading' | 'rotting' | 'extinct' {
  if (decayLevel < 25) return 'fresh';
  if (decayLevel < 50) return 'fading';
  if (decayLevel < 75) return 'rotting';
  return 'extinct';
}

// Apply text decay effects for rot mode
export function applyRotEffect(text: string, decayLevel: number): string {
  if (decayLevel < 25) return text;
  
  const chars = text.split('');
  const decayFactor = (decayLevel - 25) / 75;
  
  return chars.map((char) => {
    if (Math.random() < decayFactor * 0.3) {
      const decayChars = ['░', '▒', '▓', '·', '∙', ' ', '_', '.'];
      return decayChars[Math.floor(Math.random() * decayChars.length)];
    }
    return char;
  }).join('');
}

// Apply word rearrangement for advanced decay
export function applyWordDecay(text: string, decayLevel: number): string {
  if (decayLevel < 40) return text;
  
  const words = text.split(' ');
  const shuffleFactor = (decayLevel - 40) / 60;
  
  return words.map((word, i) => {
    if (Math.random() < shuffleFactor * 0.2 && i < words.length - 1) {
      const temp = words[i + 1];
      words[i + 1] = word;
      return temp;
    }
    return word;
  }).join(' ');
}

// Farewell messages for dissolve
export const FAREWELL_MESSAGES = [
  "the space is clear now.",
  "what was here has returned to where it came from.",
  "nothing was lost. it simply ceased to be held.",
  "the container is empty. that is not the same as nothing.",
  "done.",
];
