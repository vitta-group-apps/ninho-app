/**
 * useOnboardingStatus — verifica se o usuário completou o onboarding
 *
 * Schema real (auditado via migrations SQL + database.types.ts):
 *   families.owner_id      UUID FK → auth.users.id   (NÃO owner_user_id)
 *   memberships.user_id    UUID FK → auth.users.id
 *   memberships.created_at timestamptz  (sem status nem joined_at)
 *   children.family_id     UUID FK → families.id
 *
 * Fluxo:
 *   1. Busca família onde owner_id = userId (usuário é dono)
 *   2. Se não for owner, busca via `memberships` (user_id = userId)
 *   3. Com familyId, verifica se há pelo menos 1 filho cadastrado
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OnboardingStatus {
  loading:   boolean;
  hasFamily: boolean;
  hasChild:  boolean;
  familyId:  string | null;
}

export function useOnboardingStatus(userId: string | null): OnboardingStatus {
  const [status, setStatus] = useState<OnboardingStatus>({
    loading:   true,
    hasFamily: false,
    hasChild:  false,
    familyId:  null,
  });

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      setStatus({ loading: false, hasFamily: false, hasChild: false, familyId: null });
      return;
    }

    async function check() {
      try {
        // ── 1. Usuário é owner de alguma família? ─────────────────────────────
        // Coluna: families.owner_id (confirmado em todas as migrations SQL)
        const { data: ownedFamilies } = await supabase
          .from('families')
          .select('id')
          .eq('owner_id', userId)
          .limit(1);

        let familyId = ownedFamilies?.[0]?.id ?? null;

        // ── 2. Ou é membro convidado via `memberships`? ───────────────────────
        // Tabela: memberships (migration 1). Sem coluna joined_at ou status.
        if (!familyId) {
          const { data: memberRows } = await supabase
            .from('memberships')
            .select('family_id')
            .eq('user_id', userId)
            .limit(1);

          familyId = memberRows?.[0]?.family_id ?? null;
        }

        // ── 3. Tem filhos cadastrados? ────────────────────────────────────────
        let hasChild = false;
        if (familyId) {
          const { data: kids } = await supabase
            .from('children')
            .select('id')
            .eq('family_id', familyId)
            .limit(1);

          hasChild = (kids?.length ?? 0) > 0;
        }

        if (!isMounted) return;

        setStatus({
          loading:   false,
          hasFamily: !!familyId,
          hasChild,
          familyId,
        });
      } catch {
        if (!isMounted) return;
        setStatus({ loading: false, hasFamily: false, hasChild: false, familyId: null });
      }
    }

    check();
    return () => { isMounted = false; };
  }, [userId]);

  return status;
}
