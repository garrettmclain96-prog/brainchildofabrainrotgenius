import { motion, AnimatePresence } from 'framer-motion';
import { Thought } from '@/types/thought';
import { WritingTone, CognitiveProfile } from '@/hooks/useIdentityDrift';

interface PatternWhisperProps {
  whisper: string | null;
  isLoading: boolean;
  thoughts: Thought[];
  tone?: WritingTone;
  profile?: CognitiveProfile;
  onRequest: (thoughts: Thought[], tone?: WritingTone, profile?: CognitiveProfile) => void;
  onDismiss: () => void;
}

export function PatternWhisper({
  whisper,
  isLoading,
  thoughts,
  tone,
  profile,
  onRequest,
  onDismiss,
}: PatternWhisperProps) {
  return (
    <section className="glass-premium rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground/70 font-thought">pattern whisper</span>
        {!whisper && !isLoading && (
          <motion.button
            onClick={() => onRequest(thoughts, tone, profile)}
            className="text-[10px] font-thought text-primary/50 hover:text-primary/70 transition-colors tracking-wider"
            whileTap={{ scale: 0.95 }}
            disabled={thoughts.length < 3}
          >
            {thoughts.length < 3 ? 'need more thoughts' : 'ask the fog'}
          </motion.button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            className="flex items-center gap-2 py-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1 h-1 rounded-full bg-primary/30"
                animate={{ opacity: [0.2, 0.8, 0.2], y: [0, -3, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
            <span className="text-[11px] font-thought text-muted-foreground/30 italic ml-1">
              observing patterns...
            </span>
          </motion.div>
        )}

        {whisper && !isLoading && (
          <motion.div
            key="whisper"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-2"
          >
            <p className="text-xs font-thought text-muted-foreground/60 leading-relaxed italic">
              {whisper}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onDismiss}
                className="text-[10px] font-thought text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors"
              >
                dissolve
              </button>
              <button
                onClick={() => onRequest(thoughts, tone, profile)}
                className="text-[10px] font-thought text-primary/30 hover:text-primary/50 transition-colors"
              >
                ask again
              </button>
            </div>
          </motion.div>
        )}

        {!whisper && !isLoading && (
          <motion.p
            key="empty"
            className="text-[11px] font-thought text-muted-foreground/20 italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            the fog observes but rarely speaks.
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  );
}
