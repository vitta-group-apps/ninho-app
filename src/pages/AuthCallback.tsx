/**
 * AuthCallback — Magic Link landing page
 *
 * When a user clicks a Magic Link email, Supabase redirects them to:
 *   https://app.vercel.app/auth/callback#access_token=…&type=magiclink
 *
 * The Supabase JS client automatically picks up the hash fragment, exchanges
 * the token, sets the session, and fires onAuthStateChange.
 * This component just waits for that to complete, then routes to the right place.
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import simboloNinho from '@/assets/simbolo-ninho.png';

export default function AuthCallback() {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    async function resolveSession() {
      try {
        // Give Supabase ~300 ms to auto-parse the URL hash and set the session.
        // onAuthStateChange will fire if a token is present in the hash.
        await new Promise(resolve => setTimeout(resolve, 300));

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          // Token missing or already used — send back to auth with a hint
          navigate('/onboarding/auth?error=link_invalido', { replace: true });
          return;
        }

        // Session is active. Check onboarding state.
        const userId = session.user.id;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, onboarding_complete')
          .eq('id', userId)
          .maybeSingle();

        // Decision tree based on schema v2 data
        if (profile?.onboarding_complete) {
          navigate('/home', { replace: true });
          return;
        }

        if (profile?.full_name) {
          // Has name — check family (uses families_select_owner policy)
          const { data: families } = await supabase
            .from('families')
            .select('id')
            .eq('owner_user_id', userId)
            .limit(1);

          if (families && families.length > 0) {
            sessionStorage.setItem('onboarding_family_id', families[0].id);
            navigate('/onboarding/child', { replace: true });
          } else {
            navigate('/onboarding/family', { replace: true });
          }
          return;
        }

        navigate('/onboarding/nome', { replace: true });
      } catch (err) {
        console.error('[AuthCallback] Erro ao processar sessão:', err);
        navigate('/onboarding/auth?error=erro_interno', { replace: true });
      }
    }

    resolveSession();
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6"
      style={{ backgroundColor: '#806e84' }}
    >
      {/* Grain overlay */}
      <div
        className="fixed inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <img
        src={simboloNinho}
        alt="Ninho"
        style={{
          width: 48,
          height: 48,
          filter: 'brightness(0) invert(1)',
          opacity: 0.9,
        }}
      />

      {/* Spinner */}
      <div
        className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'rgba(255,255,255,0.5)', borderTopColor: 'transparent' }}
      />

      <p
        className="text-[14px] text-center"
        style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Nunito, sans-serif' }}
      >
        Verificando seu acesso…
      </p>
    </div>
  );
}
