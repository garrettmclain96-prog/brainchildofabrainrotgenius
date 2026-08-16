import { motion } from 'framer-motion';
import { useCompostLayer } from '@/hooks/useCompostLayer';
import { useSeasonOfRot } from '@/hooks/useSeasonOfRot';

/**
 * Renders the compost residue as barely-there words drifting in the fog.
 * Purely atmospheric: pointer-events off, very low contrast, no interaction.
 */
export function CompostLayer() {
  const { residue } = useCompostLayer();
  const { season } = useSeasonOfRot();

  if (residue.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {residue.map((r, i) => (
        <motion.span
          key={`${r.word}-${r.addedAt}`}
          className="absolute font-thought italic text-muted-foreground/25 whitespace-nowrap select-none"
          style={{
            left: `${6 + r.drift * 82}%`,
            top: `${10 + r.depth * 76}%`,
            fontSize: `${0.7 + (r.word.length % 4) * 0.12}rem`,
            filter: season === 'frost' ? 'blur(1.5px)' : 'blur(0.6px)',
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.5, 0.28, 0.5, 0],
            y: [0, -14, -6, -18, -26],
          }}
          transition={{
            duration: 70 + (i % 5) * 12,
            repeat: Infinity,
            delay: i * 2.5,
            ease: 'easeInOut',
          }}
        >
          {r.word}
        </motion.span>
      ))}
    </div>
  );
}
