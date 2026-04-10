/**
 * NINHO — AuthPage v2 · "Silêncio Visual"
 *
 * Zeus:  Layout minimalista. Social Auth domina visualmente (thumb zone).
 *        Sem ruído — zero campos desnecessários na primeira visão.
 * Lumen: "Tire o peso da memória." — valida a dor antes do cadastro.
 *        Magic Link como path principal: sem senhas, sem frustração.
 * Luke:  Social → Magic Link → Senha (ordem por menor atrito).
 *        1 toque para entrar com Google ou Apple = maior conversão.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast }          from 'sonner';
import { Text }           from '@/design-system/components/ui/Text';
import { Button }         from '@/design-system/components/ui/Button';
import { TextInput }      from '@/design-system/components/ui/TextInput';
import { LinkButton }     from '@/design-system/components/ui/LinkButton';
import { SocialButton }   from '@/design-system/components/ui/SocialButton';
import { supabase, translateSupabaseError } from '@/lib/supabase';

type Screen = 'main' | 'otp-sent' | 'password';
type SocialLoading = 'google' | 'apple' | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── OTP Sent ─────────────────────────────────────────────────────────────────

function OtpSentScreen({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <motion.div
      key="otp-sent"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-ds-pure-white flex flex-col items-center justify-center px-6 gap-8 text-center"
    >
      <motion.span
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
        className="text-6xl select-none"
        aria-hidden="true"
      >
        📬
      </motion.span>

      <div className="flex flex-col gap-3">
        <Text variant="h2" className="font-heading">Confere seu e-mail</Text>
        <Text variant="body-md-regular" color="secondary">
          Enviamos um link mágico para
        </Text>
        <Text variant="body-md-semibold">{email}</Text>
        <Text variant="body-md-regular" color="secondary">
          Clique no link para entrar — sem precisar de senha.
        </Text>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Text variant="caption-regular" color="secondary">Não chegou? Confere o spam.</Text>
        <LinkButton label="← Tentar de novo" linkType="gray" onClick={onBack} />
      </div>
    </motion.div>
  );
}

// ─── AuthPage ─────────────────────────────────────────────────────────────────

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

  const emailErr = emailTouched && !EMAIL_RE.test(email.trim())
    ? 'E-mail parece incorreto. Confere aí?'
    : null;

  const isLoading = magicLoading || passLoading || !!socialLoading;

  // ── OAuth (Google / Apple) ─────────────────────────────────────────────────
  async function handleOAuth(provider: 'google' | 'apple') {
    setSocialLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });
      if (error) {
        toast.error(translateSupabaseError(error));
        setSocialLoading(null);
      }
      // Browser navega para o provider — sem reset de loading necessário
    } catch {
      toast.error('Opa! Algo deu errado. Tente novamente.');
      setSocialLoading(null);
    }
  }

  // ── Magic Link ────────────────────────────────────────────────────────────
  async function handleMagicLink() {
    setEmailTouched(true);
    if (!EMAIL_RE.test(email.trim())) return;
    setApiError(null);
    setMagicLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
      });
      if (error) {
        setApiError(translateSupabaseError(error));
      } else {
        setSentTo(email.trim());
        setScreen('otp-sent');
      }
    } finally {
      setMagicLoading(false);
    }
  }

  // ── Senha ─────────────────────────────────────────────────────────────────
  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setApiError(null);
    setPassLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) setApiError(translateSupabaseError(error));
    } finally {
      setPassLoading(false);
    }
  }

  if (screen === 'otp-sent') {
    return <OtpSentScreen email={sentTo} onBack={() => setScreen('main')} />;
  }

  return (
    <div className="min-h-screen bg-ds-pure-white flex flex-col">

      {/* ── Hero — "silêncio visual": espaço generoso, 1 frase, marca ─────── */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex-none flex flex-col items-center gap-4 px-6 pb-10"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 52px)' }}
      >
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
          className="text-[4.5rem] select-none leading-none"
          aria-hidden="true"
        >
          🪺
        </motion.span>

        <div className="text-center flex flex-col gap-2">
          <Text variant="h1" className="font-heading tracking-tight">ninho</Text>
          <Text variant="body-md-regular" color="secondary" className="max-w-[280px]">
            Tire o peso da memória.{' '}
            <br className="hidden xs:block" />
            Organize a rotina de quem você ama.
          </Text>
        </div>
      </motion.header>

      {/* ── Auth actions — zona do polegar ────────────────────────────────── */}
      <main
        className="flex-1 flex flex-col px-6 max-w-sm w-full mx-auto"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
      >

        {/* Social Auth — caminho primário (1 toque) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-3"
        >
          <SocialButton
            provider="google"
            size="lg"
            fullWidth
            disabled={isLoading}
            onClick={() => handleOAuth('google')}
          />
          <SocialButton
            provider="apple"
            size="lg"
            fullWidth
            disabled={isLoading}
            onClick={() => handleOAuth('apple')}
          />
        </motion.div>

        {/* Divisor */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.32 }}
          className="flex items-center gap-3 py-5"
          aria-hidden="true"
        >
          <div className="flex-1 h-px bg-ds-neutral-border" />
          <Text variant="caption-regular" color="secondary" as="span">
            ou continue com e-mail
          </Text>
          <div className="flex-1 h-px bg-ds-neutral-border" />
        </motion.div>

        {/* E-mail + Magic Link — caminho secundário */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.26 }}
          className="flex flex-col gap-3"
        >
          <TextInput
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setApiError(null); }}
            onBlur={() => setEmailTouched(true)}
            error={emailErr ?? undefined}
            autoComplete="email"
            size="md"
            fullWidth
          />

          <AnimatePresence mode="wait">
            {screen !== 'password' ? (
              <motion.div
                key="magic-block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-2"
              >
                <Button
                  label="Entrar com link mágico ✨"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={magicLoading}
                  disabled={isLoading}
                  onClick={handleMagicLink}
                />
                <Text variant="caption-regular" color="secondary" className="text-center">
                  Sem senha — enviamos um link direto no e-mail.
                </Text>
                <div className="flex justify-center pt-1">
                  <LinkButton
                    label="Prefiro usar senha"
                    linkType="gray"
                    onClick={() => setScreen('password')}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="pass-block"
                onSubmit={handlePassword}
                noValidate
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-3"
              >
                <TextInput
                  label="Senha"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setApiError(null); }}
                  autoComplete="current-password"
                  size="md"
                  fullWidth
                  autoFocus
                />
                {apiError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    role="alert"
                    className="rounded-[var(--radius-sm)] px-4 py-3 bg-ds-error-subtle border border-ds-error-border"
                  >
                    <Text variant="caption-medium" className="text-ds-error-fg-strong">
                      {apiError}
                    </Text>
                  </motion.div>
                )}
                <Button
                  type="submit"
                  label="Entrar"
                  variant="secondary"
                  size="lg"
                  fullWidth
                  loading={passLoading}
                  disabled={isLoading}
                />
                <div className="flex justify-center">
                  <LinkButton
                    label="← Voltar para link mágico"
                    linkType="gray"
                    onClick={() => { setScreen('main'); setApiError(null); }}
                  />
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Erro do magic link */}
          <AnimatePresence>
            {apiError && screen !== 'password' && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                role="alert"
                className="rounded-[var(--radius-sm)] px-4 py-3 bg-ds-error-subtle border border-ds-error-border"
              >
                <Text variant="caption-medium" className="text-ds-error-fg-strong">
                  {apiError}
                </Text>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <footer className="pb-6 flex justify-center">
        <Text variant="caption-regular" color="secondary" className="opacity-40">
          🔒 Dados seguros e criptografados
        </Text>
      </footer>
    </div>
  );
}
