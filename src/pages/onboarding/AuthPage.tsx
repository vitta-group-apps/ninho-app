/**
 * AuthPage — Magic Link authentication
 *
 * Flow:
 *  1. User types email
 *  2. Tap "Enviar link de acesso"
 *  3. Supabase sends Magic Link → redirectTo /auth/callback
 *  4. Show "verifique seu e-mail" screen (no OTP input)
 *  5. User taps link in email → lands on /auth/callback → session set → redirect
 *
 * Social OAuth (Google) is wired via Supabase redirectTo /auth/callback.
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import simboloNinho from '@/assets/simbolo-ninho.png';

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

type Screen = 'form' | 'check-email';

const ERROR_LABELS: Record<string, string> = {
  link_invalido: 'Este link expirou ou já foi usado. Solicite um novo abaixo.',
  erro_interno:  'Ocorreu um erro inesperado. Tente novamente.',
};

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const callbackError = searchParams.get('error');

  const [screen, setScreen]     = useState<Screen>('form');
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(callbackError ? (ERROR_LABELS[callbackError] ?? 'Algo deu errado.') : '');
  const [googleLoading, setGoogleLoading] = useState(false);

  const redirectTo = `${window.location.origin}/auth/callback`;

  /* ─── Magic Link ─────────────────────────────────────── */
  async function sendMagicLink() {
    if (!isValidEmail(email)) {
      setError('Digite um e-mail válido.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectTo,
        },
      });
      if (err) throw err;
      setScreen('check-email');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Não conseguimos enviar o link. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  /* ─── Google OAuth ───────────────────────────────────── */
  async function signInWithGoogle() {
    setGoogleLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (err) {
      setError('Não foi possível acessar com Google.');
      setGoogleLoading(false);
    }
    // On success, browser redirects away — no need to reset loading
  }

  /* ─── Shared visual tokens ───────────────────────────── */
  const mauve   = '#806e84';
  const sand    = '#F8F5F0';
  const muted   = '#7A7A7A';
  const surface = '#E8E8E2';

  /* ─── Check-email screen ─────────────────────────────── */
  if (screen === 'check-email') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-10"
        style={{ backgroundColor: sand }}>

        {/* Grain */}
        <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

        <div className="relative w-full max-w-sm text-center">
          {/* Envelope illustration */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#f0eaf0' }}>
            <span style={{ fontSize: 40 }}>📬</span>
          </div>

          <h1 className="text-[24px] font-bold mb-2"
            style={{ fontFamily: 'Quicksand, sans-serif', color: '#2C2C2C' }}>
            Verifique seu e-mail
          </h1>

          <p className="text-[14px] leading-relaxed mb-2"
            style={{ fontFamily: 'Nunito, sans-serif', color: muted }}>
            Enviamos um link de acesso para
          </p>
          <p className="text-[15px] font-bold mb-6"
            style={{ fontFamily: 'Nunito, sans-serif', color: mauve }}>
            {email}
          </p>

          <div className="rounded-2xl p-4 mb-8 text-left"
            style={{ backgroundColor: '#f0eaf0', border: '1px solid #e3d9e2' }}>
            <p className="text-[13px] leading-relaxed"
              style={{ fontFamily: 'Nunito, sans-serif', color: '#5a4a5e' }}>
              Clique no link que chegou no e-mail para entrar no Ninho.
              O link expira em <strong>60 minutos</strong>.
            </p>
          </div>

          <button
            onClick={() => { setScreen('form'); setError(''); }}
            className="w-full rounded-2xl font-semibold text-[15px] transition-all"
            style={{
              height: 52,
              backgroundColor: mauve,
              color: 'white',
              fontFamily: 'Nunito, sans-serif',
              border: 'none',
              cursor: 'pointer',
            }}>
            Usar outro e-mail
          </button>

          <button
            onClick={sendMagicLink}
            disabled={loading}
            className="w-full text-center text-[13px] font-medium mt-3"
            style={{
              color: muted,
              fontFamily: 'Nunito, sans-serif',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}>
            {loading ? 'Reenviando…' : 'Reenviar link'}
          </button>
        </div>
      </div>
    );
  }

  /* ─── Main form screen ───────────────────────────────── */
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: sand }}>

      {/* Grain */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* ── Mauve header ── */}
      <div className="relative overflow-hidden flex-shrink-0 px-5 pb-8"
        style={{
          backgroundColor: mauve,
          borderRadius: '0 0 28px 28px',
          paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
        }}>

        <div className="relative z-10 flex items-center gap-2 mb-5">
          <img src={simboloNinho} alt="Ninho"
            style={{ width: 18, height: 18, filter: 'brightness(0) invert(1)', opacity: 0.75 }} />
          <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, fontWeight: 700,
            color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Ninho
          </span>
        </div>

        <h1 className="relative z-10 text-[26px] font-bold leading-tight"
          style={{ color: 'white', fontFamily: 'Quicksand, sans-serif' }}>
          Bem-vinda de volta 👋
        </h1>
        <p className="relative z-10 text-[13px] mt-1 leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Nunito, sans-serif' }}>
          Digite seu e-mail para receber um link de acesso seguro.
        </p>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col px-5 pt-7 pb-8 relative z-10">

        {/* Error banner */}
        {error && (
          <div className="px-3 py-2.5 rounded-xl mb-5"
            style={{ backgroundColor: '#FCEAEA', border: '1px solid #f5caca' }}>
            <p className="text-xs font-medium"
              style={{ color: '#C04A4A', fontFamily: 'Nunito, sans-serif' }}>
              {error}
            </p>
          </div>
        )}

        {/* Email field */}
        <div className="mb-5">
          <label className="block mb-[5px]"
            style={{ fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700,
              color: muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            E-mail
          </label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMagicLink()}
            placeholder="seu@email.com"
            className="w-full px-4 py-3 outline-none transition-all"
            style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: 16,
              backgroundColor: surface,
              border: `1.5px solid ${isValidEmail(email) ? mauve : 'transparent'}`,
              borderRadius: 12,
              color: '#2C2C2C',
            }}
            onFocus={e => { if (!isValidEmail(email)) e.target.style.borderColor = '#C7B3C5'; }}
            onBlur={e => { if (!isValidEmail(email)) e.target.style.borderColor = 'transparent'; }}
          />
        </div>

        {/* Magic Link CTA */}
        <button
          onClick={sendMagicLink}
          disabled={loading || !isValidEmail(email)}
          className="w-full rounded-2xl font-bold text-[15px] text-white transition-all mb-4"
          style={{
            height: 52,
            backgroundColor: mauve,
            fontFamily: 'Nunito, sans-serif',
            opacity: loading || !isValidEmail(email) ? 0.45 : 1,
            border: 'none',
            cursor: isValidEmail(email) ? 'pointer' : 'default',
          }}>
          {loading ? 'Enviando…' : 'Enviar link de acesso →'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ backgroundColor: '#E5E0D8' }} />
          <span className="text-[11px]"
            style={{ color: muted, fontFamily: 'Nunito, sans-serif' }}>
            ou continue com
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#E5E0D8' }} />
        </div>

        {/* Google OAuth */}
        <button
          onClick={signInWithGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 rounded-2xl font-semibold text-[14px] transition-all"
          style={{
            height: 52,
            backgroundColor: 'white',
            color: '#3C3C3C',
            fontFamily: 'Nunito, sans-serif',
            border: '1.5px solid #E5E0D8',
            cursor: 'pointer',
            opacity: googleLoading ? 0.6 : 1,
          }}>
          {/* Google SVG */}
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.8961 31.8988 35.1807 34.5356 32.6271 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" fill="#4285F4"/>
            <path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6358 36.2111C30.4051 37.675 27.5349 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.01074V34.7825C7.10984 42.8868 15.4348 48.0016 24.48 48.0016Z" fill="#34A853"/>
            <path d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.01096C-0.371328 20.0112 -0.371328 28.0009 3.01096 34.7825L11.0051 28.6006Z" fill="#FBBC04"/>
            <path d="M24.48 9.49932C27.7059 9.44641 30.8276 10.7339 33.1333 13.0395L40.5383 5.63467C36.1773 2.50219 30.906 0.784536 24.48 0.784536C15.4348 0.784536 7.10984 5.89941 3.01074 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" fill="#EA4335"/>
          </svg>
          {googleLoading ? 'Conectando…' : 'Continuar com Google'}
        </button>

        <div className="flex-1" />

        {/* Privacy note */}
        <p className="text-center text-[11px] mt-6 leading-relaxed"
          style={{ color: '#AAAAAA', fontFamily: 'Nunito, sans-serif' }}>
          Ao continuar, você concorda com nossos{' '}
          <span style={{ color: mauve, textDecoration: 'underline', cursor: 'pointer' }}>
            Termos de Uso
          </span>{' '}
          e{' '}
          <span style={{ color: mauve, textDecoration: 'underline', cursor: 'pointer' }}>
            Política de Privacidade
          </span>.
        </p>
      </div>
    </div>
  );
}
