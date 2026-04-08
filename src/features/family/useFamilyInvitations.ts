/**
 * NINHO — useFamilyInvitations
 * Lista, cria e revoga convites de família.
 * Tabela: family_invitations
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type { InvitationRole } from '@/design-system/components/ui/InvitationCard';

export type InvitationRow = Database['public']['Tables']['family_invitations']['Row'];

interface UseFamilyInvitationsReturn {
  invitations:    InvitationRow[];
  loading:        boolean;
  error:          Error | null;
  invite:         (email: string, role: InvitationRole) => Promise<void>;
  revoke:         (id: string) => Promise<void>;
  refetch:        () => void;
}

export function useFamilyInvitations(familyId: string | null): UseFamilyInvitationsReturn {
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<Error | null>(null);
  const [tick,        setTick]        = useState(0);

  useEffect(() => {
    if (!familyId) return;
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError(null);

      const { data, error: sbError } = await supabase
        .from('family_invitations')
        .select('*')
        .eq('family_id', familyId as string)
        .order('created_at', { ascending: false });

      if (cancelled) return;
      setLoading(false);

      if (sbError) { setError(new Error(sbError.message)); return; }
      setInvitations(data ?? []);
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [familyId, tick]);

  const invite = useCallback(async (email: string, role: InvitationRole) => {
    if (!familyId) return;
    setLoading(true);
    setError(null);

    const { error: sbError } = await supabase
      .from('family_invitations')
      .insert({ family_id: familyId, invited_email: email, role, status: 'pending' });

    setLoading(false);
    if (sbError) throw new Error(sbError.message);
    setTick(t => t + 1);
  }, [familyId]);

  const revoke = useCallback(async (id: string) => {
    setLoading(true);
    const { error: sbError } = await supabase
      .from('family_invitations')
      .update({ status: 'rejected' })
      .eq('id', id);

    setLoading(false);
    if (sbError) throw new Error(sbError.message);
    setTick(t => t + 1);
  }, []);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return { invitations, loading, error, invite, revoke, refetch };
}
