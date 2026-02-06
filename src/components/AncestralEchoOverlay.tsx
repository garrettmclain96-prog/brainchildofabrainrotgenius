import { motion, AnimatePresence } from 'framer-motion';
import { AncestralEcho } from '@/hooks/useAncestralEchoes';
import { cn } from '@/lib/utils';

interface AncestralEchoOverlayProps {
  echo: AncestralEcho | null;
  onMerge: () => void;
  onIgnore: () => void;
  onEraseBoth: () => void;
}

export function AncestralEchoOverlay({ echo, onMerge, onIgnore, onEraseBoth }: AncestralEchoOverlayProps) {
  return (
    <AnimatePresence>
      {echo && (
        <motion.div
          className="relative mt-3"
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="glass rounded-xl p-3 border border-primary/10 relative overflow-hidden">
            {/* Ghost shimmer */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary) / 0.03), transparent, hsl(var(--echo) / 0.03))',
              }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />

            {/* Whisper text */}
            <p className="text-[10px] text-primary/40 font-thought tracking-wider mb-2 relative z-10">
              this resembles a thought you had {echo.daysAgo} day{echo.daysAgo !== 1 ? 's' : ''} ago
            </p>

            {/* Ghosted ancestor content */}
            <motion.p
              className="text-xs text-muted-foreground/30 font-thought leading-relaxed italic relative z-10 line-clamp-3"
              animate={{ opacity: [0.2, 0.35, 0.2] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              "{echo.ancestorThought.content}"
            </motion.p>

            {/* Actions */}
            <div className="flex gap-2 mt-3 relative z-10">
              <button
                onClick={onMerge}
                className="px-2.5 py-1 rounded-lg text-[10px] font-thought bg-primary/10 text-primary/60 hover:bg-primary/20 transition-all"
              >
                merge
              </button>
              <button
                onClick={onIgnore}
                className="px-2.5 py-1 rounded-lg text-[10px] font-thought bg-secondary/20 text-muted-foreground/40 hover:bg-secondary/30 transition-all"
              >
                ignore
              </button>
              <button
                onClick={onEraseBoth}
                className="px-2.5 py-1 rounded-lg text-[10px] font-thought bg-destructive/8 text-destructive-foreground/30 hover:bg-destructive/15 transition-all"
              >
                erase both
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
