/**
 * AuthPage — Production-ready authentication.
 *
 * Password rules (signup):
 * - minimum 6 characters
 * - at least 1 uppercase letter
 * - at least 1 number
 * - at least 1 special character
 *
 * Full name: at least 2 words, each ≥ 2 chars
 * Email: valid format
 * Helper text visible BEFORE first submit attempt
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

type Tab = 'login' | 'signup';

// ─── Validation helpers ───────────────────────────────────────────────────────

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isValidFullName(v: string) {
  const parts = v.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2 && parts.every(p => p.length >= 2);
}

interface PasswordStrength {
  minLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

function checkPasswordStrength(password: string): PasswordStrength {
  return {
    minLength: password.length >= 6,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password),
  };
}

function isPasswordValid(strength: PasswordStrength): boolean {
  return strength.minLength && strength.hasUppercase && strength.hasNumber && strength.hasSpecial;
}

// ─── Password Rule Row ────────────────────────────────────────────────────────

function PasswordRule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {ok ? (
        <CheckCircleSolidIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(var(--ninho-sage))' }} />
      ) : (
        <CheckCircleIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
      )}
      <span
        className="text-[11px]"
        style={{
          fontFamily: 'Nunito, sans-serif',
          color: ok ? 'hsl(var(--ninho-sage))' : 'hsl(var(--muted-foreground))',
        }}
      >
        {label}
      </span>
    </div>
  );
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

  const passwordStrength = useMemo(() => checkPasswordStrength(password), [password]);

  const passwordError = useMemo(() => {
    if (!touched.password || !password) return '';
    if (tab === 'signup' && !isPasswordValid(passwordStrength)) {
      return 'A senha não atende todos os requisitos';
    }
    if (tab === 'login' && password.length < 6) {
      return 'A senha deve ter pelo menos 6 caracteres';
    }
    return '';
  }, [password, touched.password, tab, passwordStrength]);

  // Show password rules in signup if field was touched OR if there's a password value
  const showPasswordRules = tab === 'signup' && (touched.password || password.length > 0);

  // Form validity
  const isSignupValid = useMemo(() => {
    return isValidFullName(fullName) && isValidEmail(email) && isPasswordValid(passwordStrength);
  }, [fullName, email, passwordStrength]);

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
      if (msg.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos. Verifique e tente novamente.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.');
      } else if (msg.includes('User already registered')) {
        setError('Este e-mail já tem uma conta. Tente entrar.');
      } else {
        setError('Algo deu errado. Tente novamente.');
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
              {!touched.fullName && (
                <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                  Digite seu nome e sobrenome
                </p>
              )}
              {nameError && (
                <p className="text-[11px] text-destructive" style={{ fontFamily: 'Nunito, sans-serif' }}>{nameError}</p>
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
              <p className="text-[11px] text-destructive" style={{ fontFamily: 'Nunito, sans-serif' }}>{emailError}</p>
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

            {/* Password rules — shown in signup as soon as user starts typing */}
            {showPasswordRules && (
              <div className="pt-1 space-y-1">
                <PasswordRule ok={passwordStrength.minLength} label="Mínimo 6 caracteres" />
                <PasswordRule ok={passwordStrength.hasUppercase} label="Pelo menos 1 letra maiúscula" />
                <PasswordRule ok={passwordStrength.hasNumber} label="Pelo menos 1 número" />
                <PasswordRule ok={passwordStrength.hasSpecial} label="Pelo menos 1 caractere especial (!@#...)" />
              </div>
            )}

            {/* Pre-touch helper for signup */}
            {tab === 'signup' && !touched.password && password.length === 0 && (
              <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                Mínimo 6 caracteres com maiúscula, número e símbolo
              </p>
            )}

            {/* Login-only password error */}
            {tab === 'login' && passwordError && (
              <p className="text-[11px] text-destructive" style={{ fontFamily: 'Nunito, sans-serif' }}>{passwordError}</p>
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
              className="w-full text-center text-[12px] font-semibold pt-1"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
            >
              Esqueceu a senha?
            </button>
          )}
        </form>
      </motion.div>
    </div>
  );
}
