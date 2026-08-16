import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LocalLockSectionProps {
  lock: {
    isEnabled: boolean;
    enable: (passcode: string) => Promise<boolean>;
    disable: (passcode: string) => Promise<boolean>;
    lockNow: () => void;
  };
}

/**
 * Settings control for the device-local passcode.
 * The passcode is stored only as a salted digest; there is no recovery.
 */
export function LocalLockSection({ lock }: LocalLockSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [passcode, setPasscode] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lock.isEnabled) {
      const ok = await lock.disable(passcode);
      toast(ok ? 'the lock is gone' : 'that is not the passcode');
    } else {
      const ok = await lock.enable(passcode);
      toast(
        ok ? 'locked to this device' : 'use at least four characters',
        ok ? { description: 'there is no way to recover it' } : undefined
      );
    }
    setPasscode('');
    setIsEditing(false);
  };

  return (
    <section className="glass-premium rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-sm text-foreground/70 font-thought">local lock</span>
          <p className="text-[10px] font-sans text-muted-foreground/35 mt-0.5">
            {lock.isEnabled ? 'this device asks before opening' : 'stays on this device only'}
          </p>
        </div>
        <motion.button
          onClick={() => setIsEditing((v) => !v)}
          className={cn(
            'w-12 h-6 rounded-full transition-all duration-700 relative shrink-0',
            lock.isEnabled ? 'bg-primary/80' : 'bg-secondary/50'
          )}
          whileTap={{ scale: 0.95 }}
          aria-label={lock.isEnabled ? 'Remove passcode' : 'Set a passcode'}
        >
          <motion.span
            className="absolute top-1 w-4 h-4 rounded-full bg-foreground/90 shadow-lg"
            animate={{ left: lock.isEnabled ? 26 : 4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          />
        </motion.button>
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.form
            onSubmit={submit}
            className="flex gap-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
          >
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder={lock.isEnabled ? 'current passcode' : 'new passcode'}
              aria-label={lock.isEnabled ? 'Current passcode' : 'New passcode'}
              className="flex-1 min-h-[44px] px-3 rounded-xl bg-background/50 border border-border/20 font-thought italic text-xs text-foreground/75 placeholder:text-muted-foreground/25 focus:outline-none focus:border-primary/30 transition-colors duration-500"
            />
            <button
              type="submit"
              disabled={!passcode}
              className="min-h-[44px] px-4 rounded-xl text-xs font-thought italic text-primary/80 bg-primary/10 border border-primary/20 disabled:opacity-25 transition-all duration-500"
            >
              {lock.isEnabled ? 'remove' : 'set'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {lock.isEnabled && !isEditing && (
        <button
          onClick={lock.lockNow}
          className="w-full min-h-[44px] rounded-xl text-xs font-thought italic text-muted-foreground/50 bg-secondary/15 hover:text-muted-foreground/70 transition-all duration-500"
        >
          lock now
        </button>
      )}
    </section>
  );
}
