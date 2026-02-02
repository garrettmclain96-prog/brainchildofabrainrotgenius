import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EchoComposerProps {
  thoughtId: string;
  onSubmit: (thoughtId: string, text: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function EchoComposer({ thoughtId, onSubmit, onCancel, disabled = false }: EchoComposerProps) {
  const [text, setText] = useState('');
  const maxLength = 50; // Echoes are brief

  const handleSubmit = () => {
    if (text.trim() && !disabled) {
      onSubmit(thoughtId, text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="fog-appear flex items-center gap-2 p-3 bg-echo/5 rounded-md border border-echo/20">
      <span className="text-echo/60 text-sm">↳</span>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, maxLength))}
        onKeyDown={handleKeyDown}
        placeholder="leave a brief echo..."
        autoFocus
        disabled={disabled}
        className={cn(
          'flex-1 h-8 text-sm font-thought',
          'bg-transparent border-none',
          'placeholder:text-muted-foreground/30',
          'focus-visible:ring-0 focus-visible:ring-offset-0'
        )}
        aria-label="Echo text"
      />
      <span className="text-xs text-muted-foreground/40">
        {text.length}/{maxLength}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSubmit}
        disabled={!text.trim() || disabled}
        className="text-xs text-echo hover:text-echo-foreground hover:bg-echo/20 h-7 px-2"
      >
        send
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
      >
        ×
      </Button>
    </div>
  );
}
