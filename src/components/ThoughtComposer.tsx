import { useState } from 'react';
import { DecayMode, DecaySpeed } from '@/types/thought';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ThoughtComposerProps {
  onSubmit: (content: string, mode: DecayMode, decaySpeed: DecaySpeed) => void;
  isPublic?: boolean;
  disabled?: boolean;
}

export function ThoughtComposer({ onSubmit, isPublic = false, disabled = false }: ThoughtComposerProps) {
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<DecayMode>('clean');
  const [decaySpeed, setDecaySpeed] = useState<DecaySpeed>('normal');

  const handleSubmit = () => {
    if (content.trim() && !disabled) {
      onSubmit(content.trim(), mode, decaySpeed);
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isPublic ? "Release a thought into the fog..." : "Capture a thought..."}
        className={cn(
          'min-h-[120px] font-thought text-sm resize-none',
          'bg-secondary/30 border-border/50',
          'placeholder:text-muted-foreground/40',
          'focus:ring-1 focus:ring-primary/30 focus:border-primary/40',
          'transition-all duration-500'
        )}
        disabled={disabled}
        aria-label={isPublic ? "Public thought content" : "Private thought content"}
      />
      
      {isPublic && (
        <div className="flex flex-wrap gap-4 text-xs">
          {/* Decay mode toggle */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">mode:</span>
            <div className="flex rounded-md bg-secondary/30 p-0.5">
              <button
                type="button"
                onClick={() => setMode('clean')}
                className={cn(
                  'px-2 py-1 rounded transition-all duration-300',
                  mode === 'clean' 
                    ? 'bg-card text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                clean
              </button>
              <button
                type="button"
                onClick={() => setMode('rot')}
                className={cn(
                  'px-2 py-1 rounded transition-all duration-300',
                  mode === 'rot' 
                    ? 'bg-destructive/30 text-destructive-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                rot
              </button>
            </div>
          </div>

          {/* Decay speed selector */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">decay:</span>
            <div className="flex rounded-md bg-secondary/30 p-0.5">
              {(['normal', 'fast', 'sink'] as DecaySpeed[]).map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setDecaySpeed(speed)}
                  className={cn(
                    'px-2 py-1 rounded transition-all duration-300',
                    decaySpeed === speed 
                      ? 'bg-card text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
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
        <span className="text-xs text-muted-foreground/50">
          {content.length > 0 && `${content.length} chars`}
        </span>
        
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || disabled}
          variant="ghost"
          className={cn(
            'text-sm font-normal',
            'text-primary hover:text-primary-foreground hover:bg-primary/80',
            'transition-all duration-500'
          )}
        >
          {isPublic ? 'release to fog' : 'capture'}
        </Button>
      </div>
    </div>
  );
}
