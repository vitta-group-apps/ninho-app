/**
 * AuthPage — Production-ready authentication.
 *
 * Inline validation:
 * - Full name: at least 2 words, min 3 chars each
 * - Email: valid format
 * - Password: min 6 chars, helper hint shown before submit
 * - Submit disabled until form is valid (or shows inline errors)
 * - Loading state on CTA
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

type Tab = 'login' | 'signup';

// ─── Validation helpers ───────────────────────────────────────────────────────

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isValidFullName(v: string) {
  const parts = v.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2 && parts.every(p => p.length >= 2);
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ─── Field-level validation ────────────────────────────────────────────────

  const nameError = useMemo(() => {
    if (!touched.fullName || !fullName) return '';
    if (!isValidFullName(fullName)) return 'Digite seu nome completo (nome e sobrenome)';
    return '';
  }, [fullName, touched.fullName]);

  const emailError = useMemo(() => {
    if (!touched.email || !email) return '';
    if (!isValidEmail(email)) return 'Digite um e-mail válido';
    return '';
  }, [email, touched.email]);

  const passwordError = useMemo(() => {
    if (!touched.password || !password) return '';
    if (password.length < 6) return 'A senha deve ter pelo menos 6 caracteres';
    return '';
  }, [password, touched.password]);

  const passwordHint = useMemo(() => {
    if (!touched.password || password.length >= 6) return '';
    return `${password.length}/6 caracteres mínimos`;
  }, [password, touched.password]);

  // Form validity
  const isSignupValid = useMemo(() => {
    return isValidFullName(fullName) && isValidEmail(email) && password.length >= 6;
  }, [fullName, email, password]);

  const isLoginValid = useMemo(() => {
    return isValidEmail(email) && password.length >= 6;
  }, [email, password]);

  const isFormValid = tab === 'signup' ? isSignupValid : isLoginValid;

  function touch(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }));
  }

  function touchAll() {
    const fields: Record<string, boolean> = { email: true, password: true };
    if (tab === 'signup') fields.fullName = true;
    setTouched(fields);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    touchAll();
    if (!isFormValid) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (tab === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: `${window.location.origin}/onboarding/family`,
          },
        });
        if (error) throw error;
        if (data.session) {
          navigate('/onboarding/family');
        } else {
          setSuccess('Conta criada! Verifique seu e-mail e clique no link de confirmação para continuar.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (!data.session) throw new Error('Sessão não encontrada. Tente novamente.');
        navigate('/onboarding');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Algo deu errado';
      // Friendlier error messages
      if (msg.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos. Verifique e tente novamente.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.');
      } else if (msg.includes('User already registered')) {
        setError('Este e-mail já tem uma conta. Tente entrar.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col px-5 py-8"
      style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}
    >
      {/* Back */}
      <button
        onClick={() => navigate('/onboarding')}
        className="flex items-center gap-1.5 mb-6 text-sm font-medium"
        style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif', opacity: 0.65 }}
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Voltar
      </button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col"
      >
        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: 'Quicksand, sans-serif', color: 'hsl(var(--ninho-brown))' }}
        >
          {tab === 'signup' ? 'Criar conta' : 'Entrar'}
        </h1>
        <p
          className="text-sm mb-8"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
        >
          {tab === 'signup' ? 'Comece a organizar sua família.' : 'Bem-vindo de volta.'}
        </p>

        {/* Tab Toggle */}
        <div
          className="flex rounded-2xl p-1 mb-6"
          style={{ backgroundColor: 'hsl(var(--muted))' }}
        >
          {(['signup', 'login'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setSuccess(''); setTouched({}); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                fontFamily: 'Nunito, sans-serif',
                backgroundColor: tab === t ? 'white' : 'transparent',
                color: tab === t ? 'hsl(var(--ninho-brown))' : 'hsl(var(--muted-foreground))',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t === 'signup' ? 'Criar conta' : 'Entrar'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {tab === 'signup' && (
            <div className="space-y-1.5">
              <Label
                className="text-xs font-semibold"
                style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
              >
                Nome completo
              </Label>
              <Input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                onBlur={() => touch('fullName')}
                placeholder="Maria Silva"
                autoComplete="name"
                className="h-12 rounded-2xl border-border"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              />
              {nameError && (
                <p className="text-[11px] text-destructive font-nunito">{nameError}</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label
              className="text-xs font-semibold"
              style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
            >
              E-mail
            </Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => touch('email')}
              placeholder="voce@email.com"
              autoComplete="email"
              className="h-12 rounded-2xl border-border"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            />
            {emailError && (
              <p className="text-[11px] text-destructive font-nunito">{emailError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              className="text-xs font-semibold"
              style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
            >
              Senha
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={() => touch('password')}
                placeholder="••••••••"
                autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                className="h-12 rounded-2xl border-border pr-11"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                tabIndex={-1}
              >
                {showPassword
                  ? <EyeSlashIcon className="w-4 h-4" />
                  : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
            {passwordHint && !passwordError && (
              <p className="text-[11px] text-muted-foreground font-nunito">{passwordHint}</p>
            )}
            {passwordError && (
              <p className="text-[11px] text-destructive font-nunito">{passwordError}</p>
            )}
            {tab === 'signup' && !touched.password && (
              <p className="text-[11px] text-muted-foreground font-nunito">
                Mínimo 6 caracteres
              </p>
            )}
          </div>

          {error && (
            <div
              className="px-3 py-2.5 rounded-xl"
              style={{
                backgroundColor: 'hsl(var(--destructive) / 0.08)',
                border: '1px solid hsl(var(--destructive) / 0.2)',
              }}
            >
              <p className="text-xs text-destructive font-medium" style={{ fontFamily: 'Nunito, sans-serif' }}>
                {error}
              </p>
            </div>
          )}
          {success && (
            <div
              className="px-3 py-2.5 rounded-xl"
              style={{
                backgroundColor: 'hsl(var(--ninho-sage) / 0.1)',
                border: '1px solid hsl(var(--ninho-sage) / 0.25)',
              }}
            >
              <p className="text-xs font-medium" style={{ color: 'hsl(var(--ninho-sage))', fontFamily: 'Nunito, sans-serif' }}>
                {success}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl text-sm font-bold mt-2"
            style={{
              height: '52px',
              backgroundColor: loading ? 'hsl(var(--ninho-sage) / 0.7)' : 'hsl(var(--ninho-sage))',
              color: 'white',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            {loading
              ? 'Aguarde...'
              : tab === 'signup'
              ? 'Criar minha conta'
              : 'Entrar'}
          </Button>

          {tab === 'login' && (
            <button
              type="button"
              onClick={() => navigate('/reset-password')}
              className="w-full text-center text-[12px] font-semibold font-nunito pt-1"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              Esqueceu a senha?
            </button>
          )}
        </form>
      </motion.div>
    </div>
  );
}
