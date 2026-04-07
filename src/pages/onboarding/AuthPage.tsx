/**
 * AuthPage — Ninho v2 Auth
 *
 * Fluxo principal: OTP 6 dígitos via e-mail (baixa fricção, sem senha)
 * Fallback: Magic Link — enviado no mesmo e-mail, funciona se o código expirar
 *
 * Telas:
 *   'email'   → input de e-mail
 *   'otp'     → 6 caixas de dígito + fallback "clique no link"
 *
 * Após verificação do OTP, Supabase seta a sessão → onAuthStateChange dispara
 * → useAuth detecta → App.tsx roteia para o passo correto de onboarding.
 */

import { useState, useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import simboloNinho from '@/assets/simbolo-ninho.png';

/* ─── helpers ─────────────────────────────────────────────────── */
function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

const ERROR_LABELS: Record<string, string> = {
  link_invalido: 'Este link expirou ou já foi usado. Solicite um novo abaixo.',
  erro_interno:  'Ocorreu um erro inesperado. Tente novamente.',
};

/* ─── design tokens ────────────────────────────────────────────── */
const C = {
  mauve:   '#806e84',
  mauveL:  '#C7B3C5',
  sand:    '#F8F5F0',
  surface: '#E8E8E2',
  muted:   '#7A7A7A',
  dark:    '#2C2C2C',
  err:     '#C04A4A',
  errBg:   '#FCEAEA',
  errBdr:  '#f5caca',
  infoBg:  '#f0eaf0',
  infoBdr: '#e3d9e2',
};

type Screen = 'email' | 'otp';

const REDIRECT = typeof window !== 'undefined'
  ? `${window.location.origin}/auth/callback`
  : '';

/* ─── OTP digit input ──────────────────────────────────────────── */
function OtpInput({
  value,
  onChange,
  onVerify,
  loading,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  onVerify: () => void;
  loading: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(idx: number, char: string) {
    const digit = char.replace(/\D/g, '').slice(-1);
    const next = [...value];
    next[idx] = digit;
    onChange(next);
    if (digit && idx < 5) refs.current[idx + 1]?.focus();
    if (next.every(d => d) && next.join('').length === 6) {
      // auto-verify when all 6 filled
      setTimeout(onVerify, 80);
    }
  }

  function handleKeyDown(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
    if (e.key === 'Enter' && value.every(d => d)) onVerify();
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = Array(6).fill('').map((_, i) => text[i] ?? '');
    onChange(next);
    refs.current[Math.min(text.length, 5)]?.focus();
    if (text.length === 6) setTimeout(onVerify, 80);
  }

  return (
    <div className="flex gap-3 justify-center">
      {Array(6).fill(0).map((_, idx) => (
        <input
          key={idx}
          ref={el => { refs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] ?? ''}
          disabled={loading}
          onChange={e => handleChange(idx, e.target.value)}
          onKeyDown={e => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          className="w-11 h-14 text-center text-[22px] font-bold outline-none rounded-xl transition-all"
          style={{
            fontFamily: 'Quicksand, sans-serif',
            backgroundColor: value[idx] ? C.mauve : C.surface,
            color: value[idx] ? 'white' : C.dark,
            border: `2px solid ${value[idx] ? C.mauve : 'transparent'}`,
            caretColor: C.mauve,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────── */
export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const callbackError = searchParams.get('error');

  const [screen, setScreen]         = useState<Screen>('email');
  const [email, setEmail]           = useState('');
  const [otp, setOtp]               = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]           = useState(
    callbackError ? (ERROR_LABELS[callbackError] ?? 'Algo deu errado.') : ''
  );
  const [resendCooldown, setResendCooldown] = useState(0);

  /* ── Send OTP ── */
  async function sendOtp() {
    if (!isValidEmail(email)) { setError('Digite um e-mail válido.'); return; }
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: REDIRECT,   // Magic Link fallback no mesmo e-mail
        },
      });
      if (err) throw err;
      setOtp(Array(6).fill(''));
      setScreen('otp');
      startCooldown();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Não conseguimos enviar o código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  /* ── Resend cooldown ── */
  function startCooldown(seconds = 60) {
    setResendCooldown(seconds);
    const t = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(t); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  /* ── Verify OTP ── */
  async function verifyOtp() {
    const code = otp.join('');
    if (code.length < 6) { setError('Digite os 6 dígitos do código.'); return; }
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code,
        type: 'email',
      });
      if (err) throw err;
      // Session set → onAuthStateChange → useAuth → App.tsx routes automatically
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Código inválido ou expirado.');
      setOtp(Array(6).fill(''));
      setLoading(false);
    }
  }

  /* ── Google OAuth ── */
  async function signInWithGoogle() {
    setGoogleLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: REDIRECT },
    });
    if (err) {
      setError('Não foi possível acessar com Google.');
      setGoogleLoading(false);
    }
  }

  /* ─── Shared header ─────────────────────────────────────────── */
  const Header = ({ step, title, subtitle }: { step: string; title: string; subtitle: string }) => (
    <div
      className="relative overflow-hidden flex-shrink-0 px-5 pb-8"
      style={{
        backgroundColor: C.mauve,
        borderRadius: '0 0 28px 28px',
        paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
      }}
    >
      {/* Grain */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      <div className="relative z-10 flex items-center gap-2 mb-5">
        <img src={simboloNinho} alt="Ninho"
          style={{ width: 18, height: 18, filter: 'brightness(0) invert(1)', opacity: 0.75 }} />
        <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, fontWeight: 700,
          color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          {step}
        </span>
      </div>

      <h1 className="relative z-10 text-[26px] font-bold leading-tight"
        style={{ color: 'white', fontFamily: 'Quicksand, sans-serif' }}>
        {title}
      </h1>
      <p className="relative z-10 text-[13px] mt-1 leading-relaxed"
        style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Nunito, sans-serif' }}>
        {subtitle}
      </p>
    </div>
  );

  /* ─── Error banner ──────────────────────────────────────────── */
  const ErrorBanner = () => error ? (
    <div className="px-3 py-2.5 rounded-xl mb-5"
      style={{ backgroundColor: C.errBg, border: `1px solid ${C.errBdr}` }}>
      <p className="text-xs font-medium"
        style={{ color: C.err, fontFamily: 'Nunito, sans-serif' }}>
        {error}
      </p>
    </div>
  ) : null;

  /* ═══════════════════════════════════════════════════════════
     SCREEN: OTP
  ═══════════════════════════════════════════════════════════ */
  if (screen === 'otp') {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.sand }}>
        <Header
          step="Verificação"
          title="Código enviado 📬"
          subtitle={`Digite o código de 6 dígitos que chegou em ${email}`}
        />

        <div className="flex-1 flex flex-col px-5 pt-7 pb-8">
          <ErrorBanner />

          <OtpInput value={otp} onChange={setOtp} onVerify={verifyOtp} loading={loading} />

          {/* Verify button */}
          <button
            onClick={verifyOtp}
            disabled={loading || otp.join('').length < 6}
            className="w-full rounded-2xl font-bold text-[15px] text-white transition-all mt-7 mb-4"
            style={{
              height: 52,
              backgroundColor: C.mauve,
              fontFamily: 'Nunito, sans-serif',
              opacity: loading || otp.join('').length < 6 ? 0.4 : 1,
              border: 'none',
              cursor: 'pointer',
            }}>
            {loading ? 'Verificando…' : 'Entrar →'}
          </button>

          {/* Magic Link info box */}
          <div className="rounded-xl px-4 py-3 mb-5"
            style={{ backgroundColor: C.infoBg, border: `1px solid ${C.infoBdr}` }}>
            <p className="text-[12px] leading-relaxed"
              style={{ color: '#5a4a5e', fontFamily: 'Nunito, sans-serif' }}>
              ✉️ Também enviamos um <strong>link de acesso</strong> no mesmo e-mail —
              se preferir, basta clicar nele. Válido por 60 minutos.
            </p>
          </div>

          {/* Resend */}
          <button
            onClick={() => { sendOtp(); }}
            disabled={resendCooldown > 0 || loading}
            className="w-full text-center text-[13px] font-medium"
            style={{
              color: resendCooldown > 0 ? '#BBBBBB' : C.muted,
              fontFamily: 'Nunito, sans-serif',
              background: 'none',
              border: 'none',
              cursor: resendCooldown > 0 ? 'default' : 'pointer',
            }}>
            {resendCooldown > 0
              ? `Reenviar em ${resendCooldown}s`
              : 'Reenviar código'}
          </button>

          <button
            onClick={() => { setScreen('email'); setError(''); setOtp(Array(6).fill('')); }}
            className="w-full text-center text-[12px] mt-2"
            style={{
              color: '#BBBBBB',
              fontFamily: 'Nunito, sans-serif',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}>
            ← Usar outro e-mail
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     SCREEN: EMAIL
  ═══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.sand }}>
      <Header
        step="Ninho · Acesso"
        title="Bem-vinda de volta 👋"
        subtitle="Digite seu e-mail para receber um código de verificação."
      />

      <div className="flex-1 flex flex-col px-5 pt-7 pb-8">
        <ErrorBanner />

        {/* Email field */}
        <div className="mb-5">
          <label className="block mb-[5px]"
            style={{ fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700,
              color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            E-mail
          </label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && sendOtp()}
            placeholder="seu@email.com"
            className="w-full px-4 py-3 outline-none transition-all"
            style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: 16,
              backgroundColor: C.surface,
              border: `1.5px solid ${isValidEmail(email) ? C.mauve : 'transparent'}`,
              borderRadius: 12,
              color: C.dark,
            }}
            onFocus={e => { if (!isValidEmail(email)) e.target.style.borderColor = C.mauveL; }}
            onBlur={e => { if (!isValidEmail(email)) e.target.style.borderColor = 'transparent'; }}
          />
        </div>

        {/* Send code CTA */}
        <button
          onClick={sendOtp}
          disabled={loading || !isValidEmail(email)}
          className="w-full rounded-2xl font-bold text-[15px] text-white transition-all mb-4"
          style={{
            height: 52,
            backgroundColor: C.mauve,
            fontFamily: 'Nunito, sans-serif',
            opacity: loading || !isValidEmail(email) ? 0.4 : 1,
            border: 'none',
            cursor: isValidEmail(email) ? 'pointer' : 'default',
          }}>
          {loading ? 'Enviando…' : 'Enviar código →'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ backgroundColor: '#E5E0D8' }} />
          <span className="text-[11px]"
            style={{ color: C.muted, fontFamily: 'Nunito, sans-serif' }}>
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
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.8961 31.8988 35.1807 34.5356 32.6271 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" fill="#4285F4"/>
            <path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6358 36.2111C30.4051 37.675 27.5349 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.01074V34.7825C7.10984 42.8868 15.4348 48.0016 24.48 48.0016Z" fill="#34A853"/>
            <path d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.01096C-0.371328 20.0112 -0.371328 28.0009 3.01096 34.7825L11.0051 28.6006Z" fill="#FBBC04"/>
            <path d="M24.48 9.49932C27.7059 9.44641 30.8276 10.7339 33.1333 13.0395L40.5383 5.63467C36.1773 2.50219 30.906 0.784536 24.48 0.784536C15.4348 0.784536 7.10984 5.89941 3.01074 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" fill="#EA4335"/>
          </svg>
          {googleLoading ? 'Conectando…' : 'Continuar com Google'}
        </button>

        <div className="flex-1" />

        <p className="text-center text-[11px] mt-6 leading-relaxed"
          style={{ color: '#AAAAAA', fontFamily: 'Nunito, sans-serif' }}>
          Ao continuar, você concorda com os{' '}
          <span style={{ color: C.mauve }}>Termos de Uso</span> e{' '}
          <span style={{ color: C.mauve }}>Política de Privacidade</span>.
        </p>
      </div>
    </div>
  );
}
