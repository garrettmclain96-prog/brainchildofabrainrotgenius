import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WhisperComposerProps {
  onRelease: (content: string) => void;
  disabled?: boolean;
}

const MAX_LENGTH = 90;

/**
 * Whisper Composer — a single line released to the fog with the shortest
 * lifespan available. For thoughts too small to be worth keeping.
 */
export function WhisperComposer({ onRelease, disabled = false }: WhisperComposerProps) {
  const [content, setContent] = useState('');

  const release = () => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;
    onRelease(trimmed);
    setContent('');
  };

  return (
    <div className="flex items-center gap-2">
      <input
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
        onKeyDown={(e) => e.key === 'Enter' && release()}
        placeholder="one line, gone in minutes…"
        maxLength={MAX_LENGTH}
        aria-label="Whisper to the fog"
        disabled={disabled}
        className={cn(
          'flex-1 min-h-[44px] px-3 rounded-xl bg-transparent',
          'border border-border/15 focus:border-echo/30',
          'font-thought italic text-xs text-foreground/70',
          'placeholder:text-muted-foreground/30 focus:outline-none',
          'transition-colors duration-500'
        )}
      />
      <motion.button
        onClick={release}
        disabled={!content.trim() || disabled}
        className="min-w-[44px] min-h-[44px] px-3 rounded-xl text-xs font-thought italic text-echo/80 bg-echo/8 border border-echo/20 disabled:opacity-20 transition-all duration-500"
        whileTap={{ scale: 0.94 }}
        aria-label="Release whisper"
      >
        whisper
      </motion.button>
    </div>
  );
}
