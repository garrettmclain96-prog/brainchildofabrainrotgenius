import { useEffect, useState } from 'react';
import { useSyncStore } from '@/hooks/useSyncState';

/**
 * Offline honesty — reports connection state and flushes queued writes the
 * moment the connection returns. Capture always works offline because every
 * thought is written to local state first.
 */
export function useOfflineState() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator === 'undefined' ? false : !navigator.onLine
  );
  const pendingCount = useSyncStore((s) => s.pendingCount);
  const queuedCount = useSyncStore((s) => s.retryQueue.length);

  useEffect(() => {
    const goOnline = () => {
      setIsOffline(false);
      // Drain anything that failed while the connection was gone.
      const { retryQueue, processRetryQueue } = useSyncStore.getState();
      if (retryQueue.length > 0) processRetryQueue();
    };
    const goOffline = () => setIsOffline(true);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return {
    isOffline,
    unsyncedCount: pendingCount + queuedCount,
    label: isOffline ? 'offline — kept on this device' : null,
  };
}
