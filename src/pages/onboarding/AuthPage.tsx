/**
 * NINHO — AuthPage
 * Fluxo principal: Magic Link (sem senha) como caminho primário.
 * Senha como opção secundária expandível.
 *
 * Zeus: layout branco, hierarquia clara
 * Lumen: copy PT-BR, empático, sem "palavra-passe"
 * Luke: Magic Link primeiro → menos atrito → mais conversão
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Text }       from '@/design-system/components/ui/Text';
import { Button }     from '@/design-system/components/ui/Button';
import { TextInput }  from '@/design-system/components/ui/TextInput';
import { LinkButton } from '@/design-system/components/ui/LinkButton';
import { supabase, translateSupabaseError } from '@/lib/supabase';

type Screen = 'login' | 'signup' | 'otp-sent';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(v: string): string | null {
  if (!v.trim())         return 'Digite seu e-mail para continuar';
  if (!EMAIL_RE.test(v)) return 'E-mail parece incorreto. Confere aí?';
  return null;
}

function validatePassword(v: string): string | null {
  if (!v)           return 'A senha não pode ficar em branco';
  if (v.length < 6) return 'A senha precisa ter pelo menos 6 caracteres';
  return null;
}

function InlineFeedback({ type, message }: { type: 'error' | 'success'; message: string }) {
  const isError = type === 'error';
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      role={isError ? 'alert' : 'status'}
      className={[
        'rounded-[var(--radius-sm)] border',
        'px-[var(--padding-md)] py-[var(--padding-sm)]',
        isError
          ? 'bg-ds-error-subtle border-ds-error-border'
          : 'bg-ds-success-subtle border-ds-success-border',
      ].join(' ')}
    >
      <Text
        variant="caption-medium"
        className={isError ? 'text-ds-error-fg-strong' : 'text-ds-success-fg-strong'}
      >
        {message}
      </Text>
    </motion.div>
  );
}

// ─── tela: link mágico enviado ────────────────────────────────────────────────

function OtpSentScreen({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <motion.div
      key="otp-sent"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      className="flex flex-col items-center gap-[var(--gap-lg)] text-center px-[var(--padding-lg)] py-[var(--padding-xl)]"
    >
      <span className="text-5xl leading-none select-none" aria-hidden="true">📬</span>
      <div className="flex flex-col gap-[var(--gap-sm)]">
        <Text variant="h2" className="font-heading">Confere seu e-mail</Text>
        <Text variant="body-md-regular" color="secondary">
          Enviamos um link mágico para
        </Text>
        <Text variant="body-md-semibold">{email}</Text>
        <Text variant="body-md-regular" color="secondary">
          Clique no link para entrar — sem precisar de senha.
        </Text>
      </div>
      <div className="flex flex-col gap-[var(--gap-sm)] w-full">
        <Text variant="caption-regular" color="secondary">
          Não recebeu? Confere a caixa de spam ou tenta novamente.
        </Text>
        <LinkButton
          label="← Voltar e tentar de novo"
          linkType="gray"
          onClick={onBack}
        />
      </div>
    </motion.div>
  );
}

// ─── tela: login ──────────────────────────────────────────────────────────────

function LoginForm({ onSuccess, onSignup }: { onSuccess: (email: string) => void; onSignup: () => void }) {
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [apiError,     setApiError]     = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passTouched,  setPassTouched]  = useState(false);

  const emailErr = emailTouched               ? validateEmail(email)    : null;
  const passErr  = passTouched && showPassword ? validatePassword(password) : null;

  async function handleMagicLink() {
    setEmailTouched(true);
    if (validateEmail(email)) return;

    setApiError(null);
    setMagicLoading(true);
    try {
      const { error: sbErr } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: window.location.origin,
        },
      });
      if (sbErr) {
        setApiError(translateSupabaseError(sbErr));
      } else {
        onSuccess(email);
      }
    } finally {
      setMagicLoading(false);
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setEmailTouched(true);
    setPassTouched(true);
    if (validateEmail(email) || validatePassword(password)) return;

    setApiError(null);
    setLoading(true);
    try {
      const { error: sbErr } = await supabase.auth.signInWithPassword({ email, password });
      if (sbErr) setApiError(translateSupabaseError(sbErr));
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      key="login"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      className="flex flex-col gap-[var(--gap-md)]"
    >
      {/* campo de e-mail — compartilhado entre magic link e senha */}
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

      {/* ── caminho primário: link mágico ── */}
      <Button
        label="Entrar com link mágico ✨"
        variant="primary"
        size="md"
        fullWidth
        loading={magicLoading}
        disabled={loading || magicLoading}
        onClick={handleMagicLink}
      />
      <Text variant="caption-regular" color="secondary" className="text-center -mt-[var(--gap-xs)]">
        Vamos enviar um link no seu e-mail — sem precisar de senha.
      </Text>

      {/* ── divisor ── */}
      <div className="flex items-center gap-[var(--gap-sm)]" aria-hidden="true">
        <div className="flex-1 h-px bg-ds-neutral-border" />
        <Text variant="caption-regular" color="secondary" as="span">ou entre com senha</Text>
        <div className="flex-1 h-px bg-ds-neutral-border" />
      </div>

      {/* ── caminho secundário: senha ── */}
      <AnimatePresence mode="wait">
        {!showPassword ? (
          <motion.div
            key="show-pw-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Button
              label="Usar senha"
              variant="secondary"
              size="md"
              fullWidth
              disabled={loading || magicLoading}
              onClick={() => setShowPassword(true)}
            />
          </motion.div>
        ) : (
          <motion.form
            key="pw-form"
            onSubmit={handlePassword}
            noValidate
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-[var(--gap-md)]"
          >
            <TextInput
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setApiError(null); }}
              onBlur={() => setPassTouched(true)}
              error={passErr ?? undefined}
              autoComplete="current-password"
              size="md"
              fullWidth
              autoFocus
            />

            <AnimatePresence mode="wait">
              {apiError && <InlineFeedback key="err" type="error" message={apiError} />}
            </AnimatePresence>

            <Button
              type="submit"
              label="Entrar"
              variant="secondary"
              size="md"
              fullWidth
              loading={loading}
              disabled={loading || magicLoading}
            />
          </motion.form>
        )}
      </AnimatePresence>

      {/* link para signup */}
      <div className="flex items-center justify-center gap-[var(--gap-xs)] pt-[var(--gap-xs)]">
        <Text variant="caption-regular" color="secondary">Primeira vez aqui?</Text>
        <LinkButton label="Criar minha conta →" linkType="interactive" onClick={onSignup} />
      </div>
    </motion.div>
  );
}

