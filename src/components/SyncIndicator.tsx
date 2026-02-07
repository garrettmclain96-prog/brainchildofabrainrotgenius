import { motion, AnimatePresence } from 'framer-motion';
import { useSyncStore, SyncStatus } from '@/hooks/useSyncState';
import { cn } from '@/lib/utils';

const statusConfig: Record<SyncStatus, { label: string; icon: string; className: string } | null> = {
  idle: null,
  saving: { label: 'saving', icon: '○', className: 'text-muted-foreground/40' },
  saved: { label: 'saved', icon: '●', className: 'text-primary/50' },
  error: { label: 'retrying', icon: '◌', className: 'text-destructive/50' },
};

export function SyncIndicator() {
  const status = useSyncStore((s) => s.status);
  const retryCount = useSyncStore((s) => s.retryQueue.length);
  const config = statusConfig[status];

  return (
    <AnimatePresence>
      {config && (
        <motion.div
          className={cn(
            'fixed top-3 left-4 z-40 flex items-center gap-1.5',
            'text-[10px] font-thought tracking-wider',
            config.className
          )}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.3 }}
        >
          <motion.span
            animate={status === 'saving' ? { opacity: [0.3, 1, 0.3] } : {}}
            transition={status === 'saving' ? { duration: 1.2, repeat: Infinity } : {}}
          >
            {config.icon}
          </motion.span>
          <span>{config.label}</span>
          {status === 'error' && retryCount > 0 && (
            <span className="opacity-50">({retryCount})</span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
