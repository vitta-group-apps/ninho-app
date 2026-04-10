/**
 * NINHO — AuthPage v5 · Magic Link + Social Auth
 *
 * Fluxo de autenticação:
 *   Google / Apple  → signInWithOAuth → redirect → SIGNED_IN → StateRouter navega
 *   E-mail          → signInWithOtp (magic link) → tela de confirmação
 *                   → usuário clica link no e-mail → SIGNED_IN → StateRouter navega
 *
 * shouldCreateUser: true — mesmo endpoint para cadastro e login.
 * Copy deixa isso claro: "Novo por aqui ou já tem conta?"
 *
 * Referências visuais: Apple Health, Calm, Linear, Notion — clean, tipografia grande,
 * social auth como CTA primário, e-mail como opção secundária acessível.
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase, translateSupabaseError } from '@/lib/supabase';
import { NinhoIcon, NinhoWordmark } from '@/components/NinhoLogo';

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
  h: "'Quicksand', -apple-system, 'SF Pro Rounded', system-ui, sans-serif",
  b: "'Nunito', -apple-system, 'SF Pro Text', system-ui, sans-serif",
} as const;

// ─── inline icons ─────────────────────────────────────────────────────────────

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

function ArrowRightIcon({ color = 'white' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12H19M14 7l5 5-5 5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Spinner({ color = 'white', size = 16 }: { color?: string; size?: number }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      style={{
        width: size, height: size, borderRadius: '50%',
        border: `2px solid ${color}30`,
        borderTopColor: color,
        flexShrink: 0,
      }}
    />
  );
}

// ─── tela de confirmação de link enviado ─────────────────────────────────────

interface SentScreenProps {
  email: string;
  onBack: () => void;
  onResend: () => Promise<void>;
}

function SentScreen({ email, onBack, onResend }: SentScreenProps) {
  const [resending,  setResending]  = useState(false);
  const [resentAt,   setResentAt]   = useState<number | null>(null);
  const cooldownSec = resentAt ? Math.max(0, 60 - Math.floor((Date.now() - resentAt) / 1000)) : 0;
  const canResend   = cooldownSec === 0;

  async function handleResend() {
    if (!canResend || resending) return;
    setResending(true);
    await onResend();
    setResending(false);
    setResentAt(Date.now());
    toast.success('Novo link enviado!');
  }

  return (
    <motion.div
      key="sent"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        minHeight: '100dvh',
        background: `radial-gradient(ellipse 120% 55% at 50% -5%, ${T.mauve200} 0%, ${T.white} 60%)`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 32px', gap: 32, textAlign: 'center',
      }}
    >
      {/* icon */}
      <motion.div
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.55, delay: 0.05, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          width: 96, height: 96, borderRadius: '50%',
          background: `linear-gradient(135deg, ${T.mauve100}, ${T.mauve200})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.8rem',
          boxShadow: `0 8px 32px ${T.mauve300}80`,
        }}
        aria-hidden="true"
      >
        📬
      </motion.div>

      {/* copy */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <h2 style={{
          fontFamily: Font.h, fontWeight: 700,
          fontSize: 'clamp(1.6rem, 7vw, 2rem)',
          color: T.stone900, margin: 0, lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}>
          Confere seu e-mail ✉️
        </h2>
        <p style={{ fontFamily: Font.b, fontSize: 15, color: T.stone500, margin: 0, lineHeight: 1.6 }}>
          Enviamos um link de acesso para<br />
          <strong style={{ color: T.stone800, fontWeight: 700 }}>{email}</strong>
        </p>
        <p style={{ fontFamily: Font.b, fontSize: 14, color: T.stone400, margin: 0, lineHeight: 1.5 }}>
          Clique no link para entrar — sem senha.<br />
          <span style={{ fontSize: 13 }}>Abra no mesmo aparelho para melhor experiência.</span>
        </p>
      </motion.div>

      {/* divider */}
      <div style={{ width: '100%', maxWidth: 280, height: 1, background: T.stone100 }} />

      {/* actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
      >
        <p style={{ fontFamily: Font.b, fontSize: 13, color: T.stone400, margin: 0 }}>
          Não chegou? Confere o spam ou reenvie.
        </p>
        <button
          onClick={handleResend}
          disabled={!canResend || resending}
          style={{
            background: canResend ? T.mauve50 : 'none',
            border: `1.5px solid ${canResend ? T.mauve200 : T.stone100}`,
            borderRadius: 100,
            paddingInline: 24, paddingBlock: 10,
            fontFamily: Font.b, fontWeight: 600, fontSize: 14,
            color: canResend ? T.mauve500 : T.stone300,
            cursor: canResend && !resending ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.2s',
          }}
        >
          {resending && <Spinner color={T.mauve500} size={14} />}
          {resending ? 'Reenviando…' : cooldownSec > 0 ? `Reenviar em ${cooldownSec}s` : 'Reenviar link'}
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
      </motion.div>
    </motion.div>
  );
}

// ─── auth page principal ──────────────────────────────────────────────────────

type Screen = 'main' | 'sent';
type SocialLoading = 'google' | 'apple' | null;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthPage() {
  const [screen,        setScreen]        = useState<Screen>('main');
  const [email,         setEmail]         = useState('');
  const [emailTouched,  setEmailTouched]  = useState(false);
  const [emailLoading,  setEmailLoading]  = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialLoading>(null);
  const [apiError,      setApiError]      = useState<string | null>(null);
  const [sentTo,        setSentTo]        = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  const emailValid = EMAIL_RE.test(email.trim());
  const emailErr   = emailTouched && !emailValid ? 'E-mail inválido. Confere aí?' : null;
  const isLoading  = emailLoading || !!socialLoading;

  // ── OAuth (Google / Apple) ────────────────────────────────────────────────

  async function handleOAuth(provider: 'google' | 'apple') {
    setSocialLoading(provider);
    setApiError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast.error(translateSupabaseError(error));
      setSocialLoading(null);
    }
    // sucesso: browser redireciona, onAuthStateChange → StateRouter navega
  }

  // ── Magic link (e-mail) ───────────────────────────────────────────────────

  async function sendMagicLink(targetEmail: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        shouldCreateUser: true,           // cria conta se não existir
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  }

  async function handleEmail() {
    setEmailTouched(true);
    if (!emailValid) { emailRef.current?.focus(); return; }
    setEmailLoading(true);
    setApiError(null);
    try {
      await sendMagicLink(email.trim());
      setSentTo(email.trim());
      setScreen('sent');
    } catch (err: any) {
      setApiError(translateSupabaseError(err));
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleResend() {
    try { await sendMagicLink(sentTo); } catch { /* toast no filho */ }
  }

  // ── render: tela de confirmação ───────────────────────────────────────────

  if (screen === 'sent') {
    return (
      <AnimatePresence mode="wait">
        <SentScreen key="sent" email={sentTo} onBack={() => setScreen('main')} onResend={handleResend} />
      </AnimatePresence>
    );
  }

  // ── render: tela principal ────────────────────────────────────────────────

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="main"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          minHeight: '100dvh',
          background: `radial-gradient(ellipse 110% 55% at 50% -8%, ${T.mauve200} 0%, ${T.white} 62%)`,
          display: 'flex', flexDirection: 'column',
        }}
      >

        {/* ── hero ─────────────────────────────────────────────────────────── */}
        <div style={{
          flex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-end',
          padding: `calc(env(safe-area-inset-top) + 48px) 28px 36px`,
          textAlign: 'center', gap: 20,
        }}>

          {/* logo mark + halo pulsante */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div
              animate={{ scale: [1, 1.18, 1], opacity: [0.18, 0.06, 0.18] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                width: 140, height: 140, borderRadius: '50%',
                background: `radial-gradient(circle, ${T.mauve300}, transparent 70%)`,
              }}
            />
            <NinhoIcon size={80} color={T.mauve700} style={{ position: 'relative' }} />
          </motion.div>

          {/* wordmark + headline */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
          >
            <NinhoWordmark height={22} color={T.mauve500} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h1 style={{
                fontFamily: Font.h, fontWeight: 700,
                fontSize: 'clamp(2.1rem, 8vw, 2.75rem)',
                color: T.stone900, margin: 0,
                lineHeight: 1.08, letterSpacing: '-0.025em',
              }}>
                Tire o peso<br />da memória.
              </h1>
              <p style={{
                fontFamily: Font.b, fontSize: 16,
                color: T.stone500, margin: 0, lineHeight: 1.5,
              }}>
                Organize a rotina de quem você ama.
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── auth zone ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{
            padding: `0 24px calc(env(safe-area-inset-bottom) + 32px)`,
            display: 'flex', flexDirection: 'column', gap: 11,
            maxWidth: 420, width: '100%', alignSelf: 'center',
          }}
        >

          {/* label de contexto — cadastro e login unificados */}
          <p style={{
            fontFamily: Font.b, fontSize: 13, color: T.stone400,
            textAlign: 'center', margin: '0 0 2px',
          }}>
            Novo por aqui ou já tem conta? Continue abaixo.
          </p>

          {/* ── Google ─────────────────────────────────────────────────────── */}
          <motion.button
            whileTap={{ scale: 0.975 }}
            onClick={() => handleOAuth('google')}
            disabled={isLoading}
            aria-label="Continuar com Google"
            style={{
              height: 56, borderRadius: 100,
              background: T.white,
              border: `1.5px solid ${T.stone200}`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.03)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: socialLoading === 'apple' ? 0.42 : 1,
              transition: 'opacity 200ms, box-shadow 200ms',
              fontFamily: Font.b, fontWeight: 600, fontSize: 15, color: T.stone900,
              WebkitTapHighlightColor: 'transparent',
            } as React.CSSProperties}
          >
            {socialLoading === 'google' ? <Spinner color={T.stone500} /> : <GoogleIcon />}
            Continuar com Google
          </motion.button>

          {/* ── Apple ──────────────────────────────────────────────────────── */}
          <motion.button
            whileTap={{ scale: 0.975 }}
            onClick={() => handleOAuth('apple')}
            disabled={isLoading}
            aria-label="Continuar com Apple"
            style={{
              height: 56, borderRadius: 100,
              background: T.black,
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: socialLoading === 'google' ? 0.42 : 1,
              transition: 'opacity 200ms',
              fontFamily: Font.b, fontWeight: 600, fontSize: 15, color: '#f8f8f8',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {socialLoading === 'apple' ? <Spinner color="#f8f8f8" /> : <AppleIcon />}
            Continuar com Apple
          </motion.button>

          {/* ── divisor ────────────────────────────────────────────────────── */}
          <div
            aria-hidden="true"
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '3px 0' }}
          >
            <div style={{ flex: 1, height: 1, background: T.stone100 }} />
            <span style={{
              fontFamily: Font.b, fontSize: 12, color: T.stone300,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              ou e-mail
            </span>
            <div style={{ flex: 1, height: 1, background: T.stone100 }} />
          </div>

          {/* ── e-mail pill ────────────────────────────────────────────────── */}
          <div style={{
            height: 56, borderRadius: 100,
            background: T.stone50,
            border: `1.5px solid ${
              emailErr            ? '#dfb9b4'  :
              emailTouched && emailValid ? T.sage300 :
              T.stone200
            }`,
            display: 'flex', alignItems: 'center',
            paddingLeft: 22, paddingRight: 8,
            gap: 8,
            transition: 'border-color 200ms',
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
              onKeyDown={e => e.key === 'Enter' && handleEmail()}
              disabled={isLoading}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontFamily: Font.b, fontSize: 15, color: T.stone900, minWidth: 0,
              }}
            />
            {/* botão enviar */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleEmail}
              disabled={isLoading}
              aria-label="Enviar link de acesso"
              style={{
                width: 40, height: 40, borderRadius: 100, flexShrink: 0,
                background: emailLoading ? T.mauve300 : T.mauve500,
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background 200ms',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {emailLoading ? <Spinner /> : <ArrowRightIcon />}
            </motion.button>
          </div>

          {/* erros */}
          <AnimatePresence>
            {emailErr && !apiError && (
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

          {/* reassurance */}
          <p style={{
            fontFamily: Font.b, fontSize: 12, color: T.stone300,
            textAlign: 'center', margin: 0, lineHeight: 1.5,
          }}>
            Link direto no e-mail — sem senha, sem complicação. ✨
          </p>

          {/* termos */}
          <p style={{
            fontFamily: Font.b, fontSize: 11, color: T.stone300,
            textAlign: 'center', margin: '4px 0 0', lineHeight: 1.5,
          }}>
            Ao continuar, você concorda com os{' '}
            <span style={{ color: T.stone400, fontWeight: 600 }}>Termos de Uso</span>
            {' '}e a{' '}
            <span style={{ color: T.stone400, fontWeight: 600 }}>Política de Privacidade</span>.
          </p>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
