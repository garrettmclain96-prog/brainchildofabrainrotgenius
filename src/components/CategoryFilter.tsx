import { motion } from 'framer-motion';
import { FragmentCategory, CATEGORY_META } from '@/types/thought';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  selected: FragmentCategory | 'all';
  onSelect: (category: FragmentCategory | 'all') => void;
  counts: Record<FragmentCategory, number>;
}

export function CategoryFilter({ selected, onSelect, counts }: CategoryFilterProps) {
  const categories: (FragmentCategory | 'all')[] = ['all', 'ideas', 'tasks', 'journal', 'projects'];

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => {
        const isAll = cat === 'all';
        const meta = isAll
          ? { label: 'all', icon: '·', color: 'muted-foreground' }
          : CATEGORY_META[cat];
        const count = isAll
          ? Object.values(counts).reduce((a, b) => a + b, 0)
          : counts[cat] || 0;
        const isActive = selected === cat;

        return (
          <motion.button
            key={cat}
            onClick={() => onSelect(cat)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-thought whitespace-nowrap',
              'transition-all duration-300 relative overflow-hidden',
              isActive
                ? 'bg-primary/15 text-primary border border-primary/20'
                : 'bg-secondary/20 text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent'
            )}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-sm">{meta.icon}</span>
            <span>{meta.label}</span>
            {count > 0 && (
              <span className={cn(
                'text-[10px] tabular-nums',
                isActive ? 'text-primary/60' : 'text-muted-foreground/40'
              )}>
                {count}
              </span>
            )}
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5"
                layoutId="category-active"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
