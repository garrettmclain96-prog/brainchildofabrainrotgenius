import { create } from 'zustand';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SyncStore {
  status: SyncStatus;
  pendingCount: number;
  retryQueue: Array<{ id: string; action: () => Promise<void>; retries: number }>;
  setStatus: (status: SyncStatus) => void;
  trackOperation: (id: string, action: () => Promise<void>) => void;
  processRetryQueue: () => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export const useSyncStore = create<SyncStore>((set, get) => ({
  status: 'idle',
  pendingCount: 0,
  retryQueue: [],

  setStatus: (status) => set({ status }),

  trackOperation: async (id, action) => {
    set((s) => ({ pendingCount: s.pendingCount + 1, status: 'saving' }));

    try {
      await action();
      set((s) => {
        const newCount = s.pendingCount - 1;
        return {
          pendingCount: newCount,
          status: newCount === 0 ? 'saved' : 'saving',
        };
      });

      // Auto-dismiss "saved" after 2s
      setTimeout(() => {
        const current = get();
        if (current.status === 'saved' && current.pendingCount === 0) {
          set({ status: 'idle' });
        }
      }, 2000);
    } catch {
      set((s) => {
        const existing = s.retryQueue.find((r) => r.id === id);
        const retries = existing ? existing.retries + 1 : 1;

        if (retries <= MAX_RETRIES) {
          const queue = s.retryQueue.filter((r) => r.id !== id);
          queue.push({ id, action, retries });
          return {
            pendingCount: s.pendingCount - 1,
            retryQueue: queue,
            status: 'error',
          };
        }

        // Exhausted retries — drop from queue
        console.error(`[brainchild] sync failed after ${MAX_RETRIES} retries: ${id}`);
        return {
          pendingCount: s.pendingCount - 1,
          retryQueue: s.retryQueue.filter((r) => r.id !== id),
          status: s.pendingCount - 1 > 0 ? 'saving' : 'error',
        };
      });
    }
  },

  processRetryQueue: () => {
    const { retryQueue, trackOperation } = get();
    if (retryQueue.length === 0) return;

    // Process one at a time to avoid overwhelming
    const next = retryQueue[0];
    set((s) => ({ retryQueue: s.retryQueue.filter((r) => r.id !== next.id) }));

    setTimeout(() => {
      trackOperation(next.id, next.action);
    }, RETRY_DELAY_MS);
  },
}));

// Auto-process retry queue when errors occur
let retryInterval: ReturnType<typeof setInterval> | null = null;

useSyncStore.subscribe((state) => {
  if (state.retryQueue.length > 0 && !retryInterval) {
    retryInterval = setInterval(() => {
      const { retryQueue, processRetryQueue } = useSyncStore.getState();
      if (retryQueue.length === 0) {
        if (retryInterval) clearInterval(retryInterval);
        retryInterval = null;
        return;
      }
      processRetryQueue();
    }, RETRY_DELAY_MS);
  }
});
