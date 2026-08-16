import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QuietSearchProps {
  value: string;
  onChange: (value: string) => void;
  matchCount: number;
}

/**
 * Quiet Search — instant local filtering across living thoughts.
 * Collapsed to a single glyph until asked for; never shows totals as a score.
 */
export function QuietSearch({ value, onChange, matchCount }: QuietSearchProps) {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => {
    setIsOpen(false);
    onChange('');
  };

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence initial={false} mode="wait">
        {isOpen ? (
          <motion.div
            key="field"
            className="flex items-center gap-2 flex-1"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <input
              autoFocus
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && close()}
              placeholder="look for something…"
              aria-label="Search your thoughts"
              className={cn(
                'flex-1 min-h-[44px] bg-transparent border-b border-border/20',
                'font-thought italic text-sm text-foreground/75',
                'placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30',
                'transition-colors duration-500'
              )}
            />
            {value.length > 0 && (
              <span className="text-[10px] font-sans text-muted-foreground/35 tabular-nums">
                {matchCount > 0 ? `${matchCount} still here` : 'nothing living'}
              </span>
            )}
            <button
              onClick={close}
              className="min-w-[44px] min-h-[44px] text-muted-foreground/35 hover:text-muted-foreground/60 transition-colors duration-500"
              aria-label="Close search"
            >
              ×
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="trigger"
            onClick={() => setIsOpen(true)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-xs text-muted-foreground/30 hover:text-primary/55 hover:bg-primary/5 transition-all duration-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Search your thoughts"
          >
            ⌕
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
