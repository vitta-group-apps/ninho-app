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
      // Check for family owned by or joined by user
      const { data: families } = await supabase
        .from('families')
        .select('id')
        .eq('owner_id', userId)
        .limit(1);

      const familyId = families?.[0]?.id ?? null;
      const hasFamily = !!familyId;

      let hasChild = false;
      if (familyId) {
        const { data: children } = await supabase
          .from('children')
          .select('id')
          .eq('family_id', familyId)
          .limit(1);
        hasChild = (children?.length ?? 0) > 0;
      }

      setStatus({ loading: false, hasFamily, hasChild, familyId });
    }

    check();
  }, [userId]);

  return status;
}
