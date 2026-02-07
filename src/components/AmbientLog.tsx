import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AmbientLogProps {
  thoughtCount: number;
  starredCount: number;
}

const AMBIENT_MESSAGES = [
  'things are always disappearing.',
  'something faded while you weren\'t looking.',
  'the rot continued.',
  'a thought survived longer than expected.',
  'most things don\'t last.',
  'nothing here is permanent.',
  'decay is not loss.',
  'the fog shifted.',
  'something was released.',
  'silence is also an answer.',
];

const CONTEXTUAL_MESSAGES: Array<{
  condition: (props: AmbientLogProps) => boolean;
  messages: string[];
}> = [
  {
    condition: ({ thoughtCount }) => thoughtCount === 0,
    messages: [
      'your mind is clear.',
      'nothing to hold.',
      'emptiness is not absence.',
    ],
  },
  {
    condition: ({ starredCount }) => starredCount > 5,
    messages: [
      'you\'re holding onto a lot.',
      'some things get heavy.',
      'preservation has a cost.',
    ],
  },
  {
    condition: ({ starredCount, thoughtCount }) => starredCount === 0 && thoughtCount > 0,
    messages: [
      'nothing saved. that takes courage.',
      'you let everything go.',
      'lightness.',
    ],
  },
];

export function AmbientLog({ thoughtCount, starredCount }: AmbientLogProps) {
  const [currentMessage, setCurrentMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  // Pick a message that fits the current state
  const pickMessage = useMemo(() => {
    // Check contextual messages first
    for (const ctx of CONTEXTUAL_MESSAGES) {
      if (ctx.condition({ thoughtCount, starredCount })) {
        return ctx.messages[Math.floor(Math.random() * ctx.messages.length)];
      }
    }
    // Fallback to ambient
    return AMBIENT_MESSAGES[Math.floor(Math.random() * AMBIENT_MESSAGES.length)];
  }, [thoughtCount, starredCount]);

  useEffect(() => {
    // Show after a delay
    const showTimer = setTimeout(() => {
      setCurrentMessage(pickMessage);
      setIsVisible(true);
    }, 3000);

    // Cycle messages every 20-40 seconds
    const cycleTimer = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        const msg = AMBIENT_MESSAGES[Math.floor(Math.random() * AMBIENT_MESSAGES.length)];
        setCurrentMessage(msg);
        setIsVisible(true);
      }, 1500);
    }, 20000 + Math.random() * 20000);

    return () => {
      clearTimeout(showTimer);
      clearInterval(cycleTimer);
    };
  }, [pickMessage]);

  return (
    <div className="fixed bottom-16 left-0 right-0 z-20 pointer-events-none flex justify-center">
      <AnimatePresence>
        {isVisible && currentMessage && (
          <motion.p
            className="text-[10px] font-thought text-muted-foreground/20 tracking-[0.15em] italic px-4 text-center"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
          >
            {currentMessage}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
