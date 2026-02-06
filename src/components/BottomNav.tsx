import { motion, AnimatePresence } from 'framer-motion';
import { useAppMode } from '@/hooks/useAppMode';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';

type View = 'private' | 'fog' | 'settings';

interface BottomNavProps {
  view: View;
  onViewChange: (view: View) => void;
  socialEnabled: boolean;
  socialPermanentlyDisabled: boolean;
  navOrder?: string[];
}

const navItemData: Record<string, { label: string; icon: string; rotIcon: string; requiresSocial?: boolean }> = {
  private: { label: 'local', icon: '◉', rotIcon: '◎' },
  fog: { label: 'fog', icon: '◌', rotIcon: '◌', requiresSocial: true },
  settings: { label: 'controls', icon: '·', rotIcon: '·' },
};

export function BottomNav({ view, onViewChange, socialEnabled, socialPermanentlyDisabled, navOrder }: BottomNavProps) {
  const { mode } = useAppMode();
  const { tapLight } = useHaptics();
  const isRot = mode === 'rot';

  // Use perceptual drift nav order, or default
  const orderedIds = navOrder || ['private', 'fog', 'settings'];
  
  const visibleItems = orderedIds
    .filter(id => navItemData[id])
    .map(id => ({ id: id as View, ...navItemData[id] }))
    .filter((item) => {
      if (item.requiresSocial && socialPermanentlyDisabled) return false;
      return true;
    });

  const handleNavChange = (newView: View) => {
    tapLight();
    onViewChange(newView);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-area-bottom">
      <div className="mx-auto max-w-lg px-4 pb-2 pt-1">
        <div className="flex items-center justify-around glass-strong rounded-2xl px-2 py-1.5 relative overflow-hidden">
          {/* Active indicator — slides organically */}
          <motion.div
            className="absolute h-[calc(100%-10px)] rounded-xl"
            style={{
              background: isRot 
                ? 'hsl(var(--destructive) / 0.08)' 
                : 'hsl(var(--primary) / 0.08)',
            }}
            layout
            layoutId="nav-active-bg"
            animate={{
              width: `${100 / visibleItems.length}%`,
              left: `${(visibleItems.findIndex((i) => i.id === view) / visibleItems.length) * 100}%`,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.8 }}
          />

          {visibleItems.map((item) => {
            const isActive = view === item.id;
            const isDisabled = item.requiresSocial && !socialEnabled && view !== item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavChange(item.id)}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl',
                  'transition-all duration-500 min-w-[64px]',
                  isActive
                    ? isRot ? 'text-destructive' : 'text-primary'
                    : isDisabled
                    ? 'text-muted-foreground/25'
                    : 'text-muted-foreground/60'
                )}
                whileTap={{ scale: 0.88 }}
                aria-label={item.label}
              >
                <motion.span
                  className="text-lg leading-none"
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                >
                  {isRot ? item.rotIcon : item.icon}
                </motion.span>
                <span className="text-[10px] font-thought tracking-wider">
                  {item.label}
                </span>

                {/* Active dot — breathing */}
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      className={cn(
                        'absolute -top-0.5 w-1 h-1 rounded-full',
                        isRot ? 'bg-destructive' : 'bg-primary'
                      )}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