// ─── tela: signup ─────────────────────────────────────────────────────────────

function SignupForm({ onLogin, onSuccess }: { onLogin: () => void; onSuccess: (email: string) => void }) {
  const [name,           setName]           = useState('');
  const [email,          setEmail]          = useState('');
  const [password,       setPassword]       = useState('');
  const [consent,        setConsent]        = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [apiError,       setApiError]       = useState<string | null>(null);
  const [emailTouched,   setEmailTouched]   = useState(false);
  const [passTouched,    setPassTouched]    = useState(false);
  const [consentTouched, setConsentTouched] = useState(false);

  const emailErr   = emailTouched    ? validateEmail(email)       : null;
  const passErr    = passTouched     ? validatePassword(password) : null;
  const consentErr = consentTouched && !consent
    ? 'Confirme a política de privacidade para continuar'
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailTouched(true);
    setPassTouched(true);
    setConsentTouched(true);
    if (validateEmail(email) || validatePassword(password) || !consent) return;

    setApiError(null);
    setLoading(true);
    try {
      const { error: sbErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (sbErr) {
        setApiError(translateSupabaseError(sbErr));
      } else {
        onSuccess(email);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      key="signup"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      className="flex flex-col gap-[var(--gap-md)]"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[var(--gap-md)]">
        <TextInput
          label="Seu nome"
          placeholder="Como posso te chamar?"
          value={name}
          onChange={e => setName(e.target.value)}
          autoComplete="name"
          size="md"
          fullWidth
        />

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

        <TextInput
          label="Senha"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={e => { setPassword(e.target.value); setApiError(null); }}
          onBlur={() => setPassTouched(true)}
          error={passErr ?? undefined}
          hint="Seus dados ficam seguros e criptografados."
          autoComplete="new-password"
          size="md"
          fullWidth
        />

        {/* consentimento */}
        <div className="flex items-start gap-[var(--gap-sm)]">
          <button
            type="button"
            role="checkbox"
            aria-checked={consent}
            onClick={() => { setConsent(c => !c); setConsentTouched(true); }}
            className={[
              'shrink-0 mt-0.5 w-5 h-5 rounded-[var(--radius-xxs)] border-2 flex items-center justify-center transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent-tint focus-visible:ring-offset-1',
              consent
                ? 'bg-ds-accent-tint border-ds-accent-tint'
                : consentErr
                ? 'border-ds-error-border bg-ds-error-subtle'
                : 'border-ds-neutral-border bg-ds-pure-white',
            ].join(' ')}
          >
            {consent && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <div>
            <Text variant="caption-regular" color="secondary" as="span">
              Li e aceito a{' '}
              <span className="text-ds-accent-fg font-semibold">Política de Privacidade</span>
              . Os dados de saúde do bebê são armazenados com criptografia. 🔒
            </Text>
            {consentErr && (
              <Text variant="caption-medium" className="text-ds-error-fg-strong block mt-[var(--gap-xxs)]">
                {consentErr}
              </Text>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {apiError && <InlineFeedback key="err" type="error" message={apiError} />}
        </AnimatePresence>

        <Button
          type="submit"
          label="Criar minha conta 🪺"
          variant="primary"
          size="md"
          fullWidth
          loading={loading}
          disabled={loading}
        />
      </form>

      <div className="flex items-center justify-center gap-[var(--gap-xs)]">
        <Text variant="caption-regular" color="secondary">Já tem conta?</Text>
        <LinkButton label="Entrar →" linkType="interactive" onClick={onLogin} />
      </div>
    </motion.div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const [screen,      setScreen]      = useState<Screen>('login');
  const [sentToEmail, setSentToEmail] = useState('');

  function handleOtpSent(email: string) {
    setSentToEmail(email);
    setScreen('otp-sent');
  }

  return (
    <div className="min-h-screen bg-ds-pure-white flex flex-col">

      {/* hero */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex flex-col items-center gap-[var(--gap-sm)] px-[var(--padding-lg)] pt-[var(--padding-xxl)] pb-[var(--padding-xl)]"
      >
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
          className="text-6xl leading-none select-none"
          aria-hidden="true"
        >
          🪺
        </motion.span>
        <div className="text-center flex flex-col gap-[var(--gap-xs)]">
          <Text variant="h1" className="font-heading tracking-tight">ninho</Text>
          <Text variant="body-md-regular" color="secondary">
            Seu porto seguro nos dias com bebê.
          </Text>
        </div>
      </motion.header>

      <div className="h-px bg-ds-neutral-border mx-[var(--padding-lg)]" aria-hidden="true" />

      {/* form */}
      <main className="flex-1 flex flex-col px-[var(--padding-lg)] py-[var(--padding-xl)] max-w-sm w-full mx-auto">
        <AnimatePresence mode="wait">
          {screen === 'login' && (
            <motion.div
              key="h-login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-[var(--gap-lg)]"
            >
              <Text variant="h2" className="font-heading">Bem-vinda de volta 👋</Text>
              <Text variant="body-md-regular" color="secondary" className="mt-[var(--gap-xs)]">
                Entre para acompanhar o dia a dia do seu bebê.
              </Text>
            </motion.div>
          )}
          {screen === 'signup' && (
            <motion.div
              key="h-signup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-[var(--gap-lg)]"
            >
              <Text variant="h2" className="font-heading">Vamos criar seu ninho 🪹</Text>
              <Text variant="body-md-regular" color="secondary" className="mt-[var(--gap-xs)]">
                Leva menos de 2 minutos. Promessa.
              </Text>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {screen === 'login' && (
            <LoginForm
              key="login-form"
              onSuccess={handleOtpSent}
              onSignup={() => setScreen('signup')}
            />
          )}
          {screen === 'signup' && (
            <SignupForm
              key="signup-form"
              onLogin={() => setScreen('login')}
              onSuccess={handleOtpSent}
            />
          )}
          {screen === 'otp-sent' && (
            <OtpSentScreen
              key="otp-sent"
              email={sentToEmail}
              onBack={() => setScreen('login')}
            />
          )}
        </AnimatePresence>
      </main>

      <footer className="pb-[var(--padding-lg)] flex justify-center">
        <Text variant="caption-regular" color="secondary" className="opacity-50">
          Ninho · Cuidado com carinho · 🔒 Privacidade protegida
        </Text>
      </footer>
    </div>
  );
}
