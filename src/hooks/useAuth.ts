import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  full_name: string | null;
  onboarding_complete: boolean | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isFirstTime: boolean;  // logged in but no name yet (or onboarding incomplete)
  isLoggedIn: boolean;   // fully onboarded
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    isFirstTime: false,
    isLoggedIn: false,
  });

  useEffect(() => {
    async function fetchProfile(userId: string) {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, onboarding_complete')
        .eq('user_id', userId)
        .maybeSingle();

      return (data as unknown) as Profile | null;
    }

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      let profile: Profile | null = null;
      if (session?.user) {
        profile = await fetchProfile(session.user.id);
      }
      const isFirstTime = !!session && (!profile?.full_name || !profile?.onboarding_complete);
      const isLoggedIn = !!session && !!profile?.full_name && !!profile?.onboarding_complete;
      setState({
        user: session?.user ?? null,
        session,
        profile,
        loading: false,
        isFirstTime,
        isLoggedIn,
      });
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        let profile: Profile | null = null;
        if (session?.user) {
          profile = await fetchProfile(session.user.id);
        }
        const isFirstTime = !!session && (!profile?.full_name || !profile?.onboarding_complete);
        const isLoggedIn = !!session && !!profile?.full_name && !!profile?.onboarding_complete;
        setState({
          user: session?.user ?? null,
          session,
          profile,
          loading: false,
          isFirstTime,
          isLoggedIn,
        });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return state;
}

export async function signOut() {
  await supabase.auth.signOut();
}
