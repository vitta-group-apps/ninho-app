import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingStatus {
  loading: boolean;
  hasFamily: boolean;
  hasChild: boolean;
  familyId: string | null;
}

export function useOnboardingStatus(userId: string | null): OnboardingStatus {
  const [status, setStatus] = useState<OnboardingStatus>({
    loading: true,
    hasFamily: false,
    hasChild: false,
    familyId: null,
  });

  useEffect(() => {
    if (!userId) {
      setStatus({ loading: false, hasFamily: false, hasChild: false, familyId: null });
      return;
    }

    async function check() {
      // 1. Check for family owned by user
      const { data: ownedFamilies, error: ownedErr } = await supabase
        .from('families')
        .select('id')
        .eq('owner_id', userId)
        .limit(1);

      if (ownedErr && import.meta.env.DEV) {
        console.warn('[useOnboardingStatus] families query error');
      }

      let familyId = ownedFamilies?.[0]?.id ?? null;

      // 2. If not owner, check memberships
      if (!familyId) {
        const { data: memberFamilies, error: memberErr } = await supabase
          .from('memberships')
          .select('family_id')
          .eq('user_id', userId)
          .limit(1);

        if (memberErr && import.meta.env.DEV) {
          console.warn('[useOnboardingStatus] memberships query error');
        }

        familyId = memberFamilies?.[0]?.family_id ?? null;
      }

      const hasFamily = !!familyId;

      let hasChild = false;
      if (familyId) {
        const { data: children, error: childErr } = await supabase
          .from('children')
          .select('id')
          .eq('family_id', familyId)
          .limit(1);

        if (childErr && import.meta.env.DEV) {
          console.warn('[useOnboardingStatus] children query error');
        }

        hasChild = (children?.length ?? 0) > 0;
      }

      setStatus({ loading: false, hasFamily, hasChild, familyId });
    }

    check();
  }, [userId]);

  return status;
}
