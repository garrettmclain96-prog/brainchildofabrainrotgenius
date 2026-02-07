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
      {content.length > 0 && (
        <div
          className="absolute -inset-4 rounded-2xl pointer-events-none transition-opacity duration-500"
          style={{
            background: `radial-gradient(ellipse at center, hsl(var(--${isPublic ? 'echo' : 'primary'}) / 0.05) 0%, transparent 70%)`,
            opacity: Math.min(content.length / 100, 1),
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
          placeholder={isListening ? 'listening…' : 'speak or type a thought…'}
          maxLength={1000}
          className={cn(
            'min-h-[100px] font-thought text-sm resize-none relative z-10',
            'bg-secondary/20 border-border/30 rounded-xl',
            'placeholder:text-muted-foreground/30',
            'focus:ring-1 focus:ring-primary/30 focus:border-primary/40',
            'transition-all duration-500',
            content.length > 0 && 'border-primary/20',
            isListening && 'border-primary/40 ring-1 ring-primary/20'
          )}
          disabled={disabled}
          aria-label={isPublic ? 'Public thought content' : 'Private thought content'}
        />

        {/* Voice input button */}
        {voiceSupported && (
          <motion.button
            type="button"
            onClick={toggleListening}
            className={cn(
              'absolute bottom-3 right-3 z-20',
              'min-w-[44px] min-h-[44px] flex items-center justify-center',
              'rounded-xl transition-all duration-300',
              isListening
                ? 'bg-primary/20 text-primary'
                : 'bg-secondary/30 text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-secondary/50'
            )}
            whileTap={{ scale: 0.92 }}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? (
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-base"
              >
                ●
              </motion.span>
            ) : (
              <span className="text-sm">🎙</span>
            )}
          </motion.button>
        )}
      </div>

      {!isPublic && isFocused && (
        <motion.div
          className="flex gap-1 flex-wrap"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-thought',
                'transition-all duration-200',
                category === cat
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'bg-secondary/20 text-muted-foreground/60 border border-transparent hover:bg-secondary/40'
              )}
            >
              <span>{CATEGORY_META[cat].icon}</span>
              <span>{CATEGORY_META[cat].label}</span>
            </button>
          ))}
        </motion.div>
      )}

      {isPublic && (
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/50">mode</span>
            <div className="flex rounded-lg bg-secondary/20 p-0.5">
              {(['clean', 'rot'] as DecayMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    'px-2.5 py-1 rounded-md transition-all duration-300',
                    mode === m
                      ? m === 'rot' ? 'bg-destructive/30 text-destructive-foreground' : 'bg-card text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/50">decay</span>
            <div className="flex rounded-lg bg-secondary/20 p-0.5">
              {(['normal', 'fast', 'sink'] as DecaySpeed[]).map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setDecaySpeed(speed)}
                  className={cn(
                    'px-2.5 py-1 rounded-md transition-all duration-300',
                    decaySpeed === speed ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {speed}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <span className="text-[10px] text-muted-foreground/30 tabular-nums">
          {content.length > 0 && `${content.length}/1000`}
        </span>

        <motion.button
          ref={buttonRef}
          onClick={(e) => handleSubmit(e)}
          disabled={!content.trim() || disabled}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-thought',
            'bg-primary/10 text-primary',
            'hover:bg-primary/20',
            'disabled:opacity-30 disabled:cursor-not-allowed',
            'transition-all duration-300 relative overflow-hidden',
            isSubmitting && 'scale-95'
          )}
          whileTap={{ scale: 0.95 }}
        >
          <span className="relative z-10">
            {isPublic ? 'Release to Fog' : 'Add Thought'}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
