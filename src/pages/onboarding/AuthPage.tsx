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
import {
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon } from
'@heroicons/react/24/outline';
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
    hasLetter: /[a-zA-Z]/.test(p)
  };
}

function isPasswordValid(s: PasswordStrength) {
  return s.minLength && s.hasUppercase && s.hasNumber && s.hasLetter;
}

function PasswordRule({ ok, label }: {ok: boolean;label: string;}) {
  return (
    <div className="flex items-center gap-1.5">
      {ok ?
      <CheckCircleSolidIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#789687' }} /> :

      <CheckCircleIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#CBCBC8' }} />
      }
      <span className="text-[11px]" style={{
        fontFamily: 'Nunito, sans-serif',
        color: ok ? '#789687' : '#CBCBC8'
      }}>
        {label}
      </span>
    </div>);

}

// ─── OTP Screen ──────────────────────────────────────────────────────────────
function OTPScreen({ email, onBack }: {email: string;onBack: () => void;}) {
  const navigate = useNavigate();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timer <= 0) {setCanResend(true);return;}
    const t = setTimeout(() => setTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  function handleDigit(i: number, val: string) {
    const v = val.replace(/\D/, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) {
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
    if (token.length < 6) return;
    setError('');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email, token, type: 'email'
      });
      if (error) throw error;
      if (data.session) navigate('/onboarding/nome');
    } catch {
      setError('Código inválido. Verifique e tente novamente.');
      setDigits(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setCanResend(false);
    setTimer(59);
    await supabase.auth.resend({ type: 'signup', email });
  }

  return (
    // OTP mantém fundo roxo — é tela de transição, faz sentido visualmente
    <div className="flex flex-col flex-1" style={{ backgroundColor: '#806e84', minHeight: '100vh' }}>
      {/* Header roxo com grain */}
      <div className="relative overflow-hidden px-6 pt-12 pb-8"
      style={{ backgroundColor: '#806e84', borderRadius: '0 0 28px 28px' }}>
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }} />
        <button onClick={onBack} className="relative z-10 flex items-center gap-1.5 mb-6 text-sm font-semibold"
        style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'Nunito, sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Voltar e corrigir e-mail
        </button>
        <div className="relative z-10 text-4xl mb-4">📬</div>
        <h2 className="relative z-10 text-[22px] font-bold text-white mb-1.5"
        style={{ fontFamily: 'Quicksand, sans-serif' }}>
          Confirme seu e-mail
        </h2>
        <p className="relative z-10 text-[13px]"
        style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Nunito, sans-serif', lineHeight: 1.5 }}>
          Enviamos um código de 6 dígitos para{' '}
          <strong style={{ color: 'white' }}>{email}</strong>
        </p>
      </div>

      {/* Corpo claro */}
      <div className="flex-1 px-6 pt-6 pb-10" style={{ backgroundColor: '#F8F5F0' }}>
        {/* 5 inputs OTP */}
        <div className="flex gap-2.5 justify-center mb-6">
          {digits.map((d, i) =>
          <input
            key={i}
            id={`otp-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            autoFocus={i === 0}
            className="text-center font-bold text-2xl outline-none transition-all"
            style={{
              width: 52, height: 60,
              borderRadius: 12,
              backgroundColor: '#E8E8E2',
              border: d ? '2px solid #806e84' : '2px solid transparent',
              color: '#2C2C2C',
              fontFamily: 'Quicksand, sans-serif'
            }} />

          )}
        </div>

        {error &&
        <div className="mb-4 px-3 py-2.5 rounded-xl text-xs font-medium text-center"
        style={{ backgroundColor: '#FCEAEA', border: '1px solid #f5caca', color: '#C04A4A', fontFamily: 'Nunito, sans-serif' }}>
            {error}
          </div>
        }

        <button
          onClick={verify}
          disabled={loading || digits.join('').length < 6}
          className="w-full rounded-2xl font-bold text-[15px] mb-4 transition-opacity disabled:opacity-40"
          style={{
            height: 52,
            backgroundColor: '#806e84',
            color: 'white',
            fontFamily: 'Nunito, sans-serif',
            border: 'none',
            cursor: 'pointer'
          }}>
          {loading ? 'Verificando...' : 'Verificar →'}
        </button>

        <div className="text-center">
          {canResend ?
          <button onClick={resend} className="text-sm font-bold"
          style={{ color: '#806e84', fontFamily: 'Nunito, sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}>
              Reenviar código
            </button> :

          <p className="text-sm" style={{ color: '#7A7A7A', fontFamily: 'Nunito, sans-serif' }}>
              Reenviar em <strong>0:{String(timer).padStart(2, '0')}</strong>
            </p>
          }
        </div>

        <div className="text-center mt-3">
          <button onClick={onBack} className="text-xs"
          style={{ color: '#7A7A7A', fontFamily: 'Nunito, sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Voltar e corrigir e-mail
          </button>
        </div>
      </div>
    </div>);

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
    setTouched((p) => ({ ...p, [f]: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isFormValid) return;
    setError('');
    setLoading(true);
    try {
      if (tab === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/onboarding/nome` }
        });
        if (error) throw error;
        if (data.session) {
          navigate('/onboarding/nome');
        } else {
          setShowOTP(true);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(), password
        });
        if (error) throw error;
        if (!data.session) throw new Error('Sessão não encontrada.');
        // Roteamento correto: App.tsx + OnboardingGuard decidem para onde ir
        navigate('/onboarding');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Invalid login credentials'))
      setError('E-mail ou senha incorretos. Verifique e tente novamente.');else
      if (msg.includes('Email not confirmed')) {
        if (tab === 'signup') {
          setShowOTP(true);
        } else {
          setError('Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou crie uma nova conta.');
        }
      } else if (msg.includes('User already registered'))
      setError('Esse e-mail já está cadastrado. Tente entrar ou recuperar a senha.');else
      if (msg.includes('Password should be at least'))
      setError('A senha precisa ter pelo menos 6 caracteres.');else

      setError('Algo deu errado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      const { lovable } = await import('@/integrations/lovable/index');
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: `${window.location.origin}/onboarding`
      });
      if (result.error) {
        setError('Não foi possível entrar com Google. Tente novamente.');
        return;
      }
      if (result.redirected) return;
      navigate('/onboarding');
    } catch {
      setError('Erro ao conectar com Google. Tente novamente.');
    }
  }

  async function handleApple() {
    try {
      const { lovable } = await import('@/integrations/lovable/index');
      const result = await lovable.auth.signInWithOAuth('apple', {
        redirect_uri: `${window.location.origin}/onboarding`
      });
      if (result.error) {
        setError('Não foi possível entrar com Apple. Tente novamente.');
        return;
      }
      if (result.redirected) return;
      navigate('/onboarding');
    } catch {
      setError('Erro ao conectar com Apple. Tente novamente.');
    }
  }

  if (showOTP) {
    return (
      <AnimatePresence mode="wait">
        <OTPScreen email={email} onBack={() => setShowOTP(false)} />
      </AnimatePresence>);

  }

  return (
    // ← MUDANÇA PRINCIPAL: flex-col, sem min-h-screen roxo global
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#F8F5F0' }}>

      {/* ── Header roxo ── */}
      <div className="relative overflow-hidden flex-shrink-0 px-6 pt-12 pb-8 text-center"
      style={{ backgroundColor: '#806e84', borderRadius: '0 0 28px 28px' }}>
        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }} />
        {/* Voltar */}
        <button onClick={() => navigate('/onboarding')}
        className="absolute left-5 top-12 flex items-center gap-1 text-sm font-semibold z-10"
        style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'Nunito, sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Voltar
        </button>
        {/* Logo */}
        <div className="relative z-10 flex flex-col items-center">
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.12)',
            border: '1.5px solid rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 10
          }}>
            <img src={simboloNinho} alt="Ninho"
            style={{ width: 22, height: 22, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          </div>
          <h1 className="text-white text-[22px] font-bold"
          style={{ fontFamily: 'Quicksand, sans-serif' }}>
            {tab === 'signup' ? 'Crie sua conta' : 'Bem-vindo de volta'}
          </h1>
          <p className="mt-1 text-[13px] text-primary-foreground"
          style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Nunito, sans-serif', lineHeight: 1.5, maxWidth: 260 }}>
            {tab === 'signup' ?
            'Comece a organizar o cuidado da sua criança em poucos minutos.' :
            'Que bom te ver de novo.'}
          </p>
        </div>
      </div>

      {/* ── Corpo claro ── */}
      <div className="flex-1 overflow-y-auto px-6 pt-5 pb-10">

        {/* Tabs */}
        <div className="flex p-[3px] mb-5"
        style={{ backgroundColor: '#e3d9e2', borderRadius: 12 }}>
          {(['signup', 'login'] as Tab[]).map((t) =>
          <button key={t}
          onClick={() => {setTab(t);setError('');setTouched({});}}
          className="flex-1 py-[10px] text-sm font-bold transition-all"
          style={{
            fontFamily: 'Nunito, sans-serif',
            borderRadius: 10,
            backgroundColor: tab === t ? '#fff' : 'transparent',
            color: tab === t ? '#806e84' : '#7A7A7A',
            boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            border: 'none', cursor: 'pointer'
          }}>
              {t === 'signup' ? 'Criar conta' : 'Entrar'}
            </button>
          )}
        </div>

        {/* Social */}
        <div className="space-y-2.5 mb-5">
          <button onClick={handleGoogle}
          className="w-full flex items-center gap-3 px-4 font-semibold text-sm transition-colors"
          style={{
            height: 50, borderRadius: 14,
            backgroundColor: '#fff',
            border: '1.5px solid #E5E0D8',
            color: '#2C2C2C',
            fontFamily: 'Nunito, sans-serif',
            cursor: 'pointer'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuar com Google
          </button>
          <button onClick={handleApple}
          className="w-full flex items-center gap-3 px-4 font-semibold text-sm transition-colors"
          style={{
            height: 50, borderRadius: 14,
            backgroundColor: '#fff',
            border: '1.5px solid #E5E0D8',
            color: '#2C2C2C',
            fontFamily: 'Nunito, sans-serif',
            cursor: 'pointer'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#2C2C2C">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Continuar com Apple
          </button>
        </div>

        {/* Divisor */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ backgroundColor: '#E5E0D8' }} />
          <span className="text-xs" style={{ color: '#7A7A7A', fontFamily: 'Nunito, sans-serif' }}>
            ou use e-mail
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#E5E0D8' }} />
        </div>

        {/* Error box */}
        {error &&
        <div className="mb-4 px-3 py-2.5 rounded-xl text-xs leading-relaxed"
        style={{ backgroundColor: '#FCEAEA', border: '1px solid #f5caca', color: '#C04A4A', fontFamily: 'Nunito, sans-serif' }}>
            {error}
          </div>
        }

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.form key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate>

            {/* Email */}
            <div>
              <label className="block mb-[5px]" style={{
                fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700,
                color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                autoComplete="email"
                className="w-full px-4 py-3 text-sm outline-none transition-all"
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  backgroundColor: '#E8E8E2',
                  border: `1.5px solid ${emailError ? '#C04A4A' : 'transparent'}`,
                  borderRadius: 12, color: '#2C2C2C'
                }}
                onBlur={(e) => {touch('email');if (!emailError) e.target.style.borderColor = 'transparent';}} />
              
              {emailError &&
              <p className="mt-1 text-[11px]"
              style={{ color: '#C04A4A', fontFamily: 'Nunito, sans-serif' }}>
                  {emailError}
                </p>
              }
            </div>

            {/* Senha */}
            <div>
              <label className="block mb-[5px]" style={{
                fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700,
                color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tab === 'signup' ? 'Crie sua senha' : 'Sua senha'}
                  autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full px-4 py-3 pr-11 text-sm outline-none transition-all"
                  style={{
                    fontFamily: 'Nunito, sans-serif',
                    backgroundColor: '#E8E8E2',
                    border: '1.5px solid transparent',
                    borderRadius: 12, color: '#2C2C2C'
                  }}
                  onBlur={(e) => {touch('password');e.target.style.borderColor = 'transparent';}} />
                
                <button type="button" tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#7A7A7A', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPassword ?
                  <EyeSlashIcon className="w-4 h-4" /> :
                  <EyeIcon className="w-4 h-4" />}
                </button>
              </div>

              {/* Requisitos senha */}
              {showPasswordRules &&
              <div className="mt-2 space-y-1">
                  <PasswordRule ok={passwordStrength.minLength} label="≥ 6 caracteres" />
                  <PasswordRule ok={passwordStrength.hasUppercase} label="1 maiúscula" />
                  <PasswordRule ok={passwordStrength.hasNumber} label="1 número" />
                  <PasswordRule ok={passwordStrength.hasLetter} label="1 letra" />
                </div>
              }
            </div>

            {/* Esqueci senha */}
            {tab === 'login' &&
            <div className="text-right -mt-1">
                <button type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-xs font-bold"
              style={{ color: '#806e84', fontFamily: 'Nunito, sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Esqueci minha senha
                </button>
              </div>
            }

            {/* CTA */}
            <button type="submit" disabled={loading}
            className="w-full rounded-2xl font-bold text-[15px] text-white transition-opacity disabled:opacity-50"
            style={{
              height: 52, backgroundColor: '#806e84',
              fontFamily: 'Nunito, sans-serif',
              border: 'none', cursor: 'pointer'
            }}>
              {loading ? 'Aguarde...' : tab === 'signup' ? 'Criar minha conta →' : 'Entrar →'}
            </button>

            {/* Termos */}
            {tab === 'signup' &&
            <p className="text-center text-[11px] leading-relaxed"
            style={{ color: '#7A7A7A', fontFamily: 'Nunito, sans-serif' }}>
                Ao continuar, você concorda com nossos{' '}
                <a href="#" style={{ color: '#806e84' }}>Termos de Uso</a> e{' '}
                <a href="#" style={{ color: '#806e84' }}>Política de Privacidade</a>
              </p>
            }
          </motion.form>
        </AnimatePresence>
      </div>
    </div>);

}
