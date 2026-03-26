import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';
import type { ChildSexAtBirth } from '@/types/child';
import { normalizeChildSexAtBirth } from '@/types/child';

type DbChild = Tables<'children'>;

export type Child = Omit<DbChild, 'sex_at_birth'> & {
  sex_at_birth: ChildSexAtBirth;
};

interface ActiveChildContextValue {
  children: Child[];
  activeChild: Child | null;
  activeChildId: string | null;
  setActiveChildId: (id: string) => void;
  familyId: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  getAgeLabel: (birthDate: string) => string;
}

const ActiveChildContext = createContext<ActiveChildContextValue | null>(null);

export function ActiveChildProvider({ children: reactChildren }: { children: ReactNode }) {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // 1. Find family owned by user (primary) or joined via membership
      const { data: ownedFamilies, error: fErr } = await supabase
        .from('families')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      if (fErr) throw fErr;

      let fid = ownedFamilies?.[0]?.id ?? null;

      if (!fid) {
  const { data: memberFamilies, error: mErr } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1);

  if (mErr) throw mErr;
  fid = memberFamilies?.[0]?.family_id ?? null;
}
      setFamilyId(fid);

      if (!fid) {
        setChildren([]);
        setLoading(false);
        return;
      }

      // 2. Load children for that family
      const { data: kidsData, error: kErr } = await supabase
        .from('children')
        .select('*')
        .eq('family_id', fid)
        .order('created_at', { ascending: true });

      if (kErr) throw kErr;

     const kids: Child[] = (kidsData ?? []).map((row) => ({
  ...row,
  sex_at_birth:
    normalizeChildSexAtBirth(row.sex_at_birth) ??
    normalizeChildSexAtBirth(row.sex) ??
    'unknown',
}));

setChildren(kids);

      // Preserve active selection across refetches; default to first
      setActiveChildId(prev => {
        if (prev && kids.find(k => k.id === prev)) return prev;
        return kids[0]?.id ?? null;
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar filhos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const activeChild = children.find(c => c.id === activeChildId) ?? null;

  function getAgeLabel(birthDate: string): string {
    const today = new Date();
    const birth = new Date(birthDate + 'T00:00:00');
    const diffMs = today.getTime() - birth.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30.44);
    const years = Math.floor(months / 12);
    const remMonths = months % 12;

    if (diffDays < 30) return `${diffDays}d`;
    if (months < 24) return `${months}m`;
    if (remMonths === 0) return `${years}a`;
    return `${years}a ${remMonths}m`;
  }

  return (
    <ActiveChildContext.Provider
      value={{
        children,
        activeChild,
        activeChildId,
        setActiveChildId,
        familyId,
        loading,
        error,
        refetch: load,
        getAgeLabel,
      }}
    >
      {reactChildren}
    </ActiveChildContext.Provider>
  );
}

export function useActiveChild() {
  const ctx = useContext(ActiveChildContext);
  if (!ctx) throw new Error('useActiveChild must be used inside ActiveChildProvider');
  return ctx;
}
