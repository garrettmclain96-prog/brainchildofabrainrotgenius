import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Danger Warning — First launch filter.
 * 
 * "This app may change how you relate to your thoughts."
 * Not marketing. A filter.
 */

const WARNING_KEY = 'brainchild-danger-warning-seen';

interface DangerWarningProps {
  onAccept: () => void;
}

export function DangerWarning({ onAccept }: DangerWarningProps) {
  const [phase, setPhase] = useState<'warning' | 'fading'>('warning');

  const handleAccept = () => {
    setPhase('fading');
    localStorage.setItem(WARNING_KEY, 'true');
    setTimeout(onAccept, 1500);
  };

  const handleLeave = () => {
    // They chose to leave. Respect it.
    window.close();
    // If window.close doesn't work (most browsers block it), show a gentle message
    setPhase('fading');
    setTimeout(() => {
      document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0E0E11;color:#666;font-family:system-ui;text-align:center;padding:2rem;">
          <p style="font-size:14px;letter-spacing:0.1em;">you can close this tab now.<br/><br/>take care of your thoughts.</p>
        </div>
      `;
    }, 1000);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === 'fading' ? 0 : 1 }}
      transition={{ duration: phase === 'fading' ? 1.5 : 2 }}
    >
      <div className="absolute inset-0 bg-background" />
      
      {/* Scan lines */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, hsl(var(--foreground)) 3px, hsl(var(--foreground)) 4px)',
        }}
      />

      <div className="relative z-10 max-w-md text-center">
        {/* Small symbol */}
        <motion.div
          className="text-foreground/10 text-3xl mb-10"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
        >
          ◉
        </motion.div>

        {/* Warning text */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 1.5 }}
        >
          <p className="text-foreground/60 font-thought text-base leading-relaxed tracking-wide">
            This app may change how you relate to your thoughts.
          </p>

          <motion.div
            className="w-16 h-[1px] mx-auto bg-muted-foreground/10"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2, delay: 3 }}
          />

          <motion.p
            className="text-muted-foreground/30 text-xs leading-relaxed tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.5, duration: 1.5 }}
          >
            If you are looking for motivation, optimization, or validation — leave now.
          </motion.p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          className="mt-14 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 5, duration: 1.5 }}
        >
          <motion.button
            onClick={handleAccept}
            className="w-full px-6 py-3.5 rounded-xl text-sm font-thought
              bg-foreground/5 text-foreground/50 border border-foreground/10
              hover:bg-foreground/10 hover:text-foreground/70 hover:border-foreground/20
              transition-all duration-700 tracking-wider"
            whileTap={{ scale: 0.97 }}
          >
            I understand. Let me in.
          </motion.button>

          <motion.button
            onClick={handleLeave}
            className="w-full px-6 py-3 text-xs font-thought
              text-muted-foreground/20 hover:text-muted-foreground/40
              transition-colors duration-700 tracking-wider"
            whileTap={{ scale: 0.97 }}
          >
            this isn't for me
          </motion.button>
        </motion.div>

        {/* Fine print */}
        <motion.p
          className="mt-10 text-[9px] text-muted-foreground/8 tracking-[0.3em] uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 6, duration: 2 }}
        >
          no tracking · no accounts · everything decays
        </motion.p>
      </div>
    </motion.div>
  );
}

export function hasDismissedWarning(): boolean {
  return localStorage.getItem(WARNING_KEY) === 'true';
}
