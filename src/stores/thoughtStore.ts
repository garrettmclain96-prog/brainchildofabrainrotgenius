import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Thought, DecayMode, DecaySpeed, FragmentCategory, PRIVATE_DECAY_DURATION, WATER_EXTENSION_MINUTES, DECAY_DURATIONS, calculateDecayLevel } from '@/types/thought';
import { incrementStat } from '@/components/ForbiddenScreen';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId, isUUID } from '@/hooks/useSessionId';
import { useSyncStore } from '@/hooks/useSyncState';

interface ThoughtStore {
  // Private thoughts (local + DB synced)
  privateThoughts: Thought[];
  
  // Settings
  socialEnabled: boolean;
  socialPermanentlyDisabled: boolean;
  
  // DB sync state
  isDBLoaded: boolean;
  
  // Actions
  addPrivateThought: (content: string, mode: DecayMode, category?: FragmentCategory) => void;
  deletePrivateThought: (id: string) => void;
  waterThought: (id: string) => void;
  starThought: (id: string) => void;
  releaseToFog: (id: string, decaySpeed: DecaySpeed) => Thought | null;
  toggleSocial: () => void;
  nuclearDisableSocial: () => void;
  dissolveEverything: () => void;
  loadFromDB: () => Promise<void>;
  
  // Decay management
  updateDecayLevels: () => void;
  removeExpiredThoughts: () => void;
}

const generateId = () => crypto.randomUUID();

/** Tracked DB operation with automatic retry via sync store */
function syncToDB(id: string, action: () => Promise<void>) {
  useSyncStore.getState().trackOperation(id, action);
}

export const useThoughtStore = create<ThoughtStore>()(
  persist(
    (set, get) => ({
      privateThoughts: [],
      socialEnabled: false,
      socialPermanentlyDisabled: false,
      isDBLoaded: false,

      addPrivateThought: (content, mode, category = 'uncategorized') => {
        const now = new Date();
        const id = generateId();
        const expiresAt = new Date(now.getTime() + PRIVATE_DECAY_DURATION * 60 * 1000);
        
        const thought: Thought = {
          id,
          content,
          createdAt: now,
          decayLevel: 0,
          mode,
          visibility: 'private',
          expiresAt,
          decaySpeed: 'normal',
          category,
          waterCount: 0,
          starred: false,
        };
        
        incrementStat('totalCreated');
        set((state) => ({
          privateThoughts: [thought, ...state.privateThoughts],
        }));

        // Persist to database with retry
        const sessionId = getSessionId();
        syncToDB(`add-${id}`, async () => {
          const { error } = await supabase.from('private_notes').insert({
            id,
            session_id: sessionId,
            content,
            category,
            mode,
            expires_at: expiresAt.toISOString(),
          });
          if (error) throw error;
        });
      },

      deletePrivateThought: (id) => {
        incrementStat('totalDissolved');
        set((state) => ({
          privateThoughts: state.privateThoughts.filter((t) => t.id !== id),
        }));

        // Delete from DB if it's a UUID (DB-synced thought)
        if (isUUID(id)) {
          const sessionId = getSessionId();
          syncToDB(`delete-${id}`, async () => {
            const { error } = await supabase.rpc('delete_private_note', {
              p_session_id: sessionId,
              p_note_id: id,
            });
            if (error) throw error;
          });
        }
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
              expiresAt: new Date(t.expiresAt.getTime() + WATER_EXTENSION_MINUTES * 60 * 1000),
              decayLevel: Math.max(0, t.decayLevel - 15),
            };
          }),
        }));

        // Sync water to DB
        if (isUUID(id)) {
          const sessionId = getSessionId();
          syncToDB(`water-${id}`, async () => {
            const { error } = await supabase.rpc('water_private_note', {
              p_session_id: sessionId,
              p_note_id: id,
            });
            if (error) throw error;
          });
        }
      },

      starThought: (id) => {
        const thought = get().privateThoughts.find(t => t.id === id);
        const willBeStar = thought ? !thought.starred : false;

        set((state) => ({
          privateThoughts: state.privateThoughts.map((t) => {
            if (t.id !== id) return t;
            const isNowStarred = !t.starred;
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

        // Sync star to DB
        if (isUUID(id)) {
          const sessionId = getSessionId();
          syncToDB(`star-${id}`, async () => {
            const { error } = await supabase.rpc('toggle_note_star', {
              p_session_id: sessionId,
              p_note_id: id,
              p_starred: willBeStar,
            });
            if (error) throw error;
          });
        }
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
        set({ privateThoughts: [] });

        // Also clear from DB
        const sessionId = getSessionId();
        syncToDB('dissolve-all', async () => {
          const { error } = await supabase.rpc('dissolve_all_notes', {
            p_session_id: sessionId,
          });
          if (error) throw error;
        });
      },

      loadFromDB: async () => {
        try {
          const sessionId = getSessionId();
          const { data, error } = await supabase.rpc('get_private_notes', {
            p_session_id: sessionId,
          });

          if (error) {
            console.error('[brainchild] Failed to load from DB:', error);
            set({ isDBLoaded: true });
            return;
          }

          if (data && Array.isArray(data) && data.length > 0) {
            const dbThoughts: Thought[] = data.map((row) => ({
              id: row.id,
              content: row.content,
              createdAt: new Date(row.created_at),
              expiresAt: new Date(row.expires_at),
              decayLevel: calculateDecayLevel(new Date(row.created_at), new Date(row.expires_at)),
              mode: (row.mode || 'clean') as DecayMode,
              visibility: 'private' as const,
              decaySpeed: 'normal' as DecaySpeed,
              category: (row.category || 'uncategorized') as FragmentCategory,
              waterCount: row.water_count || 0,
              starred: row.starred || false,
              lastWateredAt: row.last_watered_at ? new Date(row.last_watered_at) : undefined,
            }));

            set((state) => {
              const dbIds = new Set(dbThoughts.map(t => t.id));
              // Keep local-only thoughts (non-UUID or not in DB)
              const localOnly = state.privateThoughts.filter(t => !dbIds.has(t.id));
              return {
                privateThoughts: [...dbThoughts, ...localOnly],
                isDBLoaded: true,
              };
            });
          } else {
            set({ isDBLoaded: true });
          }
        } catch (err) {
          console.error('[brainchild] DB load error:', err);
          set({ isDBLoaded: true });
        }
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
        // isDBLoaded is NOT persisted — always starts false
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
