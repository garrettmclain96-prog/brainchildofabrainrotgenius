import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thought, FAREWELL_MESSAGES } from '@/types/thought';
import { useThoughtStore } from '@/stores/thoughtStore';
import { useAppMode } from '@/hooks/useAppMode';
import { cn } from '@/lib/utils';

interface ForgettingCeremonyProps {
  thoughts: Thought[];
  isOpen: boolean;
  onClose: () => void;
}

export function ForgettingCeremony({ thoughts, isOpen, onClose }: ForgettingCeremonyProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<'select' | 'ceremony' | 'farewell'>('select');
  const { deletePrivateThought } = useThoughtStore();
  const { mode } = useAppMode();

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const beginCeremony = useCallback(() => {
    if (selectedIds.size === 0) return;
    setPhase('ceremony');

    setTimeout(() => {
      selectedIds.forEach((id) => deletePrivateThought(id));
      setPhase('farewell');
      setTimeout(() => {
        setPhase('select');
        setSelectedIds(new Set());
        onClose();
      }, 3500);
    }, 3000);
  }, [selectedIds, deletePrivateThought, onClose]);

  const handleClose = () => {
    setPhase('select');
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[90] flex flex-col bg-background/95 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {phase === 'select' && (
            <motion.div
              className="flex-1 flex flex-col p-6 pb-28 max-w-lg mx-auto w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="mb-6">
                <h2 className="text-lg font-thought text-foreground/80 tracking-wider">
                  select
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {thoughts.map((thought) => (
                  <motion.button
                    key={thought.id}
                    onClick={() => toggleSelection(thought.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl transition-all duration-300',
                      selectedIds.has(thought.id)
                        ? 'glass-premium border border-destructive/20 bg-destructive/5'
                        : 'glass border border-transparent hover:border-border/20'
                    )}
                    whileTap={{ scale: 0.98 }}
                  >
                    <p className="text-sm font-thought text-foreground/70 line-clamp-2">
                      {thought.content}
                    </p>
                    <p className="text-[9px] text-muted-foreground/25 mt-1">
                      {thought.decayLevel}%
                    </p>
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-3">
                <motion.button
                  onClick={beginCeremony}
                  disabled={selectedIds.size === 0}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-thought text-sm',
                    'bg-destructive/15 text-destructive-foreground/60',
                    'disabled:opacity-20 disabled:cursor-not-allowed',
                    'hover:bg-destructive/25 transition-all'
                  )}
                  whileTap={{ scale: 0.98 }}
                >
                  dissolve {selectedIds.size > 0 ? selectedIds.size : ''}
                </motion.button>
                <motion.button
                  onClick={handleClose}
                  className="px-4 py-3 rounded-xl font-thought text-sm text-muted-foreground/40 hover:text-muted-foreground/60 transition-all"
                  whileTap={{ scale: 0.98 }}
                >
                  cancel
                </motion.button>
              </div>
            </motion.div>
          )}

          {phase === 'ceremony' && (
            <motion.div
              className="flex-1 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-center">
                {Array.from({ length: selectedIds.size * 3 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-muted-foreground/20"
                    style={{
                      left: `${30 + Math.random() * 40}%`,
                      top: `${30 + Math.random() * 40}%`,
                    }}
                    animate={{
                      y: [0, -100 - Math.random() * 200],
                      x: [(Math.random() - 0.5) * 100],
                      opacity: [0.5, 0],
                      scale: [1, 0],
                    }}
                    transition={{ duration: 2 + Math.random(), delay: Math.random() * 1.5 }}
                  />
                ))}

                <motion.p
                  className="text-muted-foreground/40 font-thought text-sm tracking-wider"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ...
                </motion.p>
              </div>
            </motion.div>
          )}

          {phase === 'farewell' && (
            <motion.div
              className="flex-1 flex items-center justify-center px-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <motion.p
                className="text-center font-thought text-lg text-muted-foreground/60 max-w-md leading-relaxed"
                initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                {FAREWELL_MESSAGES[Math.floor(Math.random() * FAREWELL_MESSAGES.length)]}
              </motion.p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
