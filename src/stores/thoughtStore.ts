import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Thought, DecayMode, DecaySpeed, DECAY_DURATIONS, calculateDecayLevel } from '@/types/thought';

interface ThoughtStore {
  // Private thoughts (stored locally)
  privateThoughts: Thought[];
  
  // Settings
  socialEnabled: boolean;
  socialPermanentlyDisabled: boolean;
  
  // Actions
  addPrivateThought: (content: string, mode: DecayMode) => void;
  deletePrivateThought: (id: string) => void;
  releaseToFog: (id: string, decaySpeed: DecaySpeed) => Thought | null;
  toggleSocial: () => void;
  nuclearDisableSocial: () => void;
  
  // Decay management
  updateDecayLevels: () => void;
  removeExpiredThoughts: () => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useThoughtStore = create<ThoughtStore>()(
  persist(
    (set, get) => ({
      privateThoughts: [],
      socialEnabled: false,
      socialPermanentlyDisabled: false,

      addPrivateThought: (content, mode) => {
        const now = new Date();
        const thought: Thought = {
          id: generateId(),
          content,
          createdAt: now,
          decayLevel: 0,
          mode,
          visibility: 'private',
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24h for private
          decaySpeed: 'normal',
        };
        
        set((state) => ({
          privateThoughts: [thought, ...state.privateThoughts],
        }));
      },

      deletePrivateThought: (id) => {
        set((state) => ({
          privateThoughts: state.privateThoughts.filter((t) => t.id !== id),
        }));
      },

      releaseToFog: (id, decaySpeed) => {
        const thought = get().privateThoughts.find((t) => t.id === id);
        if (!thought) return null;
        
        const now = new Date();
        const publicThought: Thought = {
          ...thought,
          id: generateId(), // New ID for public version
          visibility: 'public',
          decaySpeed,
          createdAt: now,
          expiresAt: new Date(now.getTime() + DECAY_DURATIONS[decaySpeed] * 60 * 1000),
          decayLevel: 0,
        };
        
        return publicThought;
      },

      toggleSocial: () => {
        const { socialPermanentlyDisabled } = get();
        if (socialPermanentlyDisabled) return;
        
        set((state) => ({
          socialEnabled: !state.socialEnabled,
        }));
      },

      nuclearDisableSocial: () => {
        set({
          socialEnabled: false,
          socialPermanentlyDisabled: true,
        });
      },

      updateDecayLevels: () => {
        set((state) => ({
          privateThoughts: state.privateThoughts.map((thought) => ({
            ...thought,
            decayLevel: calculateDecayLevel(thought.createdAt, thought.expiresAt),
          })),
        }));
      },

      removeExpiredThoughts: () => {
        const now = Date.now();
        set((state) => ({
          privateThoughts: state.privateThoughts.filter(
            (t) => t.expiresAt.getTime() > now
          ),
        }));
      },
    }),
    {
      name: 'brainchild-thoughts',
      partialize: (state) => ({
        privateThoughts: state.privateThoughts.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
          expiresAt: t.expiresAt.toISOString(),
        })),
        socialEnabled: state.socialEnabled,
        socialPermanentlyDisabled: state.socialPermanentlyDisabled,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Rehydrate dates
          state.privateThoughts = state.privateThoughts.map((t: any) => ({
            ...t,
            createdAt: new Date(t.createdAt),
            expiresAt: new Date(t.expiresAt),
          }));
        }
      },
    }
  )
);
