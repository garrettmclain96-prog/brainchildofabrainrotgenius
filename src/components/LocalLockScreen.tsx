import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LocalLockScreenProps {
  onUnlock: (passcode: string) => Promise<boolean>;
}

/**
 * The gate in front of the private space. No hints, no recovery, no accounts.
 */
export function LocalLockScreen({ onUnlock }: LocalLockScreenProps) {
  const [passcode, setPasscode] = useState('');
  const [failed, setFailed] = useState(false);
  const [checking, setChecking] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode || checking) return;
    setChecking(true);
    const ok = await onUnlock(passcode);
    setChecking(false);
    if (!ok) {
      setFailed(true);
      setPasscode('');
      setTimeout(() => setFailed(false), 1400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-8 bg-background">
      <motion.form
        onSubmit={submit}
        className="w-full max-w-xs space-y-8 text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={failed ? { x: [0, -8, 8, -4, 0] } : { opacity: 1, y: 0 }}
        transition={{ duration: failed ? 0.4 : 0.8, ease: [0.23, 1, 0.32, 1] }}
      >
        <p className="font-display text-base text-foreground/70 tracking-[0.18em] uppercase">
          closed
        </p>

        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="passcode"
          aria-label="Passcode"
          className={cn(
            'w-full min-h-[52px] text-center bg-transparent border-b',
            'font-thought italic text-lg tracking-[0.4em] text-foreground/80',
            'placeholder:tracking-normal placeholder:text-muted-foreground/25',
            'focus:outline-none transition-colors duration-500',
            failed ? 'border-destructive/50' : 'border-border/25 focus:border-primary/35'
          )}
        />

        <button
          type="submit"
          disabled={!passcode || checking}
          className="min-h-[44px] px-6 text-xs font-thought italic tracking-[0.2em] text-primary/70 disabled:opacity-25 hover:text-primary/90 transition-all duration-500"
        >
          open
        </button>

        <p className="text-[10px] font-sans tracking-[0.15em] text-muted-foreground/25 leading-relaxed">
          this passcode exists only on this device. there is no way to recover it.
        </p>
      </motion.form>
    </div>
  );
}
