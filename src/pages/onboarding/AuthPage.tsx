/**
 * NINHO — AuthPage  ·  Molecule: AuthForm + MagicLinkForm
 * Nitro™ Core v3.0 — Arquitetura Atômica
 *
 * Agentes: ZEUS (layout Pure White) · LUMEN (copy emocional) · MINERVA (zero atrito)
 *          LUKE (Magic Link como caminho principal) · LEX (privacy consent)
 *
 * Átomos: TextInput · Button · Text · LinkButton
 * Fundo:  bg-ds-pure-white — sem fundos escuros, sem cards flutuantes
 * Fluxo:
 *   login    → email + password  OU  Magic Link (signInWithOtp)
 *   signup   → name + email + password + consent
 *   otp-sent → ecrã de confirmação ("Verifica o teu e-mail")
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Text }       from '@/design-system/components/ui/Text';
import { Button }     from '@/design-system/components/ui/Button';
import { TextInput }  from '@/design-system/components/ui/TextInput';
import { LinkButton } from '@/design-system/components/ui/LinkButton';
import { supabase, translateSupabaseError } from '@/lib/supabase';

// ─── tipos ────────────────────────────────────────────────────────────────────

type Screen = 'login' | 'signup' | 'otp-sent';

// ─── validação ────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(v: string): string | null {
  if (!v.trim())            return 'E-mail obrigatório';
  if (!EMAIL_RE.test(v))    return 'Formato de e-mail inválido';
  return null;
}

function validatePassword(v: string): string | null {
  if (!v)         return 'Palavra-passe obrigatória';
  if (v.length < 6) return 'A palavra-passe precisa de ter pelo menos 6 caracteres';
  return null;
}

// ─── feedback inline ──────────────────────────────────────────────────────────

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

// ─── divider ornamental ───────────────────────────────────────────────────────

function OrDivider() {
  return (
    <div className="flex items-center gap-[var(--gap-sm)]" aria-hidden="true">
      <div className="flex-1 h-px bg-ds-neutral-border" />
      <Text variant="caption-regular" color="secondary" as="span">ou</Text>
      <div className="flex-1 h-px bg-ds-neutral-border" />
    </div>
  );
}

// ─── stepper de progresso (visual dots) ───────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-[var(--gap-xs)]" aria-label={`Passo ${current} de ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={[
            'rounded-full transition-all duration-300',
            i + 1 === current
              ? 'w-[var(--gap-md)] h-[var(--gap-xs)] bg-ds-accent-tint'
              : i + 1 < current
              ? 'w-[var(--gap-xs)] h-[var(--gap-xs)] bg-ds-accent-fg'
              : 'w-[var(--gap-xs)] h-[var(--gap-xs)] bg-ds-neutral-border',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

// ─── ecrã: link mágico enviado ────────────────────────────────────────────────

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
        <Text variant="h2" className="font-heading">Verifica o teu e-mail</Text>
        <Text variant="body-md-regular" color="secondary">
          Enviámos um link mágico para
        </Text>
        <Text variant="body-md-semibold">{email}</Text>
        <Text variant="body-md-regular" color="secondary">
          Clica no link para entrar instantaneamente — sem palavra-passe.
        </Text>
      </div>

      <div className="flex flex-col gap-[var(--gap-sm)] w-full">
        <Text variant="caption-regular" color="secondary">
          Não recebeste nada? Verifica o spam ou tenta novamente.
        </Text>
        <LinkButton
          label="← Voltar e tentar novamente"
          linkType="gray"
          onClick={onBack}
        />
      </div>
    </motion.div>
  );
}

// ─── ecrã: login ──────────────────────────────────────────────────────────────

function LoginForm({ onSuccess, onSignup }: { onSuccess: (email: string) => void; onSignup: () => void }) {
  const [email,          setEmail]          = useState('');
  const [password,       setPassword]       = useState('');
  const [loading,        setLoading]        = useState(false);
  const [magicLoading,   setMagicLoading]   = useState(false);
  const [apiError,       setApiError]       = useState<string | null>(null);
  const [emailTouched,   setEmailTouched]   = useState(false);
  const [passTouched,    setPassTouched]    = useState(false);

  const emailErr = emailTouched    ? validateEmail(email)    : null;
  const passErr  = passTouched     ? validatePassword(password) : null;

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
      // sucesso → onAuthStateChange em useSession trata a navegação
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    setEmailTouched(true);
    if (validateEmail(email)) return;

    setApiError(null);
    setMagicLoading(true);
    try {
      const { error: sbErr } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
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

  return (
    <motion.div
      key="login"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      className="flex flex-col gap-[var(--gap-md)]"
    >
      <form onSubmit={handlePassword} noValidate className="flex flex-col gap-[var(--gap-md)]">
        <TextInput
          label="E-mail"
          type="email"
          placeholder="o.teu@email.com"
          value={email}
          onChange={e => { setEmail(e.target.value); setApiError(null); }}
          onBlur={() => setEmailTouched(true)}
          error={emailErr ?? undefined}
          autoComplete="email"
          size="md"
          fullWidth
        />

        <TextInput
          label="Palavra-passe"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => { setPassword(e.target.value); setApiError(null); }}
          onBlur={() => setPassTouched(true)}
          error={passErr ?? undefined}
          autoComplete="current-password"
          size="md"
          fullWidth
        />

        <AnimatePresence mode="wait">
          {apiError && <InlineFeedback key="err" type="error" message={apiError} />}
        </AnimatePresence>

        <Button
          type="submit"
          label="Entrar"
          variant="primary"
          size="md"
          fullWidth
          loading={loading}
          disabled={loading || magicLoading}
        />
      </form>

      <OrDivider />

      {/* Magic Link — caminho sem atrito */}
      <Button
        label="Entrar com link mágico 💫"
        variant="secondary"
        size="md"
        fullWidth
        loading={magicLoading}
        disabled={loading || magicLoading}
        onClick={handleMagicLink}
      />
      <Text variant="caption-regular" color="secondary" className="text-center -mt-[var(--gap-xs)]">
        Receberes um link no teu e-mail — sem palavra-passe.
      </Text>

      {/* toggle para signup */}
      <div className="flex items-center justify-center gap-[var(--gap-xs)] pt-[var(--gap-xs)]">
        <Text variant="caption-regular" color="secondary">Primeira vez aqui?</Text>
        <LinkButton label="Criar o meu ninho →" linkType="interactive" onClick={onSignup} />
      </div>
    </motion.div>
  );
}

