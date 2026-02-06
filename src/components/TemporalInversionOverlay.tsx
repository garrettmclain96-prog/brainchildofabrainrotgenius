import { motion, AnimatePresence } from 'framer-motion';
import { TemporalInversion } from '@/hooks/useTemporalInversions';

interface TemporalInversionOverlayProps {
  inversion: TemporalInversion | null;
  onDismiss: () => void;
}

export function TemporalInversionOverlay({ inversion, onDismiss }: TemporalInversionOverlayProps) {
  return (
    <AnimatePresence>
      {inversion && (
        <motion.div
          className="fixed top-16 left-0 right-0 z-35 flex justify-center px-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
          onClick={onDismiss}
        >
          <div className="max-w-sm w-full">
            <motion.div
              className="relative p-4 rounded-xl border border-accent/10 bg-card/40 backdrop-blur-xl cursor-pointer"
              animate={{
                borderColor: ['hsl(var(--accent) / 0.1)', 'hsl(var(--accent) / 0.2)', 'hsl(var(--accent) / 0.1)'],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {/* Temporal distortion effect */}
              <motion.div
                className="absolute inset-0 rounded-xl opacity-20"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--accent) / 0.05) 0%, transparent 50%, hsl(var(--primary) / 0.05) 100%)',
                }}
                animate={{ rotate: [0, 1, -1, 0] }}
                transition={{ duration: 8, repeat: Infinity }}
              />

              <div className="relative">
                <span className="text-[9px] text-accent/30 tracking-[0.3em] uppercase font-thought block mb-2">
                  {inversion.type === 'prediction' ? 'ahead' : 'behind'}
                </span>
                
                <p className="text-xs text-foreground/50 font-thought italic leading-relaxed">
                  {inversion.content}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <div className="h-[1px] flex-1 bg-muted-foreground/5" />
                  <span className="text-[8px] text-muted-foreground/15">
                    {inversion.futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="h-[1px] flex-1 bg-muted-foreground/5" />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
