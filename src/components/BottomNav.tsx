import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type View = 'private' | 'fog' | 'settings';

interface BottomNavProps {
  view: View;
  onViewChange: (view: View) => void;
  socialEnabled: boolean;
  socialPermanentlyDisabled: boolean;
}

const navItems: { id: View; label: string; icon: string; requiresSocial?: boolean }[] = [
  { id: 'private', label: 'fragments', icon: '◉' },
  { id: 'fog', label: 'fog', icon: '☁', requiresSocial: true },
  { id: 'settings', label: 'controls', icon: '⚙' },
];

export function BottomNav({ view, onViewChange, socialEnabled, socialPermanentlyDisabled }: BottomNavProps) {
  const visibleItems = navItems.filter((item) => {
    if (item.requiresSocial && socialPermanentlyDisabled) return false;
    return true;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-area-bottom">
      <div className="mx-auto max-w-lg px-4 pb-2 pt-1">
        <div className="flex items-center justify-around glass-strong rounded-2xl px-2 py-1 relative overflow-hidden">
          {/* Active indicator */}
          <motion.div
            className="absolute h-[calc(100%-8px)] rounded-xl bg-primary/10"
            layout
            style={{
              width: `${100 / visibleItems.length}%`,
              left: `${(visibleItems.findIndex((i) => i.id === view) / visibleItems.length) * 100}%`,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />

          {visibleItems.map((item) => {
            const isActive = view === item.id;
            const isDisabled = item.requiresSocial && !socialEnabled && view !== item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl',
                  'transition-all duration-300 min-w-[64px]',
                  isActive
                    ? 'text-primary'
                    : isDisabled
                    ? 'text-muted-foreground/30'
                    : 'text-muted-foreground'
                )}
                whileTap={{ scale: 0.9 }}
                aria-label={item.label}
              >
                <motion.span
                  className="text-lg leading-none"
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {item.icon}
                </motion.span>
                <span className="text-[10px] font-thought tracking-wide">
                  {item.label}
                </span>

                {/* Active dot */}
                {isActive && (
                  <motion.span
                    className="absolute -top-0.5 w-1 h-1 rounded-full bg-primary"
                    layoutId="nav-dot"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
