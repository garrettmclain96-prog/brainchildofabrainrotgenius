// Core data models for Brainchild — Public Fog

export type DecayMode = 'clean' | 'rot';
export type Visibility = 'private' | 'public';
export type DecaySpeed = 'normal' | 'fast' | 'sink';

export interface Thought {
  id: string;
  content: string;
  createdAt: Date;
  decayLevel: number; // 0-100, where 100 is fully decayed
  mode: DecayMode;
  visibility: Visibility;
  expiresAt: Date;
  decaySpeed: DecaySpeed;
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

// Echo decay is always faster than thoughts
export const ECHO_DECAY_DURATION = 10; // 10 minutes

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
  
  return chars.map((char, index) => {
    // More characters get affected as decay increases
    if (Math.random() < decayFactor * 0.3) {
      // Replace with decay characters
      const decayChars = ['░', '▒', '▓', '·', '∙', ' ', '_', '.'];
      return decayChars[Math.floor(Math.random() * decayChars.length)];
    }
    return char;
  }).join('');
}
