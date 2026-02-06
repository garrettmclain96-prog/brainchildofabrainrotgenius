import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thought, FAREWELL_MESSAGES } from '@/types/thought';
import { useThoughtStore } from '@/stores/thoughtStore';
import { useAppMode } from '@/hooks/useAppMode';
import { cn } from '@/lib/utils';

const COMPOST_PROMPT_KEY = 'brainchild-last-compost';

function shouldShowCompost(): boolean {
  const lastShown = localStorage.getItem(COMPOST_PROMPT_KEY);
  if (!lastShown) return true;

  const lastDate = new Date(lastShown);
  const now = new Date();
  const hoursSince = (now.getTime() - lastDate.getTime()) / (60 * 60_000);
  const currentHour = now.getHours();

  // Show if: more than 20 hours since last prompt AND it's evening (7pm-11pm)
  return hoursSince > 20 && currentHour >= 19 && currentHour <= 23;
}

interface EndOfDayCompostProps {
  thoughts: Thought[];
}

export function EndOfDayCompost({ thoughts }: EndOfDayCompostProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDone, setIsDone] = useState(false);
  const { deletePrivateThought } = useThoughtStore();
  const { mode } = useAppMode();
  const isRot = mode === 'rot';

  useEffect(() => {
    // Check after a brief delay
    const timer = setTimeout(() => {
      if (shouldShowCompost() && thoughts.length > 2) {
        setIsOpen(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [thoughts.length]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCompost = useCallback(() => {
    selectedIds.forEach((id) => deletePrivateThought(id));
    localStorage.setItem(COMPOST_PROMPT_KEY, new Date().toISOString());
    setIsDone(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsDone(false);
      setSelectedIds(new Set());
    }, 3000);
  }, [selectedIds, deletePrivateThought]);

  const handleDismiss = () => {
    localStorage.setItem(COMPOST_PROMPT_KEY, new Date().toISOString());
    setIsOpen(false);
  };

  // Only show for thoughts with some decay
  const compostableThoughts = thoughts.filter((t) => t.decayLevel > 15);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[85] flex flex-col bg-background/95 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {!isDone ? (
            <motion.div
              className="flex-1 flex flex-col p-6 pb-28 max-w-lg mx-auto w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Header */}
              <div className="text-center mb-8 pt-8">
                <motion.span
                  className="text-3xl"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  🌘
                </motion.span>
                <h2 className="text-lg font-thought text-foreground/70 mt-4 tracking-wider">
                  {isRot ? 'what can rot tonight?' : 'end of day compost'}
                </h2>
                <p className="text-xs text-muted-foreground/35 mt-2 max-w-xs mx-auto">
                  {isRot
                    ? 'choose what returns to the soil. morning will feel lighter.'
                    : 'release what no longer serves you. tomorrow is a fresh page.'}
                </p>
              </div>

              {/* Thought list */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {compostableThoughts.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground/25 font-thought py-8">
                    nothing ready to compost yet
                  </p>
                ) : (
                  compostableThoughts.map((thought) => (
                    <motion.button
                      key={thought.id}
                      onClick={() => toggleSelection(thought.id)}
                      className={cn(
                        'w-full text-left p-3 rounded-xl transition-all duration-300',
                        selectedIds.has(thought.id)
                          ? 'border border-primary/20 bg-primary/5'
                          : 'border border-transparent hover:border-border/15 bg-secondary/10'
                      )}
                      whileTap={{ scale: 0.98 }}
                    >
                      <p className="text-sm font-thought text-foreground/60 line-clamp-2">
                        {thought.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="h-[2px] flex-1 bg-secondary/20 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-muted-foreground/20"
                            style={{ width: `${thought.decayLevel}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-muted-foreground/20">{thought.decayLevel}%</span>
                      </div>
                    </motion.button>
                  ))
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {selectedIds.size > 0 && (
                  <motion.button
                    onClick={handleCompost}
                    className="flex-1 py-3 rounded-xl font-thought text-sm bg-primary/15 text-primary/70 hover:bg-primary/25 transition-all"
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    compost {selectedIds.size} thought{selectedIds.size !== 1 ? 's' : ''}
                  </motion.button>
                )}
                <motion.button
                  onClick={handleDismiss}
                  className={cn(
                    'py-3 rounded-xl font-thought text-sm text-muted-foreground/40 hover:text-muted-foreground/60 transition-all',
                    selectedIds.size === 0 ? 'flex-1' : 'px-4'
                  )}
                  whileTap={{ scale: 0.98 }}
                >
                  {selectedIds.size === 0 ? 'nothing tonight' : 'skip'}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="flex-1 flex items-center justify-center px-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <div className="text-center">
                <motion.p
                  className="font-thought text-lg text-muted-foreground/60 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {isRot
                    ? 'the soil accepts. sleep well.'
                    : 'released. morning will be lighter.'}
                </motion.p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
