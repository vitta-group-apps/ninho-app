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
    let isMounted = true;

    if (!userId) {
      setStatus({
        loading: false,
        hasFamily: false,
        hasChild: false,
        familyId: null,
      });
      return;
    }

    async function check() {
      try {
        const { data: ownedFamilies } = await supabase
          .from('families')
          .select('id')
          .eq('owner_id', userId)
          .limit(1);

        let familyId = ownedFamilies?.[0]?.id ?? null;

        if (!familyId) {
          const { data: memberFamilies } = await supabase
            .from('family_members')
            .select('family_id')
            .eq('user_id', userId)
            .eq('status', 'active')
            .limit(1);

          familyId = memberFamilies?.[0]?.family_id ?? null;
        }

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

        if (!isMounted) return;

        setStatus({
          loading: false,
          hasFamily,
          hasChild,
          familyId,
        });
      } catch {
        if (!isMounted) return;

        setStatus({
          loading: false,
          hasFamily: false,
          hasChild: false,
          familyId: null,
        });
      }
    }

    check();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return status;
}
