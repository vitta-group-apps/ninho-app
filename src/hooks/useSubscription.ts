/**
 * useSubscription
 *
 * Hook global que verifica o status de assinatura da família ativa.
 * Lê a tabela `subscriptions` do Supabase pelo family_id.
 *
 * Retorna:
 *  - isPremium: boolean — true se active ou trialing
 *  - isTrialing: boolean
 *  - status: string — 'active' | 'trialing' | 'canceled' | 'expired' | null
 *  - expiresAt: Date | null
 *  - loading: boolean
 *  - refetch: () => void — para chamar após upgrade
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveChild } from '@/contexts/ActiveChildContext';

interface Subscription {
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  provider: string;
}

interface SubscriptionState {
  isPremium: boolean;
  isTrialing: boolean;
  isCanceling: boolean; // ativo mas vai cancelar no fim do período
  status: string | null;
  expiresAt: Date | null;
  loading: boolean;
  refetch: () => void;
}

export function useSubscription(): SubscriptionState {
  const { activeChild } = useActiveChild();
  const [sub, setSub]       = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  // Pega o family_id via activeChild — já temos essa info no contexto
  const familyId = (activeChild as any)?.family_id ?? null;

  const fetch = useCallback(async () => {
    if (!familyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('status, current_period_end, cancel_at_period_end, provider')
        .eq('family_id', familyId)
        .in('status', ['active', 'trialing'])
        .order('current_period_end', { ascending: false })
        .limit(1)
        .maybeSingle();
      setSub(data ?? null);
    } catch {
      setSub(null);
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => { fetch(); }, [fetch]);

  const isPremium  = sub?.status === 'active' || sub?.status === 'trialing';
  const isTrialing = sub?.status === 'trialing';
  const isCanceling = isPremium && sub?.cancel_at_period_end === true;
  const expiresAt  = sub?.current_period_end ? new Date(sub.current_period_end) : null;

  return {
    isPremium,
    isTrialing,
    isCanceling,
    status:    sub?.status ?? null,
    expiresAt,
    loading,
    refetch:   fetch,
  };
}