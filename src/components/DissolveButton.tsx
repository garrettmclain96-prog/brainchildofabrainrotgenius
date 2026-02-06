import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThoughtStore } from '@/stores/thoughtStore';
import { useAppMode } from '@/hooks/useAppMode';
import { FAREWELL_MESSAGES } from '@/types/thought';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function DissolveButton() {
  const { dissolveEverything, privateThoughts } = useThoughtStore();
  const { mode } = useAppMode();
  const [showFarewell, setShowFarewell] = useState(false);
  const [farewellMessage, setFarewellMessage] = useState('');

  const handleDissolve = () => {
    dissolveEverything();
    const message = FAREWELL_MESSAGES[Math.floor(Math.random() * FAREWELL_MESSAGES.length)];
    setFarewellMessage(message);
    setShowFarewell(true);
    setTimeout(() => setShowFarewell(false), 4000);
  };

  if (privateThoughts.length === 0) return null;

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <motion.button
            className={cn(
              'w-full px-4 py-3 rounded-xl text-sm font-thought',
              'bg-destructive/10 text-destructive-foreground/60',
              'border border-destructive/20',
              'hover:bg-destructive/20 hover:border-destructive/30',
              'transition-all duration-500',
              'group relative overflow-hidden'
            )}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <span className="relative z-10">dissolve all</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-destructive/0 via-destructive/10 to-destructive/0"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          </motion.button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-destructive/20 max-w-sm mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-thought text-foreground text-center">
              this cannot be undone
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={handleDissolve}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full"
            >
              dissolve
            </AlertDialogAction>
            <AlertDialogCancel className="bg-secondary text-secondary-foreground hover:bg-secondary/80 w-full mt-0">
              cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AnimatePresence>
        {showFarewell && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-lg px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.p
              className="text-center font-thought text-lg text-muted-foreground/80 max-w-md leading-relaxed"
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              {farewellMessage}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
