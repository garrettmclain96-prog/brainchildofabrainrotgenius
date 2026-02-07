import { cn } from '@/lib/utils';

interface AnimatedEmptyStateProps {
  icon?: 'fog' | 'thought' | 'echo';
}

const EMPTY_COPY = {
  thought: 'your mind is clear',
  fog: 'the fog is empty',
  echo: 'silence',
};

export function AnimatedEmptyState({ icon = 'fog' }: AnimatedEmptyStateProps) {
  return (
    <div className="relative py-20 flex flex-col items-center justify-center gap-4">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border border-muted-foreground/10 animate-ping-slow" />
        <div 
          className="absolute inset-3 rounded-full border border-muted-foreground/15 animate-ping-slow" 
          style={{ animationDelay: '-1s' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            'text-3xl animate-float-gentle opacity-20',
          )}>
            {icon === 'fog' && '☁'}
            {icon === 'thought' && '◦'}
            {icon === 'echo' && '◎'}
          </span>
        </div>
      </div>
      <p className="text-xs font-thought text-muted-foreground/25 tracking-wider">
        {EMPTY_COPY[icon]}
      </p>
    </div>
  );
}