// ─── ecrã: signup ─────────────────────────────────────────────────────────────

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

  const emailErr    = emailTouched    ? validateEmail(email)       : null;
  const passErr     = passTouched     ? validatePassword(password) : null;
  const consentErr  = consentTouched && !consent
    ? 'Aceita os termos para continuar'
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
          label="O teu nome"
          placeholder="Como devo chamar-te?"
          value={name}
          onChange={e => setName(e.target.value)}
          autoComplete="name"
          size="md"
          fullWidth
        />

        <TextInput
          label="E-mail"
          type="email"
          placeholder="o.teu@email.com"
          value={email}
          onChange={e => { setEmail(e.target.value); setApiError(null); }}
          onBlur={() => setEmailTouched(true)}
          error={emailErr ?? undefined}
          autoComplete="email"
          size="md"
          fullWidth
        />

        <TextInput
          label="Palavra-passe"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={e => { setPassword(e.target.value); setApiError(null); }}
          onBlur={() => setPassTouched(true)}
          error={passErr ?? undefined}
          hint="Os teus dados ficam seguros e cifrados."
          autoComplete="new-password"
          size="md"
          fullWidth
        />

        {/* LEX: consentimento de privacidade */}
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
              Aceito que os meus dados sejam tratados de acordo com a{' '}
              <span className="text-ds-accent-fg font-semibold">Política de Privacidade</span>
              . Os dados de saúde do meu bebé são armazenados de forma cifrada.
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
          label="Criar o meu ninho"
          variant="primary"
          size="md"
          fullWidth
          loading={loading}
          disabled={loading}
        />
      </form>

      <div className="flex items-center justify-center gap-[var(--gap-xs)]">
        <Text variant="caption-regular" color="secondary">Já tens ninho?</Text>
        <LinkButton label="Entrar →" linkType="interactive" onClick={onLogin} />
      </div>
    </motion.div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const [screen,       setScreen]       = useState<Screen>('login');
  const [sentToEmail,  setSentToEmail]  = useState('');

  function handleOtpSent(email: string) {
    setSentToEmail(email);
    setScreen('otp-sent');
  }

  function handleSignupSuccess(email: string) {
    setSentToEmail(email);
    setScreen('otp-sent');
  }

  return (
    <div className="min-h-screen bg-ds-pure-white flex flex-col">

      {/* ── hero ──────────────────────────────────────────────────────── */}
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
            O teu porto seguro para os dias de bebé.
          </Text>
        </div>
      </motion.header>

      {/* ── divisor ───────────────────────────────────────────────────── */}
      <div className="h-px bg-ds-neutral-border mx-[var(--padding-lg)]" aria-hidden="true" />

      {/* ── form area ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col px-[var(--padding-lg)] py-[var(--padding-xl)] max-w-sm w-full mx-auto">

        {/* heading contextual */}
        <AnimatePresence mode="wait">
          {screen === 'login' && (
            <motion.div
              key="h-login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-[var(--gap-lg)]"
            >
              <Text variant="h2" className="font-heading">Bem-vindo de volta 👋</Text>
              <Text variant="body-md-regular" color="secondary" className="mt-[var(--gap-xs)]">
                Entra para continuar a acompanhar o teu bebé.
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
              <Text variant="h2" className="font-heading">Vamos criar o teu ninho 🪹</Text>
              <Text variant="body-md-regular" color="secondary" className="mt-[var(--gap-xs)]">
                Leva menos de 2 minutos. Prometemos.
              </Text>
            </motion.div>
          )}
        </AnimatePresence>

        {/* forms */}
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
              onSuccess={handleSignupSuccess}
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

      {/* ── rodapé ────────────────────────────────────────────────────── */}
      <footer className="pb-[var(--padding-lg)] flex justify-center">
        <Text variant="caption-regular" color="secondary" className="opacity-50">
          Ninho · Cuidado Inteligente ·{' '}
          <span aria-hidden="true">🔒</span>
          {' '}Privacidade protegida
        </Text>
      </footer>
    </div>
  );
}
