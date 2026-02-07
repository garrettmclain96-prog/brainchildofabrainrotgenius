import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Thought, DecayMode, DecaySpeed, FragmentCategory, PRIVATE_DECAY_DURATION, WATER_EXTENSION_MINUTES, DECAY_DURATIONS, calculateDecayLevel } from '@/types/thought';
import { incrementStat } from '@/components/ForbiddenScreen';

interface ThoughtStore {
  // Private thoughts (stored locally)
  privateThoughts: Thought[];
  
  // Settings
  socialEnabled: boolean;
  socialPermanentlyDisabled: boolean;
  
  // Actions
  addPrivateThought: (content: string, mode: DecayMode, category?: FragmentCategory) => void;
  deletePrivateThought: (id: string) => void;
  waterThought: (id: string) => void;
  starThought: (id: string) => void;
  releaseToFog: (id: string, decaySpeed: DecaySpeed) => Thought | null;
  toggleSocial: () => void;
  nuclearDisableSocial: () => void;
  dissolveEverything: () => void;
  
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

      addPrivateThought: (content, mode, category = 'uncategorized') => {
        const now = new Date();
        const thought: Thought = {
          id: generateId(),
          content,
          createdAt: now,
          decayLevel: 0,
          mode,
          visibility: 'private',
          expiresAt: new Date(now.getTime() + PRIVATE_DECAY_DURATION * 60 * 1000),
          decaySpeed: 'normal',
          category,
          waterCount: 0,
          starred: false,
        };
        
        incrementStat('totalCreated');
        
        set((state) => ({
          privateThoughts: [thought, ...state.privateThoughts],
        }));
      },

      deletePrivateThought: (id) => {
        incrementStat('totalDissolved');
        set((state) => ({
          privateThoughts: state.privateThoughts.filter((t) => t.id !== id),
        }));
      },

      waterThought: (id) => {
        incrementStat('totalWatered');
        set((state) => ({
          privateThoughts: state.privateThoughts.map((t) => {
            if (t.id !== id) return t;
            const now = new Date();
            return {
              ...t,
              lastWateredAt: now,
              waterCount: t.waterCount + 1,
              // Extend expiration by WATER_EXTENSION_MINUTES
              expiresAt: new Date(t.expiresAt.getTime() + WATER_EXTENSION_MINUTES * 60 * 1000),
              // Reduce decay level slightly
              decayLevel: Math.max(0, t.decayLevel - 15),
            };
          }),
        }));
      },

      starThought: (id) => {
        set((state) => ({
          privateThoughts: state.privateThoughts.map((t) => {
            if (t.id !== id) return t;
            const isNowStarred = !t.starred;
            // When starring, extend expiration massively (48h); when unstarring, revert to normal
            const extension = isNowStarred ? 48 * 60 * 60 * 1000 : 0;
            return {
              ...t,
              starred: isNowStarred,
              expiresAt: isNowStarred
                ? new Date(t.expiresAt.getTime() + extension)
                : t.expiresAt,
              decayLevel: isNowStarred ? Math.max(0, t.decayLevel - 20) : t.decayLevel,
            };
          }),
        }));
      },

      releaseToFog: (id, decaySpeed) => {
        const thought = get().privateThoughts.find((t) => t.id === id);
        if (!thought) return null;
        
        incrementStat('totalReleased');
        
        const now = new Date();
        const publicThought: Thought = {
          ...thought,
          id: generateId(),
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

      dissolveEverything: () => {
        set({
          privateThoughts: [],
        });
      },

      updateDecayLevels: () => {
        set((state) => ({
          privateThoughts: state.privateThoughts.map((thought) => ({
            ...thought,
            // Starred thoughts decay at 1/10th speed
            decayLevel: thought.starred
              ? Math.min(thought.decayLevel, calculateDecayLevel(thought.createdAt, thought.expiresAt))
              : calculateDecayLevel(thought.createdAt, thought.expiresAt),
          })),
        }));
      },

      removeExpiredThoughts: () => {
        const now = Date.now();
        set((state) => ({
          privateThoughts: state.privateThoughts.filter(
            // Starred thoughts never expire automatically
            (t) => t.starred || t.expiresAt.getTime() > now
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
          lastWateredAt: t.lastWateredAt?.toISOString(),
        })),
        socialEnabled: state.socialEnabled,
        socialPermanentlyDisabled: state.socialPermanentlyDisabled,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.privateThoughts = state.privateThoughts.map((t: any) => ({
            ...t,
            createdAt: new Date(t.createdAt),
            expiresAt: new Date(t.expiresAt),
            lastWateredAt: t.lastWateredAt ? new Date(t.lastWateredAt) : undefined,
            category: t.category || 'uncategorized',
            waterCount: t.waterCount || 0,
            starred: t.starred || false,
          }));
        }
      },
    }
  )
);
