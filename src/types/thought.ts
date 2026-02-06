// Core data models for Brainchild — BrainRot Edition

export type DecayMode = 'clean' | 'rot';
export type AppMode = 'prune' | 'rot';
export type Visibility = 'private' | 'public';
export type DecaySpeed = 'normal' | 'fast' | 'sink';
export type FragmentCategory = 'ideas' | 'tasks' | 'journal' | 'projects' | 'uncategorized';

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
  lastWateredAt?: Date; // "Watering" resets decay timer
  waterCount: number; // How many times this thought has been revisited
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
  sink: 5,       // 5 minutes - for things you want gone quickly
};

// Private thought decay (24h default, extended by watering)
export const PRIVATE_DECAY_DURATION = 24 * 60; // 24 hours in minutes

// Echo decay is always faster than thoughts
export const ECHO_DECAY_DURATION = 10; // 10 minutes

// Watering extends life by this multiplier
export const WATER_EXTENSION_MINUTES = 60; // Each watering adds 1 hour

// Category metadata
export const CATEGORY_META: Record<FragmentCategory, { label: string; icon: string; color: string }> = {
  ideas: { label: 'ideas', icon: '💡', color: 'primary' },
  tasks: { label: 'tasks', icon: '◯', color: 'accent' },
  journal: { label: 'journal', icon: '📖', color: 'echo' },
  projects: { label: 'projects', icon: '🧩', color: 'decay-fresh' },
  uncategorized: { label: 'all', icon: '·', color: 'muted-foreground' },
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
  const decayFactor = (decayLevel - 25) / 75; // 0-1 scale after 25%
  
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
      // Swap with next word
      const temp = words[i + 1];
      words[i + 1] = word;
      return temp;
    }
    return word;
  }).join(' ');
}

// Farewell messages for dissolve
export const FAREWELL_MESSAGES = [
  "rot to root. decay to dream.",
  "the compost of genius returns to earth.",
  "every thought was a seed. some were meant to dissolve.",
  "brainrot is not failure. it is the garden composting.",
  "you are lighter now.",
  "the fog clears. the mind breathes.",
  "nothing was lost. everything became something else.",
];
