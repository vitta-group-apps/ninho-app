import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;  // profiles.id = auth.users.id
  full_name: string | null;
  onboarding_complete: boolean | null;
  avatar_url: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isFirstTime: boolean;
  isLoggedIn: boolean;
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
    // profiles.id = auth.users.id — chave primária compartilhada (sem coluna user_id separada)
    async function fetchProfile(userId: string): Promise<Profile | null> {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, onboarding_complete, avatar_url')  // onboarding_complete added via migration
        .eq('id', userId)  // ← profiles.id = auth.users.id (sem coluna user_id separada)
        .maybeSingle();
      return data as Profile | null;
    }

    function buildState(
      session: Session | null,
      profile: Profile | null
    ): AuthState {
      const isFirstTime =
        !!session && (!profile?.full_name || !profile?.onboarding_complete);
      const isLoggedIn =
        !!session && !!profile?.full_name && !!profile?.onboarding_complete;
      return {
        user: session?.user ?? null,
        session,
        profile,
        loading: false,
        isFirstTime,
        isLoggedIn,
      };
    }

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let profile: Profile | null = null;
        if (session?.user) {
          profile = await fetchProfile(session.user.id);
        }
        setState(buildState(session, profile));
      } catch (err) {
        // Supabase não inicializado (env vars ausentes) — sai do loading sem travar
        console.error('[useAuth] Falha ao inicializar sessão Supabase:', err);
        setState(buildState(null, null));
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          let profile: Profile | null = null;
          if (session?.user) {
            profile = await fetchProfile(session.user.id);
          }
          setState(buildState(session, profile));
        } catch (err) {
          console.error('[useAuth] onAuthStateChange error:', err);
          setState(buildState(null, null));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return state;
}

export async function signOut() {
  await supabase.auth.signOut();
}
