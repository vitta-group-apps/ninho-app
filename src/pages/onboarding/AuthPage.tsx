/**
 * AuthPage — Production-ready authentication.
 *
 * Signup: only email + password (NO name field here — name is collected on /onboarding/nome)
 * Login: email + password
 * Social: Google + Apple (placeholder buttons, OAuth wired via Supabase)
 *
 * Password rules (signup):
 * - minimum 6 characters
 * - at least 1 uppercase letter
 * - at least 1 number
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import simboloNinho from '@/assets/simbolo-ninho.png';

type Tab = 'signup' | 'login';

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

interface PasswordStrength {
  minLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasLetter: boolean;
}

function checkPassword(p: string): PasswordStrength {
  return {
    minLength: p.length >= 6,
    hasUppercase: /[A-Z]/.test(p),
    hasNumber: /[0-9]/.test(p),
    hasLetter: /[a-zA-Z]/.test(p),
  };
}

function isPasswordValid(s: PasswordStrength) {
  return s.minLength && s.hasUppercase && s.hasNumber && s.hasLetter;
}

function PasswordRule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {ok ? (
        <CheckCircleSolidIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#789687' }} />
      ) : (
        <CheckCircleIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#aaa' }} />
      )}
      <span
        className="text-[11px]"
        style={{ fontFamily: 'Nunito, sans-serif', color: ok ? '#789687' : '#aaa' }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── OTP Screen ─────────────────────────────────────────────────────────────

function OTPScreen({ email, onBack }: { email: string; onBack: () => void }) {
  const navigate = useNavigate();
  const [digits, setDigits] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timer <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setTimer(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  function handleDigit(i: number, val: string) {
    const v = val.replace(/\D/, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 4) {
      (document.getElementById(`otp-${i + 1}`) as HTMLInputElement)?.focus();
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      (document.getElementById(`otp-${i - 1}`) as HTMLInputElement)?.focus();
    }
  }

  async function verify() {
    const token = digits.join('');
    if (token.length < 5) return;
    setError('');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (error) throw error;
      if (data.session) {
        navigate('/onboarding/nome');
      }
    } catch {
      setError('Código inválido. Verifique e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setCanResend(false);
    setTimer(59);
    await supabase.auth.resend({ type: 'signup', email });
  }

  const code = digits.join('');

  return (
    <motion.div
      key="otp"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col flex-1 px-5 pt-6"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 mb-8 text-sm font-medium self-start"
        style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Nunito, sans-serif' }}
      >
        ← Voltar e corrigir e-mail
      </button>

      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
        style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
      >
        <span className="text-2xl">📬</span>
      </div>

      <h2
        className="text-2xl font-bold mb-2"
        style={{ color: 'white', fontFamily: 'Quicksand, sans-serif' }}
      >
        Confirme seu e-mail
      </h2>
      <p
        className="text-sm mb-1"
        style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'Nunito, sans-serif' }}
      >
        Enviamos um código de 5 dígitos para
      </p>
      <p
        className="text-sm font-semibold mb-8"
        style={{ color: 'white', fontFamily: 'Nunito, sans-serif' }}
      >
        {email}
      </p>

      {/* 5 OTP inputs */}
      <div className="flex gap-3 mb-6 justify-center">
        {digits.map((d, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className="rounded-xl text-center font-bold text-xl focus:outline-none transition-all"
            style={{
              width: 48,
              height: 56,
              backgroundColor: 'rgba(255,255,255,0.12)',
              border: d ? '2px solid rgba(255,255,255,0.7)' : '2px solid rgba(255,255,255,0.2)',
              color: 'white',
              fontFamily: 'Quicksand, sans-serif',
            }}
          />
        ))}
      </div>

      {error && (
        <p
          className="text-xs text-center mb-4 font-medium"
          style={{ color: '#f87171', fontFamily: 'Nunito, sans-serif' }}
        >
          {error}
        </p>
      )}

      <button
        onClick={verify}
        disabled={loading || code.length < 5}
        className="w-full rounded-2xl font-bold text-[15px] mb-4 transition-opacity"
        style={{
          height: 52,
          backgroundColor: code.length === 5 ? 'white' : 'rgba(255,255,255,0.2)',
          color: code.length === 5 ? '#806e84' : 'rgba(255,255,255,0.5)',
          fontFamily: 'Nunito, sans-serif',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Verificando...' : 'Verificar →'}
      </button>

      <div className="text-center">
        {canResend ? (
          <button
            onClick={resend}
            className="text-sm font-semibold"
            style={{ color: 'white', fontFamily: 'Nunito, sans-serif' }}
          >
            Reenviar código
          </button>
        ) : (
          <p
            className="text-sm"
            style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Nunito, sans-serif' }}
          >
            Reenviar em 0:{String(timer).padStart(2, '0')}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main AuthPage ────────────────────────────────────────────────────────────

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(
    searchParams.get('tab') === 'login' ? 'login' : 'signup'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showOTP, setShowOTP] = useState(false);

  const emailError = useMemo(() => {
    if (!touched.email || !email) return '';
    if (!isValidEmail(email)) return 'Digite um e-mail válido';
    return '';
  }, [email, touched.email]);

  const passwordStrength = useMemo(() => checkPassword(password), [password]);
  const showPasswordRules = tab === 'signup' && (touched.password || password.length > 0);

  const isSignupValid = isValidEmail(email) && isPasswordValid(passwordStrength);
  const isLoginValid = isValidEmail(email) && password.length >= 6;
  const isFormValid = tab === 'signup' ? isSignupValid : isLoginValid;

  function touch(f: string) {
    setTouched(p => ({ ...p, [f]: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isFormValid) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (tab === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/onboarding/nome` },
        });
        if (error) throw error;
        if (data.session) {
          navigate('/onboarding/nome');
        } else {
          setShowOTP(true);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (!data.session) throw new Error('Sessão não encontrada.');
        navigate('/onboarding');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos. Verifique e tente novamente.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Confirme seu e-mail antes de entrar. Reenviamos o código.');
        setShowOTP(true);
      } else if (msg.includes('User already registered')) {
        setError('Esse e-mail já está cadastrado. Tente entrar ou recuperar a senha.');
      } else if (msg.includes('Password should be at least')) {
        setError('A senha precisa ter pelo menos 6 caracteres.');
      } else {
        setError('Algo deu errado. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });
  }

  async function handleApple() {
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });
  }

  if (showOTP) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#806e84' }}>
        <AnimatePresence mode="wait">
          <OTPScreen email={email} onBack={() => setShowOTP(false)} />
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#806e84' }}>
      {/* Header */}
      <div
        className="px-5 pt-12 pb-7"
        style={{ borderRadius: '0 0 28px 28px', backgroundColor: '#806e84' }}
      >
        <button
          onClick={() => navigate('/onboarding')}
          className="flex items-center gap-1.5 mb-6 text-sm font-medium"
          style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Nunito, sans-serif' }}
        >
          ← Voltar
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.22)',
              backgroundColor: 'rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img src={simboloNinho} alt="Ninho" style={{ width: 20, height: 20, objectFit: 'contain' }} />
          </div>
          <span
            style={{ color: 'white', fontFamily: 'Quicksand, sans-serif', fontWeight: 700, fontSize: 20 }}
          >
            ninho
          </span>
        </div>

        {/* Tab toggle */}
        <div
          className="flex rounded-2xl p-1"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
        >
          {(['signup', 'login'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setSuccess(''); setTouched({}); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                fontFamily: 'Nunito, sans-serif',
                backgroundColor: tab === t ? 'white' : 'transparent',
                color: tab === t ? '#806e84' : 'rgba(255,255,255,0.65)',
              }}
            >
              {t === 'signup' ? 'Criar conta' : 'Entrar'}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col px-5 py-6">
        {/* Social buttons */}
        <div className="space-y-3 mb-5">
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 rounded-2xl font-semibold text-sm transition-opacity active:opacity-70"
            style={{
              height: 50,
              backgroundColor: 'rgba(255,255,255,0.12)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              color: 'white',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 19.07 12c0 3.95-3.18 7.08-7.08 7.08a7.08 7.08 0 0 1-6.72-4.84l-3.19 2.47A11.5 11.5 0 0 0 12 23.5c5.85 0 10.77-4.37 11.5-10H12v-4.5H23.5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 1.58 5.77l3.19-2.47z" />
            </svg>
            Continuar com Google
          </button>
          <button
            onClick={handleApple}
            className="w-full flex items-center justify-center gap-3 rounded-2xl font-semibold text-sm transition-opacity active:opacity-70"
            style={{
              height: 50,
              backgroundColor: 'rgba(255,255,255,0.12)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              color: 'white',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Continuar com Apple
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
          <span
            className="text-xs"
            style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Nunito, sans-serif' }}
          >
            ou use e-mail
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleSubmit}
            className="space-y-4"
            noValidate
          >
            {/* Email */}
            <div className="space-y-1.5">
              <Label
                className="text-xs font-semibold"
                style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Nunito, sans-serif' }}
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
                className="h-12 rounded-2xl border-0 text-sm"
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  color: 'white',
                }}
              />
              {emailError && (
                <p className="text-[11px]" style={{ color: '#fca5a5', fontFamily: 'Nunito, sans-serif' }}>
                  {emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                className="text-xs font-semibold"
                style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Nunito, sans-serif' }}
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
                  className="h-12 rounded-2xl border-0 pr-11 text-sm"
                  style={{
                    fontFamily: 'Nunito, sans-serif',
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    color: 'white',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  tabIndex={-1}
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>

              {showPasswordRules && (
                <div className="pt-1 space-y-1">
                  <PasswordRule ok={passwordStrength.minLength} label="≥ 6 caracteres" />
                  <PasswordRule ok={passwordStrength.hasUppercase} label="1 maiúscula" />
                  <PasswordRule ok={passwordStrength.hasNumber} label="1 número" />
                  <PasswordRule ok={passwordStrength.hasLetter} label="1 letra" />
                </div>
              )}
            </div>

            {error && (
              <div
                className="px-3 py-2.5 rounded-xl"
                style={{ backgroundColor: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)' }}
              >
                <p className="text-xs font-medium" style={{ color: '#fca5a5', fontFamily: 'Nunito, sans-serif' }}>
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div
                className="px-3 py-2.5 rounded-xl"
                style={{ backgroundColor: 'rgba(120,150,135,0.2)', border: '1px solid rgba(120,150,135,0.35)' }}
              >
                <p className="text-xs font-medium" style={{ color: '#86efac', fontFamily: 'Nunito, sans-serif' }}>
                  {success}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl font-bold text-[15px] transition-opacity"
              style={{
                height: 52,
                backgroundColor: 'white',
                color: '#806e84',
                fontFamily: 'Nunito, sans-serif',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? 'Aguarde...'
                : tab === 'signup'
                ? 'Criar minha conta →'
                : 'Entrar →'}
            </button>

            {tab === 'login' && (
              <button
                type="button"
                onClick={() => navigate('/reset-password')}
                className="w-full text-center text-[12px] font-semibold pt-1"
                style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Nunito, sans-serif' }}
              >
                Esqueci minha senha
              </button>
            )}

            <p
              className="text-[10px] text-center pt-1 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Nunito, sans-serif' }}
            >
              Ao continuar, você concorda com nossos{' '}
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>Termos de Uso</span> e{' '}
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>Política de Privacidade</span>
            </p>
          </motion.form>
        </AnimatePresence>
      </div>
    </div>
  );
}
