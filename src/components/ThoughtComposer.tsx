import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DecayMode, DecaySpeed, FragmentCategory, CATEGORY_META } from '@/types/thought';
import { useAppMode } from '@/hooks/useAppMode';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

interface ThoughtComposerProps {
  onSubmit: (content: string, mode: DecayMode, decaySpeed: DecaySpeed, category?: FragmentCategory) => void;
  isPublic?: boolean;
  disabled?: boolean;
  onBurst?: (x: number, y: number) => void;
  onTextChange?: (text: string) => void;
}

export function ThoughtComposer({ onSubmit, isPublic = false, disabled = false, onBurst, onTextChange }: ThoughtComposerProps) {
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<DecayMode>('clean');
  const [decaySpeed, setDecaySpeed] = useState<DecaySpeed>('normal');
  const [category, setCategory] = useState<FragmentCategory>('uncategorized');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { mode: appMode } = useAppMode();

  const handleVoiceResult = useCallback((text: string) => {
    const trimmed = text.slice(0, 1000);
    setContent(trimmed);
    onTextChange?.(trimmed);
  }, [onTextChange]);

  const { isListening, isSupported: voiceSupported, toggleListening } = useVoiceInput(handleVoiceResult);

  const handleSubmit = (e?: React.MouseEvent) => {
    if (content.trim() && !disabled) {
      setIsSubmitting(true);

      if (onBurst && e) {
        onBurst(e.clientX, e.clientY);
      } else if (onBurst && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        onBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
      }

      onSubmit(content.trim(), isPublic ? mode : (appMode === 'rot' ? 'rot' : 'clean'), decaySpeed, category);
      setContent('');

      setTimeout(() => setIsSubmitting(false), 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSubmit();
    }
  };

  const categories: FragmentCategory[] = ['uncategorized', 'ideas', 'tasks', 'journal', 'projects'];

  return (
    <div className="space-y-3 relative">
      {/* Luminous aura when typing */}
      {content.length > 0 && (
        <div
          className="absolute -inset-6 rounded-3xl pointer-events-none transition-opacity duration-700"
          style={{
            background: `radial-gradient(ellipse at center, hsl(var(--${isPublic ? 'echo' : 'primary'}) / 0.04) 0%, transparent 65%)`,
            opacity: Math.min(content.length / 80, 1),
          }}
        />
      )}

      <div className="relative">
        <Textarea
          value={content}
          onChange={(e) => {
            const newValue = e.target.value.slice(0, 1000);
            setContent(newValue);
            onTextChange?.(newValue);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isListening ? 'listening…' : "what's on your mind…"}
          maxLength={1000}
          className={cn(
            'min-h-[100px] font-thought text-sm italic resize-none relative z-10',
            'bg-transparent border-border/15 rounded-2xl',
            'placeholder:text-muted-foreground/20 placeholder:italic',
            'focus:ring-1 focus:ring-primary/20 focus:border-primary/25',
            'transition-all duration-700',
            content.length > 0 && 'border-primary/15',
            isListening && 'border-primary/30 ring-1 ring-primary/15'
          )}
          disabled={disabled}
          aria-label={isPublic ? 'Public thought content' : 'Private thought content'}
        />

        {/* Voice input — organic indicator */}
        {voiceSupported && (
          <motion.button
            type="button"
            onClick={toggleListening}
            className={cn(
              'absolute bottom-3 right-3 z-20',
              'min-w-[44px] min-h-[44px] flex items-center justify-center',
              'rounded-xl transition-all duration-500',
              isListening
                ? 'bg-primary/15 text-primary/80'
                : 'text-muted-foreground/20 hover:text-muted-foreground/40'
            )}
            whileTap={{ scale: 0.9 }}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? (
              <motion.span
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-xs"
              >
                ●
              </motion.span>
            ) : (
              <span className="text-[10px] tracking-wider font-sans">mic</span>
            )}
          </motion.button>
        )}
      </div>

      {/* Category chips — appear on focus */}
      {!isPublic && isFocused && (
        <motion.div
          className="flex gap-1.5 flex-wrap"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-sans tracking-wide',
                'transition-all duration-300',
                category === cat
                  ? 'bg-primary/10 text-primary/80 border border-primary/15'
                  : 'text-muted-foreground/30 border border-transparent hover:text-muted-foreground/50 hover:border-border/10'
              )}
            >
              <span className="text-[9px]">{CATEGORY_META[cat].icon}</span>
              <span>{CATEGORY_META[cat].label}</span>
            </button>
          ))}
        </motion.div>
      )}

      {/* Public mode controls */}
      {isPublic && (
        <div className="flex flex-wrap gap-3 text-[10px] font-sans tracking-wide">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/30">mode</span>
            <div className="flex rounded-xl bg-secondary/10 p-0.5">
              {(['clean', 'rot'] as DecayMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-all duration-500',
                    mode === m
                      ? m === 'rot' ? 'bg-destructive/15 text-destructive/70' : 'bg-card/50 text-foreground/60'
                      : 'text-muted-foreground/30 hover:text-muted-foreground/50'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/30">decay</span>
            <div className="flex rounded-xl bg-secondary/10 p-0.5">
              {(['normal', 'fast', 'sink'] as DecaySpeed[]).map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setDecaySpeed(speed)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-all duration-500',
                    decaySpeed === speed ? 'bg-card/50 text-foreground/60' : 'text-muted-foreground/30 hover:text-muted-foreground/50'
                  )}
                >
                  {speed}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Submit bar */}
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-muted-foreground/20 tabular-nums font-sans">
          {content.length > 0 && `${content.length} · 1000`}
        </span>

        <motion.button
          ref={buttonRef}
          onClick={(e) => handleSubmit(e)}
          disabled={!content.trim() || disabled}
          className={cn(
            'px-5 py-2 rounded-xl text-xs font-thought italic tracking-wide',
            'text-primary/60 border border-primary/15',
            'hover:border-primary/30 hover:text-primary/80 hover:shadow-[0_0_15px_hsl(38_75%_65%_/_0.08)]',
            'disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:shadow-none',
            'transition-all duration-500 relative overflow-hidden',
            isSubmitting && 'scale-95'
          )}
          whileTap={{ scale: 0.93 }}
        >
          <span className="relative z-10">
            {isPublic ? 'release to fog' : 'add thought'}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
