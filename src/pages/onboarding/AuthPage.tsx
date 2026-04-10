/**
 * NINHO — AuthPage v4 · Auth Completo
 *
 * Fluxo:
 *   Social (Google/Apple) → OAuth redirect → useSession resolve
 *   Email → signInWithOtp → tela de código OTP 6 dígitos → verifyOtp
 *                         → onAuthStateChange SIGNED_IN → useSession resolve
 *
 * Zero componentes do DS — apenas tokens brutos + Framer Motion.
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase, translateSupabaseError } from '@/lib/supabase';

// ─── tokens ──────────────────────────────────────────────────────────────────

const T = {
  mauve50:  '#faf3fc',
  mauve100: '#f4e8f7',
  mauve200: '#e8d4ed',
  mauve300: '#d8b9df',
  mauve500: '#8b5e96',
  mauve700: '#6e2880',
  sage300:  '#b8dbcd',
  stone50:  '#f8f7f7',
  stone100: '#eeedec',
  stone200: '#e2e0df',
  stone300: '#ceccca',
  stone500: '#a9a5a2',
  stone700: '#706d69',
  stone800: '#524f4c',
  stone900: '#3a3836',
  clay50:   '#fcf4f3',
  clay200:  '#ecd3d0',
  clay800:  '#671d14',
  white:    '#ffffff',
  black:    '#0d0d0d',
} as const;

const Font = {
  h: "'Quicksand', system-ui, sans-serif",
  b: "'Nunito', system-ui, sans-serif",
} as const;

// ─── icons ────────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M18.1 10.2c0-.63-.06-1.25-.16-1.84H10v3.48h4.54a3.88 3.88 0 0 1-1.68 2.55v2.12h2.72c1.59-1.46 2.52-3.62 2.52-6.31Z" fill="#4285F4"/>
      <path d="M10 18.5c2.28 0 4.19-.75 5.58-2.04l-2.72-2.12c-.75.5-1.72.8-2.86.8-2.2 0-4.06-1.49-4.73-3.48H2.46v2.19A8.5 8.5 0 0 0 10 18.5Z" fill="#34A853"/>
      <path d="M5.27 11.66A5.1 5.1 0 0 1 5 10c0-.58.1-1.14.27-1.66V6.15H2.46A8.5 8.5 0 0 0 1.5 10c0 1.37.33 2.67.96 3.85l2.81-2.19Z" fill="#FBBC05"/>
      <path d="M10 4.86c1.24 0 2.35.43 3.23 1.26l2.42-2.42A8.46 8.46 0 0 0 10 1.5 8.5 8.5 0 0 0 2.46 6.15l2.81 2.19C5.94 6.35 7.8 4.86 10 4.86Z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="17" height="20" viewBox="0 0 17 20" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M14.03 10.6c-.02-2.08 1.7-3.08 1.78-3.13-.97-1.42-2.48-1.61-3.01-1.63-1.3-.13-2.52.77-3.17.77-.66 0-1.66-.74-2.74-.72C5.2 5.91 3.91 6.68 3.2 7.92 1.83 10.38 2.85 14.08 4.2 16.11c.65.94 1.43 2.01 2.45 1.97.98-.04 1.35-.63 2.53-.63 1.18 0 1.52.63 2.55.61 1.06-.02 1.73-.96 2.38-1.9.75-1.09 1.06-2.15 1.08-2.2-.02-.01-2.07-.8-2.09-3.14l-.07-.22ZM11.49 4.27c.54-.66.9-1.57.8-2.48-.78.03-1.71.52-2.26 1.17-.5.58-.93 1.5-.82 2.39.87.07 1.74-.45 2.28-1.08Z" fill="white"/>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12H19M14 7l5 5-5 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Spinner({ color = 'white' }: { color?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      style={{
        width: 16, height: 16, borderRadius: '50%',
        border: `2px solid ${color}40`,
        borderTopColor: color,
        flexShrink: 0,
      }}
    />
  );
}

// ─── OTP code input (6 dígitos) ───────────────────────────────────────────────

const DIGIT_COUNT = 6;

interface OtpCodeInputProps {
  onComplete: (code: string) => void;
  loading: boolean;
  hasError: boolean;
}

function OtpCodeInput({ onComplete, loading, hasError }: OtpCodeInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(DIGIT_COUNT).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(DIGIT_COUNT).fill(null));

  const focusAt = (idx: number) => {
    const el = inputRefs.current[Math.max(0, Math.min(DIGIT_COUNT - 1, idx))];
    el?.focus();
  };

  const handleChange = useCallback((idx: number, val: string) => {
    // handle paste: user pastes full code into any box
    if (val.length > 1) {
      const cleaned = val.replace(/\D/g, '').slice(0, DIGIT_COUNT);
      if (!cleaned) return;
      const next = Array(DIGIT_COUNT).fill('');
      cleaned.split('').forEach((c, i) => { next[i] = c; });
      setDigits(next);
      const focusIdx = Math.min(cleaned.length, DIGIT_COUNT - 1);
      setTimeout(() => focusAt(focusIdx), 0);
      if (cleaned.length === DIGIT_COUNT) {
        setTimeout(() => onComplete(cleaned), 50);
      }
      return;
    }

    const char = val.replace(/\D/g, '');
    const next = [...digits];
    next[idx] = char;
    setDigits(next);

    if (char && idx < DIGIT_COUNT - 1) {
      focusAt(idx + 1);
    }

    const full = next.join('');
    if (full.length === DIGIT_COUNT && !full.includes('')) {
      setTimeout(() => onComplete(full), 50);
    }
  }, [digits, onComplete]);

  const handleKeyDown = useCallback((idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...digits];
      if (next[idx]) {
        next[idx] = '';
        setDigits(next);
      } else if (idx > 0) {
        next[idx - 1] = '';
        setDigits(next);
        focusAt(idx - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusAt(idx - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusAt(idx + 1);
    }
  }, [digits]);

  const boxBorder = hasError
    ? `1.5px solid ${T.clay200}`
    : `1.5px solid ${T.stone200}`;

  const boxBg = hasError ? T.clay50 : T.stone50;

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={DIGIT_COUNT} // allow paste on first box
          value={d}
          disabled={loading}
          autoFocus={i === 0}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onFocus={e => e.target.select()}
          style={{
            width: 46, height: 58,
            borderRadius: 14,
            border: boxBorder,
            background: boxBg,
            fontFamily: Font.h,
            fontWeight: 700,
            fontSize: '1.4rem',
            color: hasError ? T.clay800 : T.stone900,
            textAlign: 'center',
            outline: 'none',
            caretColor: T.mauve500,
            transition: 'border-color 0.15s, background 0.15s',
            opacity: loading ? 0.6 : 1,
          }}
        />
      ))}
    </div>
  );
}

// ─── OTP verify screen ────────────────────────────────────────────────────────

interface OtpVerifyScreenProps {
  email: string;
  onBack: () => void;
  onResend: () => Promise<void>;
}

function OtpVerifyScreen({ email, onBack, onResend }: OtpVerifyScreenProps) {
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resentAt,  setResentAt]  = useState<number | null>(null);

  const canResend = !resentAt || Date.now() - resentAt > 60_000;

  async function handleComplete(code: string) {
    setCodeError(null);
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    setVerifying(false);
    if (error) {
      setCodeError('Código inválido ou expirado. Tenta de novo.');
    }
    // on success: onAuthStateChange fires SIGNED_IN → useSession resolves appState automatically
  }

  async function handleResend() {
    if (!canResend || resending) return;
    setResending(true);
    await onResend();
    setResending(false);
    setResentAt(Date.now());
    setCodeError(null);
    toast.success('Novo código enviado!');
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        minHeight: '100dvh',
        background: `radial-gradient(ellipse 100% 50% at 50% -10%, ${T.mauve200} 0%, ${T.white} 65%)`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 28px', gap: 36, textAlign: 'center',
      }}
    >
      {/* icon */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          width: 88, height: 88, borderRadius: '50%',
          background: `linear-gradient(135deg, ${T.mauve100}, ${T.mauve200})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.6rem',
        }}
        aria-hidden="true"
      >
        📬
      </motion.div>

      {/* headline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 style={{
          fontFamily: Font.h, fontWeight: 700,
          fontSize: 'clamp(1.7rem, 7vw, 2rem)',
          color: T.stone900, margin: 0, lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}>
          Enviamos um código<br />para seu e-mail
        </h2>
        <p style={{ fontFamily: Font.b, fontSize: 15, color: T.stone500, margin: 0, lineHeight: 1.5 }}>
          Digite os 6 dígitos enviados para<br />
          <strong style={{ color: T.stone800, fontWeight: 600 }}>{email}</strong>
        </p>
      </div>

      {/* 6-digit input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 340 }}>
        <OtpCodeInput
          onComplete={handleComplete}
          loading={verifying}
          hasError={!!codeError}
        />

        {/* loading / error feedback */}
        <AnimatePresence>
          {verifying && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: Font.b, fontSize: 14, color: T.mauve500,
              }}
            >
              <Spinner color={T.mauve500} />
              Verificando…
            </motion.div>
          )}
          {codeError && !verifying && (
            <motion.div
              key="code-err"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="alert"
              style={{
                borderRadius: 14, padding: '10px 16px',
                background: T.clay50, border: `1px solid ${T.clay200}`,
              }}
            >
              <p style={{ fontFamily: Font.b, fontSize: 13, color: T.clay800, margin: 0 }}>
                {codeError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* actions */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <button
          onClick={handleResend}
          disabled={!canResend || resending}
          style={{
            background: 'none', border: 'none',
            fontFamily: Font.b, fontSize: 14, fontWeight: 600,
            color: canResend ? T.mauve500 : T.stone300,
            cursor: canResend && !resending ? 'pointer' : 'not-allowed',
            padding: '6px 0',
          }}
        >
          {resending ? 'Reenviando…' : 'Reenviar código'}
        </button>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none',
            fontFamily: Font.b, fontSize: 13, color: T.stone500,
            cursor: 'pointer', padding: '4px 0',
          }}
        >
          ← Usar outro e-mail
        </button>
      </div>
    </motion.div>
  );
}

// ─── main auth screen ─────────────────────────────────────────────────────────

type Screen = 'main' | 'otp-verify' | 'password';
type SocialLoading = 'google' | 'apple' | null;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthPage() {
  const [screen,        setScreen]        = useState<Screen>('main');
  const [email,         setEmail]         = useState('');
  const [emailTouched,  setEmailTouched]  = useState(false);
  const [password,      setPassword]      = useState('');
  const [magicLoading,  setMagicLoading]  = useState(false);
  const [passLoading,   setPassLoading]   = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialLoading>(null);
  const [apiError,      setApiError]      = useState<string | null>(null);
  const [sentTo,        setSentTo]        = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  const emailValid = EMAIL_RE.test(email.trim());
  const emailErr   = emailTouched && !emailValid ? 'E-mail inválido. Confere aí?' : null;
  const isLoading  = magicLoading || passLoading || !!socialLoading;

  async function handleOAuth(provider: 'google' | 'apple') {
    setSocialLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast.error(translateSupabaseError(error));
      setSocialLoading(null);
    }
  }

  async function sendOtp(targetEmail: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  }

  async function handleSendCode() {
    setEmailTouched(true);
    if (!emailValid) { emailRef.current?.focus(); return; }
    setMagicLoading(true);
    setApiError(null);
    try {
      await sendOtp(email.trim());
      setSentTo(email.trim());
      setScreen('otp-verify');
    } catch (err: any) {
      setApiError(translateSupabaseError(err));
    } finally {
      setMagicLoading(false);
    }
  }

  async function handleResend() {
    try { await sendOtp(sentTo); } catch { /* silencioso — feedback via toast no filho */ }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!password || !emailValid) return;
    setPassLoading(true);
    setApiError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setPassLoading(false);
    if (error) setApiError(translateSupabaseError(error));
    // on success: onAuthStateChange fires automatically
  }

  // ── OTP verify screen
  if (screen === 'otp-verify') {
    return (
      <OtpVerifyScreen
        email={sentTo}
        onBack={() => setScreen('main')}
        onResend={handleResend}
      />
    );
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: `radial-gradient(ellipse 100% 50% at 50% -10%, ${T.mauve200} 0%, ${T.white} 65%)`,
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── hero ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        style={{
          flex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-end',
          padding: `calc(env(safe-area-inset-top) + 56px) 28px 44px`,
          textAlign: 'center', gap: 20,
        }}
      >
        {/* nest icon + halo */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.1, 0.25] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              width: 110, height: 110, borderRadius: '50%',
              background: `radial-gradient(circle, ${T.mauve300}, transparent 70%)`,
            }}
          />
          <span style={{ fontSize: '5rem', lineHeight: 1, position: 'relative' }} aria-hidden="true">🪺</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <h1 style={{
            fontFamily: Font.h, fontWeight: 700,
            fontSize: 'clamp(2.2rem, 8vw, 2.8rem)',
            color: T.stone900, margin: 0,
            lineHeight: 1.08, letterSpacing: '-0.025em',
          }}>
            Tire o peso<br />da memória.
          </h1>
          <p style={{ fontFamily: Font.b, fontSize: 15, color: T.stone500, margin: 0 }}>
            Organize a rotina de quem você ama.
          </p>
        </motion.div>
      </motion.div>

      {/* ── auth zone ── */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{
          padding: `0 24px calc(env(safe-area-inset-bottom) + 36px)`,
          display: 'flex', flexDirection: 'column', gap: 12,
          maxWidth: 420, width: '100%', alignSelf: 'center',
        }}
      >

        {/* Google */}
        <motion.button
          whileTap={{ scale: 0.975 }}
          onClick={() => handleOAuth('google')}
          disabled={isLoading}
          style={{
            height: 56, borderRadius: 100,
            background: T.white,
            border: `1.5px solid ${T.stone200}`,
            boxShadow: '0 1px 3px rgba(13,13,13,0.07), 0 0 0 1px rgba(13,13,13,0.03)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: socialLoading === 'apple' ? 0.45 : 1,
            transition: 'opacity 200ms',
            fontFamily: Font.b, fontWeight: 600, fontSize: 15, color: T.stone900,
          } as React.CSSProperties}
        >
          {socialLoading === 'google' ? <Spinner color={T.stone500} /> : <GoogleIcon />}
          Continuar com Google
        </motion.button>

        {/* Apple */}
        <motion.button
          whileTap={{ scale: 0.975 }}
          onClick={() => handleOAuth('apple')}
          disabled={isLoading}
          style={{
            height: 56, borderRadius: 100,
            background: T.black,
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: socialLoading === 'google' ? 0.45 : 1,
            transition: 'opacity 200ms',
            fontFamily: Font.b, fontWeight: 600, fontSize: 15, color: '#fcfcfc',
          }}
        >
          {socialLoading === 'apple' ? <Spinner color="#fcfcfc" /> : <AppleIcon />}
          Continuar com Apple
        </motion.button>

        {/* divisor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }} aria-hidden="true">
          <div style={{ flex: 1, height: 1, background: T.stone200 }} />
          <span style={{ fontFamily: Font.b, fontSize: 12, color: T.stone300, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            ou e-mail
          </span>
          <div style={{ flex: 1, height: 1, background: T.stone200 }} />
        </div>

        {/* email pill */}
        <div style={{
          height: 56, borderRadius: 100,
          background: T.stone50,
          border: `1.5px solid ${emailErr ? '#dfb9b4' : emailTouched && emailValid ? T.sage300 : T.stone200}`,
          display: 'flex', alignItems: 'center',
          padding: '0 8px 0 22px',
          transition: 'border-color 200ms',
          gap: 8,
        }}>
          <input
            ref={emailRef}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setApiError(null); setEmailTouched(false); }}
            onBlur={() => setEmailTouched(true)}
            onKeyDown={e => e.key === 'Enter' && handleSendCode()}
            disabled={isLoading}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontFamily: Font.b, fontSize: 15, color: T.stone900, minWidth: 0,
            }}
          />
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleSendCode}
            disabled={isLoading}
            aria-label="Enviar código de acesso"
            style={{
              width: 40, height: 40, borderRadius: 100, flexShrink: 0,
              background: magicLoading ? T.mauve300 : T.mauve500,
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background 200ms',
            }}
          >
            {magicLoading ? <Spinner /> : <SendIcon />}
          </motion.button>
        </div>

        {/* erros */}
        <AnimatePresence>
          {emailErr && (
            <motion.p key="email-err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ fontFamily: Font.b, fontSize: 13, color: '#a74235', margin: 0, paddingLeft: 20 }}
            >
              {emailErr}
            </motion.p>
          )}
          {apiError && (
            <motion.div key="api-err" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              role="alert"
              style={{ borderRadius: 16, padding: '12px 18px', background: T.clay50, border: `1px solid ${T.clay200}` }}
            >
              <p style={{ fontFamily: Font.b, fontSize: 13, color: T.clay800, margin: 0 }}>{apiError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <p style={{ fontFamily: Font.b, fontSize: 13, color: T.stone300, textAlign: 'center', margin: 0 }}>
          Código de 6 dígitos direto no e-mail. ✨
        </p>

        {/* senha expandível */}
        <AnimatePresence mode="wait">
          {screen !== 'password' ? (
            <motion.div key="pass-link" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ textAlign: 'center' }}
            >
              <button
                onClick={() => setScreen('password')}
                style={{
                  background: 'none', border: 'none',
                  fontFamily: Font.b, fontSize: 13, color: T.stone500,
                  cursor: 'pointer', padding: '4px 0',
                }}
              >
                Prefiro usar senha
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="pass-form"
              onSubmit={handlePassword}
              noValidate
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <div style={{
                height: 54, borderRadius: 100,
                background: T.stone50, border: `1.5px solid ${T.stone200}`,
                display: 'flex', alignItems: 'center', padding: '0 20px',
              }}>
                <input
                  type="password"
                  placeholder="Senha"
                  autoFocus
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setApiError(null); }}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    fontFamily: Font.b, fontSize: 15, color: T.stone900,
                  }}
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.975 }}
                type="submit"
                disabled={isLoading}
                style={{
                  height: 52, borderRadius: 100,
                  background: T.stone100, border: `1.5px solid ${T.stone200}`,
                  fontFamily: Font.b, fontWeight: 600, fontSize: 15, color: T.stone800,
                  cursor: passLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: passLoading ? 0.7 : 1,
                }}
              >
                {passLoading && <Spinner color={T.stone500} />}
                {passLoading ? 'Entrando…' : 'Entrar com senha'}
              </motion.button>
              <button
                type="button"
                onClick={() => { setScreen('main'); setApiError(null); }}
                style={{
                  background: 'none', border: 'none',
                  fontFamily: Font.b, fontSize: 13, color: T.stone500,
                  cursor: 'pointer', textAlign: 'center', padding: '2px 0',
                }}
              >
                ← Voltar para código
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
