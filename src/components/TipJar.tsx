import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const PRESET_AMOUNTS = [
  { label: '$3', cents: 300 },
  { label: '$5', cents: 500 },
  { label: '$10', cents: 1000 },
];

interface TipJarProps {
  sessionId: string;
}

export function TipJar({ sessionId }: TipJarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveAmount = selectedAmount ?? (customAmount ? Math.round(parseFloat(customAmount) * 100) : 0);

  const handleTip = async () => {
    if (effectiveAmount < 100) return; // minimum $1
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-connect-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: 'tip',
            amountInCents: effectiveAmount,
            sessionId,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout');
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="glass-premium rounded-xl p-4">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-xs text-muted-foreground/55 font-thought tracking-wide hover:text-muted-foreground/75 transition-all py-2"
        whileTap={{ scale: 0.98 }}
      >
        support the vision ✦
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4 pt-4"
          >
            <p className="text-[11px] text-muted-foreground/40 font-thought text-center leading-relaxed">
              this place exists without ads, without tracking, without pressure.
              if it means something to you, leave a tip.
            </p>

            {/* Preset amounts */}
            <div className="flex gap-2 justify-center">
              {PRESET_AMOUNTS.map(({ label, cents }) => (
                <motion.button
                  key={cents}
                  onClick={() => {
                    setSelectedAmount(selectedAmount === cents ? null : cents);
                    setCustomAmount('');
                  }}
                  className={cn(
                    'px-4 py-2 rounded-lg text-xs font-thought transition-all duration-300',
                    selectedAmount === cents
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-secondary/20 text-muted-foreground/60 border border-border/20 hover:border-border/40'
                  )}
                  whileTap={{ scale: 0.95 }}
                >
                  {label}
                </motion.button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="flex items-center gap-2 justify-center">
              <span className="text-xs text-muted-foreground/40">$</span>
              <input
                type="number"
                min="1"
                max="999"
                step="1"
                placeholder="custom"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                className="w-20 bg-secondary/15 border border-border/20 rounded-lg px-3 py-2 text-xs text-foreground/70 font-thought text-center placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30"
              />
            </div>

            {error && (
              <p className="text-[10px] text-destructive/70 text-center font-thought">{error}</p>
            )}

            {/* Submit */}
            <motion.button
              onClick={handleTip}
              disabled={effectiveAmount < 100 || isProcessing}
              className={cn(
                'w-full py-2.5 rounded-lg text-xs font-thought tracking-wide transition-all duration-500',
                effectiveAmount >= 100
                  ? 'bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20'
                  : 'bg-secondary/10 text-muted-foreground/25 border border-border/10 cursor-not-allowed'
              )}
              whileTap={effectiveAmount >= 100 ? { scale: 0.98 } : undefined}
            >
              {isProcessing ? 'opening...' : effectiveAmount >= 100 ? `tip $${(effectiveAmount / 100).toFixed(0)}` : 'choose an amount'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
