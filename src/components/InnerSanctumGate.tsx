import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const PRICE_ID = 'price_1SyQp8C1A9HaROZtqOcQvbjV';

interface InnerSanctumGateProps {
  sessionId: string;
}

export function InnerSanctumGate({ sessionId }: InnerSanctumGateProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // First check if session has a connected account
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
            action: 'platform-subscribe',
            sessionId,
            priceId: PRICE_ID,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to start subscription');
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="glass-premium rounded-xl p-4 space-y-3">
      <div className="text-center space-y-2">
        <h3 className="text-sm font-thought text-foreground/70 tracking-wide">inner sanctum</h3>
        <p className="text-[11px] text-muted-foreground/40 font-thought leading-relaxed">
          extended decay timers · exclusive modes · ambient soundscapes · priority fog
        </p>
        <p className="text-[11px] text-primary/60 font-thought">$9.99 / month</p>
      </div>

      {error && (
        <p className="text-[10px] text-destructive/70 text-center font-thought">{error}</p>
      )}

      <motion.button
        onClick={handleSubscribe}
        disabled={isProcessing}
        className={cn(
          'w-full py-2.5 rounded-lg text-xs font-thought tracking-wide transition-all duration-500',
          'bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20'
        )}
        whileTap={{ scale: 0.98 }}
      >
        {isProcessing ? 'opening...' : 'unlock inner sanctum'}
      </motion.button>
    </section>
  );
}
