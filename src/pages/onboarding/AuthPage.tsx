/**
 * NINHO — AuthPage v6 · Clean Auth (referência: Instagram / Airbnb)
 *
 * Modos:
 *   'login'  → e-mail + senha → signInWithPassword
 *   'signup' → e-mail + senha → signUp
 *   'magic'  → só e-mail → magic link (OTP)
 *   'sent'   → confirmação de link enviado
 *   'forgot' → reset de senha por e-mail
 *
 * Layout: branco puro, logo centralizado, form limpo, social auth.
 * Logo: apenas NinhoWordmark (um só elemento, não duplicado).
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase, translateSupabaseError } from '@/lib/supabase';
import { NinhoWordmark } from '@/components/NinhoLogo';

// ─── tokens ──────────────────────────────────────────────────────────────────

const T = {
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
  stone400: '#b5b2af',
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
  h: "'Quicksand', -apple-system, system-ui, sans-serif",
  b: "'Nunito', -apple-system, system-ui, sans-serif",
} as const;

type AuthMode = 'login' | 'signup' | 'magic' | 'sent' | 'forgot' | 'forgot_sent';
type SocialLoading = 'google' | 'apple' | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function translateAuthError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (msg.includes('User already registered'))   return 'Este e-mail já tem conta. Entre com sua senha.';
  if (msg.includes('Email not confirmed'))        return 'Confirme seu e-mail antes de entrar.';
  if (msg.includes('Password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (msg.includes('rate limit'))                 return 'Muitas tentativas. Aguarde um momento.';
  return translateSupabaseError({ message: msg });
}

// ─── ícones ───────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M18.1 10.2c0-.63-.06-1.25-.16-1.84H10v3.48h4.54a3.88 3.88 0 0 1-1.68 2.55v2.12h2.72c1.59-1.46 2.52-3.62 2.52-6.31Z" fill="#4285F4"/>
      <path d="M10 18.5c2.28 0 4.19-.75 5.58-2.04l-2.72-2.12c-.75.5-1.72.8-2.86.8-2.2 0-4.06-1.49-4.73-3.48H2.46v2.19A8.5 8.5 0 0 0 10 18.5Z" fill="#34A853"/>
      <path d="M5.27 11.66A5.1 5.1 0 0 1 5 10c0-.58.1-1.14.27-1.66V6.15H2.46A8.5 8.5 0 0 0 1.5 10c0 1.37.33 2.67.96 3.85l2.81-2.19Z" fill="#FBBC05"/>
      <path d="M10 4.86c1.24 0 2.35.43 3.23 1.26l2.42-2.42A8.46 8.46 0 0 0 10 1.5 8.5 8.5 0 0 0 2.46 6.15l2.81 2.19C5.94 6.35 7.8 4.86 10 4.86Z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="19" viewBox="0 0 17 20" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M14.03 10.6c-.02-2.08 1.7-3.08 1.78-3.13-.97-1.42-2.48-1.61-3.01-1.63-1.3-.13-2.52.77-3.17.77-.66 0-1.66-.74-2.74-.72C5.2 5.91 3.91 6.68 3.2 7.92 1.83 10.38 2.85 14.08 4.2 16.11c.65.94 1.43 2.01 2.45 1.97.98-.04 1.35-.63 2.53-.63 1.18 0 1.52.63 2.55.61 1.06-.02 1.73-.96 2.38-1.9.75-1.09 1.06-2.15 1.08-2.2-.02-.01-2.07-.8-2.09-3.14l-.07-.22ZM11.49 4.27c.54-.66.9-1.57.8-2.48-.78.03-1.71.52-2.26 1.17-.5.58-.93 1.5-.82 2.39.87.07 1.74-.45 2.28-1.08Z" fill="white"/>
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M1 12C1 12 5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12Z" stroke={T.stone400} strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="3" stroke={T.stone400} strokeWidth="1.8"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" stroke={T.stone400} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function Spinner({ color = T.white, size = 16 }: { color?: string; size?: number }) {
  return (
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}30`, borderTopColor: color, flexShrink: 0 }}
    />
  );
}

// ─── campo reutilizável ───────────────────────────────────────────────────────

interface FieldProps {
  id: string; type: string; placeholder: string; value: string;
  onChange: (v: string) => void; onBlur?: () => void; disabled?: boolean;
  error?: string | null; suffix?: React.ReactNode; autoFocus?: boolean;
  autoComplete?: string;
}

function Field({ id, type, placeholder, value, onChange, onBlur, disabled, error, suffix, autoFocus, autoComplete }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{
        height: 52, borderRadius: 14,
        background: T.stone50,
        border: `1.5px solid ${error ? '#dfb9b4' : T.stone200}`,
        display: 'flex', alignItems: 'center',
        paddingLeft: 16, paddingRight: suffix ? 10 : 16,
        transition: 'border-color 200ms',
      }}>
        <input
          id={id} type={type} placeholder={placeholder}
          value={value} autoFocus={autoFocus} autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            fontFamily: Font.b, fontSize: 15, color: T.stone900,
            minWidth: 0,
          }}
        />
        {suffix}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p key="err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ fontFamily: Font.b, fontSize: 12, color: '#a74235', margin: 0, paddingLeft: 4 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── tela de link enviado ─────────────────────────────────────────────────────

function SentScreen({ email, onBack, onResend, mode }: {
  email: string; onBack: () => void; onResend: () => Promise<void>; mode: 'magic' | 'forgot';
}) {
  const [resending, setResending] = useState(false);
  const [resentAt,  setResentAt]  = useState<number | null>(null);
  const cooldown = resentAt ? Math.max(0, 60 - Math.floor((Date.now() - resentAt) / 1000)) : 0;

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    await onResend();
    setResending(false);
    setResentAt(Date.now());
    toast.success('Novo link enviado!');
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      style={{
        minHeight: '100dvh', background: T.white,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 32px', gap: 28, textAlign: 'center',
      }}
    >
      <motion.div
        initial={{ scale: 0.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          width: 88, height: 88, borderRadius: '50%',
          background: `linear-gradient(135deg, ${T.mauve100}, ${T.mauve200})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.6rem', boxShadow: `0 8px 32px ${T.mauve300}80`,
        }}
      >
        {mode === 'forgot' ? '🔐' : '📬'}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <h2 style={{ fontFamily: Font.h, fontWeight: 700, fontSize: 'clamp(1.5rem, 6vw, 1.9rem)', color: T.stone900, margin: 0, letterSpacing: '-0.02em' }}>
          {mode === 'forgot' ? 'Confira seu e-mail' : 'Link enviado!'}
        </h2>
        <p style={{ fontFamily: Font.b, fontSize: 15, color: T.stone500, margin: 0, lineHeight: 1.6 }}>
          {mode === 'forgot'
            ? 'Enviamos as instruções para redefinir sua senha para'
            : 'Enviamos um link de acesso para'}<br />
          <strong style={{ color: T.stone800 }}>{email}</strong>
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
      >
        <p style={{ fontFamily: Font.b, fontSize: 13, color: T.stone400, margin: 0 }}>
          Não chegou? Verifique o spam.
        </p>
        <button onClick={handleResend} disabled={cooldown > 0 || resending}
          style={{
            background: cooldown > 0 ? 'none' : T.mauve100,
            border: `1.5px solid ${cooldown > 0 ? T.stone100 : T.mauve200}`,
            borderRadius: 100, paddingInline: 24, paddingBlock: 10,
            fontFamily: Font.b, fontWeight: 600, fontSize: 14,
            color: cooldown > 0 ? T.stone300 : T.mauve500,
            cursor: cooldown > 0 || resending ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
          }}
        >
          {resending && <Spinner color={T.mauve500} size={14} />}
          {resending ? 'Reenviando…' : cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar'}
        </button>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', fontFamily: Font.b, fontSize: 13,
          color: T.stone500, cursor: 'pointer', padding: '4px 0',
        }}>
          ← Voltar
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── auth page ────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const [mode,          setMode]          = useState<AuthMode>('login');
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [showPass,      setShowPass]      = useState(false);
  const [emailTouched,  setEmailTouched]  = useState(false);
  const [passTouched,   setPassTouched]   = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialLoading>(null);
  const [apiError,      setApiError]      = useState<string | null>(null);
  const [sentTo,        setSentTo]        = useState('');

  const emailValid = EMAIL_RE.test(email.trim());
  const passValid  = password.length >= 6;
  const emailErr   = emailTouched && !emailValid ? 'E-mail inválido.' : null;
  const passErr    = passTouched && !passValid && (mode === 'login' || mode === 'signup')
    ? 'Mínimo 6 caracteres.' : null;
  const isLoading  = loading || !!socialLoading;

  function clearErrors() { setApiError(null); }

  // ── social ────────────────────────────────────────────────────────────────

  async function handleOAuth(provider: 'google' | 'apple') {
    setSocialLoading(provider);
    clearErrors();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) { toast.error(translateAuthError(error.message)); setSocialLoading(null); }
  }

  // ── password auth ─────────────────────────────────────────────────────────

  async function handlePasswordAuth() {
    setEmailTouched(true);
    setPassTouched(true);
    if (!emailValid || !passValid) return;
    setLoading(true);
    clearErrors();
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        // signup sends confirmation — treat as sent
        setSentTo(email.trim());
        setMode('sent');
      }
    } catch (err: any) {
      setApiError(translateAuthError(err?.message ?? ''));
    } finally {
      setLoading(false);
    }
  }

  // ── magic link ────────────────────────────────────────────────────────────

  async function sendMagicLink(target: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email: target,
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  }

  async function handleMagic() {
    setEmailTouched(true);
    if (!emailValid) return;
    setLoading(true);
    clearErrors();
    try {
      await sendMagicLink(email.trim());
      setSentTo(email.trim());
      setMode('sent');
    } catch (err: any) {
      setApiError(translateAuthError(err?.message ?? ''));
    } finally {
      setLoading(false);
    }
  }

  // ── forgot password ───────────────────────────────────────────────────────

  async function handleForgot() {
    setEmailTouched(true);
    if (!emailValid) return;
    setLoading(true);
    clearErrors();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setSentTo(email.trim());
      setMode('forgot_sent');
    } catch (err: any) {
      setApiError(translateAuthError(err?.message ?? ''));
    } finally {
      setLoading(false);
    }
  }

  // ── sent screens ──────────────────────────────────────────────────────────

  if (mode === 'sent') {
    return (
      <AnimatePresence mode="wait">
        <SentScreen key="sent" email={sentTo} mode="magic"
          onBack={() => setMode('login')}
          onResend={async () => { try { await sendMagicLink(sentTo); } catch {} }}
        />
      </AnimatePresence>
    );
  }

  if (mode === 'forgot_sent') {
    return (
      <AnimatePresence mode="wait">
        <SentScreen key="forgot_sent" email={sentTo} mode="forgot"
          onBack={() => setMode('login')}
          onResend={async () => {
            try {
              await supabase.auth.resetPasswordForEmail(sentTo, { redirectTo: window.location.origin });
            } catch {}
          }}
        />
      </AnimatePresence>
    );
  }

  // ── main layout ───────────────────────────────────────────────────────────

  const isMagic    = mode === 'magic';
  const isForgot   = mode === 'forgot';
  const isSignup   = mode === 'signup';
  const ctaLabel   = isMagic ? 'Enviar link →' : isForgot ? 'Enviar instruções' : isSignup ? 'Criar conta' : 'Entrar';
  const handleCTA  = isMagic ? handleMagic : isForgot ? handleForgot : handlePasswordAuth;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={mode}
        initial={{ opacity: 0, y: mode === 'magic' || mode === 'forgot' ? 20 : 0 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        style={{
          minHeight: '100dvh',
          background: T.white,
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* ── logo area ──────────────────────────────────────────────────── */}
        <div style={{
          flex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-end',
          paddingTop: `calc(env(safe-area-inset-top) + 52px)`,
          paddingBottom: 40, paddingInline: 24,
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <NinhoWordmark height={32} color={T.mauve700} />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.4 }}
            style={{
              fontFamily: Font.b, fontSize: 15, color: T.stone500,
              margin: '14px 0 0', textAlign: 'center', lineHeight: 1.5,
            }}
          >
            {isMagic  ? 'Receba um link direto no e-mail — sem senha.'  :
             isForgot ? 'Redefina sua senha em segundos.' :
             isSignup ? 'Crie sua conta gratuitamente.' :
             'Organize a rotina de quem você ama.'}
          </motion.p>
        </div>

        {/* ── form area ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{
            padding: `0 24px calc(env(safe-area-inset-bottom) + 32px)`,
            display: 'flex', flexDirection: 'column', gap: 10,
            maxWidth: 420, width: '100%', alignSelf: 'center',
          }}
        >
          {/* ── headline do form ─────────────────────────────────────────── */}
          <p style={{
            fontFamily: Font.b, fontWeight: 700, fontSize: '0.8rem',
            color: T.stone400, letterSpacing: '0.05em', textTransform: 'uppercase',
            textAlign: 'center', margin: '0 0 4px',
          }}>
            {isMagic  ? 'Link mágico' :
             isForgot ? 'Recuperar senha' :
             isSignup ? 'Criar conta' : 'Entrar'}
          </p>

          {/* ── back link (magic/forgot) ─────────────────────────────────── */}
          {(isMagic || isForgot) && (
            <button type="button" onClick={() => setMode('login')} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontFamily: Font.b, fontSize: 13, color: T.stone500,
              display: 'flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginBottom: 2,
            }}>
              ← Voltar
            </button>
          )}

          {/* ── email ───────────────────────────────────────────────────── */}
          <Field
            id="auth-email" type="email" placeholder="seu@email.com"
            value={email} onChange={v => { setEmail(v); clearErrors(); setEmailTouched(false); }}
            onBlur={() => setEmailTouched(true)}
            disabled={isLoading} error={emailErr}
            autoComplete="email" autoFocus
          />

          {/* ── password (login/signup only) ─────────────────────────────── */}
          {!isMagic && !isForgot && (
            <Field
              id="auth-pass"
              type={showPass ? 'text' : 'password'}
              placeholder={isSignup ? 'Crie uma senha (mín. 6 caracteres)' : 'Senha'}
              value={password}
              onChange={v => { setPassword(v); clearErrors(); setPassTouched(false); }}
              onBlur={() => setPassTouched(true)}
              disabled={isLoading} error={passErr}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              suffix={
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' }}
                  aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <EyeIcon open={showPass} />
                </button>
              }
            />
          )}

          {/* ── forgot password link ─────────────────────────────────────── */}
          {mode === 'login' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4 }}>
              <button type="button" onClick={() => { setMode('forgot'); clearErrors(); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: Font.b, fontSize: 13, color: T.mauve500, padding: '0 2px',
                }}
              >
                Esqueceu a senha?
              </button>
            </div>
          )}

          {/* ── api error ────────────────────────────────────────────────── */}
          <AnimatePresence>
            {apiError && (
              <motion.div key="api-err" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                role="alert"
                style={{ borderRadius: 12, padding: '10px 14px', background: T.clay50, border: `1px solid ${T.clay200}` }}
              >
                <p style={{ fontFamily: Font.b, fontSize: 13, color: T.clay800, margin: 0 }}>{apiError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── CTA principal ────────────────────────────────────────────── */}
          <motion.button
            type="button" onClick={handleCTA} disabled={isLoading}
            whileTap={!isLoading ? { scale: 0.975 } : {}}
            style={{
              height: 52, borderRadius: 14, border: 'none',
              background: isLoading
                ? T.mauve300
                : `linear-gradient(135deg, ${T.mauve500}, ${T.mauve700})`,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: Font.h, fontWeight: 700, fontSize: '1rem',
              color: T.white, letterSpacing: '-0.01em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: isLoading ? 'none' : `0 4px 16px ${T.mauve500}55`,
              transition: 'background 0.2s, box-shadow 0.2s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {loading && <Spinner />}
            {ctaLabel}
          </motion.button>

          {/* ── social auth (só em login/signup) ─────────────────────────── */}
          {!isMagic && !isForgot && (
            <>
              {/* divisor */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }} aria-hidden="true">
                <div style={{ flex: 1, height: 1, background: T.stone100 }} />
                <span style={{ fontFamily: Font.b, fontSize: 12, color: T.stone300, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  ou
                </span>
                <div style={{ flex: 1, height: 1, background: T.stone100 }} />
              </div>

              {/* Google */}
              <motion.button type="button" whileTap={{ scale: 0.975 }}
                onClick={() => handleOAuth('google')} disabled={isLoading}
                style={{
                  height: 52, borderRadius: 14, background: T.white,
                  border: `1.5px solid ${T.stone200}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: socialLoading === 'apple' ? 0.45 : 1,
                  fontFamily: Font.b, fontWeight: 600, fontSize: 15, color: T.stone900,
                  transition: 'opacity 200ms', WebkitTapHighlightColor: 'transparent',
                } as React.CSSProperties}
              >
                {socialLoading === 'google' ? <Spinner color={T.stone500} /> : <GoogleIcon />}
                Continuar com Google
              </motion.button>

              {/* Apple */}
              <motion.button type="button" whileTap={{ scale: 0.975 }}
                onClick={() => handleOAuth('apple')} disabled={isLoading}
                style={{
                  height: 52, borderRadius: 14, background: T.black, border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: socialLoading === 'google' ? 0.45 : 1,
                  fontFamily: Font.b, fontWeight: 600, fontSize: 15, color: '#f8f8f8',
                  transition: 'opacity 200ms', WebkitTapHighlightColor: 'transparent',
                }}
              >
                {socialLoading === 'apple' ? <Spinner color="#f8f8f8" /> : <AppleIcon />}
                Continuar com Apple
              </motion.button>

              {/* Magic link option */}
              <button type="button" onClick={() => { setMode('magic'); clearErrors(); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
                  fontFamily: Font.b, fontSize: 13, color: T.stone400,
                  textAlign: 'center', WebkitTapHighlightColor: 'transparent',
                }}
              >
                Entrar sem senha, por e-mail →
              </button>
            </>
          )}

          {/* ── toggle login / signup ─────────────────────────────────────── */}
          {!isMagic && !isForgot && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 4 }}>
              <span style={{ fontFamily: Font.b, fontSize: 13, color: T.stone400 }}>
                {isSignup ? 'Já tem conta?' : 'Não tem conta?'}
              </span>
              <button type="button"
                onClick={() => { setMode(isSignup ? 'login' : 'signup'); clearErrors(); setPassTouched(false); setEmailTouched(false); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: Font.b, fontWeight: 700, fontSize: 13, color: T.mauve700, padding: 0,
                }}
              >
                {isSignup ? 'Entrar' : 'Criar conta'}
              </button>
            </div>
          )}

          {/* termos */}
          <p style={{ fontFamily: Font.b, fontSize: 11, color: T.stone300, textAlign: 'center', margin: '4px 0 0', lineHeight: 1.5 }}>
            Ao continuar você concorda com os{' '}
            <span style={{ color: T.stone400, fontWeight: 600 }}>Termos de Uso</span>
            {' '}e a{' '}
            <span style={{ color: T.stone400, fontWeight: 600 }}>Política de Privacidade</span>.
          </p>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
