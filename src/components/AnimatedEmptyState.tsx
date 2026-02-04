import { cn } from '@/lib/utils';

interface AnimatedEmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: 'fog' | 'thought' | 'echo';
}

export function AnimatedEmptyState({ title, subtitle, icon = 'fog' }: AnimatedEmptyStateProps) {
  return (
    <div className="relative py-20 flex flex-col items-center justify-center">
      {/* Animated rings */}
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 rounded-full border border-muted-foreground/10 animate-ping-slow" />
        <div 
          className="absolute inset-2 rounded-full border border-muted-foreground/15 animate-ping-slow" 
          style={{ animationDelay: '-1s' }}
        />
        <div 
          className="absolute inset-4 rounded-full border border-muted-foreground/20 animate-ping-slow" 
          style={{ animationDelay: '-2s' }}
        />
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            'text-4xl animate-float-gentle',
            icon === 'fog' && 'opacity-40',
            icon === 'thought' && 'opacity-50',
            icon === 'echo' && 'opacity-30'
          )}>
            {icon === 'fog' && '☁'}
            {icon === 'thought' && '💭'}
            {icon === 'echo' && '◎'}
          </span>
        </div>
      </div>
      
      {/* Text */}
      <p className="text-muted-foreground/60 text-sm font-thought text-center animate-fade-in">
        {title}
      </p>
      {subtitle && (
        <p className="text-muted-foreground/30 text-xs mt-2 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {subtitle}
        </p>
      )}
      
      {/* Floating dots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className="absolute text-muted-foreground/10 animate-float-random"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
              animationDelay: `${i * -2}s`,
              animationDuration: `${8 + i * 2}s`,
            }}
          >
            ◦
          </span>
        ))}
      </div>
    </div>
  );
}
