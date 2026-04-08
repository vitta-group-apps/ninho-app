/**
 * NINHO — AuthPage
 * Molecule: AuthForm — Login / Cadastro com DS atoms.
 *
 * Nitro™ Core v3.0 — Arquitetura Atômica
 *
 * Átomos usados: TextInput · Button · Text
 * Estética: Apple Visual Library — espaçamento generoso, bordas arredondadas,
 *           logo + marca centrados, card flutuante com sombra suave.
 *
 * Fluxo:
 *   - Login   → supabase.auth.signInWithPassword
 *   - Cadastro → supabase.auth.signUp → mostra mensagem de confirmação
 *   - Erro     → exibe inline abaixo do formulário
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Text }      from '@/design-system/components/ui/Text';
import { Button }    from '@/design-system/components/ui/Button';
import { TextInput } from '@/design-system/components/ui/TextInput';
import { supabase, translateSupabaseError } from '@/lib/supabase';

// ─── tipos ───────────────────────────────────────────────────────────────────

type AuthMode = 'login' | 'signup';

// ─── AuthForm molecule ────────────────────────────────────────────────────────

function AuthForm() {
  const [mode,     setMode]     = useState<AuthMode>('login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState<string | null>(null);

  function toggleMode() {
    setMode(m => m === 'login' ? 'signup' : 'login');
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error: sbErr } = await supabase.auth.signInWithPassword({ email, password });
        if (sbErr) setError(translateSupabaseError(sbErr));
        // On success: onAuthStateChange in useSession handles navigation
      } else {
        const { error: sbErr } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (sbErr) {
          setError(translateSupabaseError(sbErr));
        } else {
          setSuccess('Confirma o teu e-mail para activar a conta. Depois volta aqui e entra.');
          setEmail('');
          setPassword('');
          setName('');
          setMode('login');
        }
      }
    } finally {
      setLoading(false);
    }
  }

  const isLogin  = mode === 'login';
  const canSubmit = email.trim().length > 0 && password.length >= 6;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[var(--gap-md)]">

      {/* name — só no signup */}
      <AnimatePresence>
        {!isLogin && (
          <motion.div
            key="name-field"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <TextInput
              label="Nome"
              placeholder="Como te chamas?"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
              size="md"
              fullWidth
            />
          </motion.div>
        )}
      </AnimatePresence>

      <TextInput
        label="E-mail"
        type="email"
        placeholder="o.teu@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        autoComplete={isLogin ? 'email' : 'username'}
        size="md"
        fullWidth
      />

      <TextInput
        label="Palavra-passe"
        type="password"
        placeholder={isLogin ? '••••••••' : 'Mínimo 6 caracteres'}
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoComplete={isLogin ? 'current-password' : 'new-password'}
        hint={!isLogin ? 'Mínimo de 6 caracteres' : undefined}
        size="md"
        fullWidth
      />

      {/* error / success feedback */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-[var(--radius-sm)] bg-ds-error-subtle border border-ds-error-border px-[var(--padding-md)] py-[var(--padding-sm)]"
            role="alert"
          >
            <Text variant="caption-medium" className="text-ds-error-fg-strong">{error}</Text>
          </motion.div>
        )}
        {success && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-[var(--radius-sm)] bg-ds-success-subtle border border-ds-success-border px-[var(--padding-md)] py-[var(--padding-sm)]"
            role="status"
          >
            <Text variant="caption-medium" className="text-ds-success-fg-strong">{success}</Text>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        type="submit"
        label={isLogin ? 'Entrar' : 'Criar conta'}
        variant="primary"
        size="md"
        fullWidth
        loading={loading}
        disabled={loading || !canSubmit}
      />

      {/* toggle mode */}
      <div className="flex items-center justify-center gap-[var(--gap-xs)] pt-[var(--gap-xs)]">
        <Text variant="caption-regular" color="secondary">
          {isLogin ? 'Ainda não tens conta?' : 'Já tens conta?'}
        </Text>
        <button
          type="button"
          onClick={toggleMode}
          className="font-body text-text-sm font-semibold text-ds-accent-fg hover:text-ds-accent-fg-strong underline underline-offset-2 transition-colors"
        >
          {isLogin ? 'Criar conta' : 'Entrar'}
        </button>
      </div>
    </form>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">

      {/* brand */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex flex-col items-center gap-[var(--gap-sm)] mb-10"
      >
        <span className="text-5xl leading-none select-none" aria-hidden="true">🪺</span>
        <div className="text-center">
          <Text variant="h1" className="font-heading">ninho</Text>
          <Text variant="body-md-regular" color="secondary">cuidar, juntos.</Text>
        </div>
      </motion.div>

      {/* card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="w-full max-w-sm bg-ds-pure-white rounded-[var(--radius-xl)] shadow-ds-md px-6 py-8"
      >
        <AuthForm />
      </motion.div>

      {/* footer */}
      <Text variant="caption-regular" color="secondary" className="mt-8 text-center opacity-60">
        Ninho v2 · Feito com ❤️ para pais e bebés
      </Text>
    </div>
  );
}
