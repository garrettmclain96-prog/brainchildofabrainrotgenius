import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/hooks/useSessionId';

interface PremiumStatus {
  isPremium: boolean;
  premiumUntil: Date | null;
  isLoading: boolean;
}

export function usePremiumStatus(): PremiumStatus {
  const [status, setStatus] = useState<PremiumStatus>({
    isPremium: false,
    premiumUntil: null,
    isLoading: true,
  });

  useEffect(() => {
    const sessionId = getSessionId();

    async function check() {
      // Find connected account for this session
      const { data: account } = await supabase
        .from('connected_accounts')
        .select('stripe_account_id')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (!account) {
        setStatus({ isPremium: false, premiumUntil: null, isLoading: false });
        return;
      }

      // Check subscription status
      const { data: sub } = await supabase
        .from('subscription_status')
        .select('status, premium_until, current_period_end')
        .eq('stripe_account_id', account.stripe_account_id)
        .maybeSingle();

      if (!sub) {
        setStatus({ isPremium: false, premiumUntil: null, isLoading: false });
        return;
      }

      const premiumUntil = sub.premium_until
        ? new Date(sub.premium_until)
        : sub.current_period_end
          ? new Date(sub.current_period_end)
          : null;

      const isPremium =
        sub.status === 'active' &&
        premiumUntil !== null &&
        premiumUntil > new Date();

      // Cache for sync access in thoughtStore
      sessionStorage.setItem('brainchild-premium', isPremium ? 'true' : 'false');

      setStatus({ isPremium, premiumUntil, isLoading: false });
    }

    check();
  }, []);

  return status;
}
