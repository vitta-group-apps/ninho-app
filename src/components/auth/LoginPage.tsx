import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import simboloNinho from '@/assets/simbolo-ninho.png';

// Erros Supabase → PT-BR amigável
function mapSupabaseError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos. Verifique e tente novamente.';
  if (msg.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar. Reenviamos o código.';
  if (msg.includes('User already registered')) return 'Esse e-mail já está cadastrado. Tente entrar ou recuperar a senha.';
  if (msg.includes('Password should be at least 6')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (msg.includes('Unable to validate email')) return 'Formato de e-mail inválido.';
  return 'Algo deu errado. Tente novamente.';
}

interface LoginPageProps {
  onSignupSuccess: (email: string) => void; // vai para OTP
  onLoginSuccess: () => void;               // vai para Home ou Onboarding
  onForgotPassword: () => void;
}

type Tab = 'criar' | 'entrar';

export function LoginPage({ onSignupSuccess, onLoginSuccess, onForgotPassword }: LoginPageProps) {
  const [tab, setTab] = useState<Tab>('criar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validação inline de senha
  const pwLen = password.length >= 6;
  const pwUpper = /[A-Z]/.test(password);
  const pwNum = /\d/.test(password);
  const pwLetter = /[a-zA-Z]/.test(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'criar') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        onSignupSuccess(email); // → vai para OTP
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Verificar se onboarding está completo
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, onboarding_complete')
          .eq('id', data.user.id)
          .single();
        onLoginSuccess(); // App.tsx decide para onde ir baseado no profile
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Algo deu errado';
      setError(mapSupabaseError(msg));
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialLogin(provider: 'google' | 'apple') {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="flex flex-col flex-1" style={{ backgroundColor: '#F8F5F0' }}>
      
      {/* Header roxo */}
      <div
        className="relative overflow-hidden flex-shrink-0 flex flex-col items-center px-7 pt-10 pb-9"
        style={{
          backgroundColor: '#806e84',
          borderRadius: '0 0 28px 28px',
        }}
      >
        {/* Grain texture */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
        />
        
        {/* Logo símbolo */}
        <div className="relative z-10 mb-3"
          style={{
            width: 40, height: 40, borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.12)',
            border: '1.5px solid rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <img src={simboloNinho} alt="Ninho" style={{ width: 22, height: 22, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        </div>

        <h1
          className="relative z-10 text-white text-center"
          style={{ fontFamily: 'Quicksand, sans-serif', fontWeight: 700, fontSize: 22 }}
          id="auth-title"
        >
          {tab === 'criar' ? 'Crie sua conta' : 'Bem-vindo de volta'}
        </h1>
        <p
          className="relative z-10 text-center mt-1"
          style={{ fontFamily: 'Nunito, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, maxWidth: 260 }}
        >
          {tab === 'criar'
            ? 'Comece a organizar o cuidado da sua criança em poucos minutos.'
            : 'Que bom te ver de novo.'}
        </p>
      </div>

      {/* Corpo */}
      <div className="flex-1 overflow-y-auto px-6 pt-5 pb-8">

        {/* Tabs */}
        <div
          className="flex p-[3px] mb-[18px]"
          style={{ backgroundColor: '#e3d9e2', borderRadius: 12 }}
        >
          {(['criar', 'entrar'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className="flex-1 py-[10px] text-sm font-bold transition-all"
              style={{
                fontFamily: 'Nunito, sans-serif',
                borderRadius: 10,
                backgroundColor: tab === t ? '#fff' : 'transparent',
                color: tab === t ? '#806e84' : '#7A7A7A',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {t === 'criar' ? 'Criar conta' : 'Entrar'}
            </button>
          ))}
        </div>

        {/* Social login */}
        <div className="space-y-2 mb-4">
          <button
            onClick={() => handleSocialLogin('google')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors hover:bg-stone-50"
            style={{ fontFamily: 'Nunito, sans-serif', borderColor: '#E5E0D8', backgroundColor: '#fff', color: '#2C2C2C' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continuar com Google
          </button>
          <button
            onClick={() => handleSocialLogin('apple')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors hover:bg-stone-50"
            style={{ fontFamily: 'Nunito, sans-serif', borderColor: '#E5E0D8', backgroundColor: '#fff', color: '#2C2C2C' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-1.92 4.27-3.74 4.25z" fill="currentColor"/></svg>
            Continuar com Apple
          </button>
        </div>

        {/* Divisor */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px" style={{ backgroundColor: '#E5E0D8' }} />
          <span className="text-xs" style={{ color: '#7A7A7A', fontFamily: 'Nunito, sans-serif' }}>ou use e-mail</span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#E5E0D8' }} />
        </div>

        {/* Error box */}
        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-xl text-xs leading-relaxed"
            style={{ backgroundColor: '#FCEAEA', border: '1px solid #f5caca', color: '#C04A4A', fontFamily: 'Nunito, sans-serif' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email */}
          <div>
            <label className="block mb-[5px]"
              style={{ fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700, color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="voce@email.com"
              required
              className="w-full px-4 py-3 text-sm outline-none transition-all"
              style={{
                fontFamily: 'Nunito, sans-serif',
                backgroundColor: '#E8E8E2',
                border: '1.5px solid transparent',
                borderRadius: 12,
                color: '#2C2C2C',
              }}
              onFocus={e => e.target.style.borderColor = '#C7B3C5'}
              onBlur={e => e.target.style.borderColor = 'transparent'}
            />
          </div>

          {/* Senha */}
          <div>
            <label className="block mb-[5px]"
              style={{ fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700, color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={tab === 'criar' ? 'Crie sua senha' : 'Sua senha'}
              required
              className="w-full px-4 py-3 text-sm outline-none transition-all"
              style={{
                fontFamily: 'Nunito, sans-serif',
                backgroundColor: '#E8E8E2',
                border: '1.5px solid transparent',
                borderRadius: 12,
                color: '#2C2C2C',
              }}
              onFocus={e => e.target.style.borderColor = '#C7B3C5'}
              onBlur={e => e.target.style.borderColor = 'transparent'}
            />

            {/* Requisitos de senha — só no criar */}
            {tab === 'criar' && password.length > 0 && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {[
                  { ok: pwLen, label: '≥ 6 caracteres' },
                  { ok: pwUpper, label: '1 maiúscula' },
                  { ok: pwNum, label: '1 número' },
                  { ok: pwLetter, label: '1 letra' },
                ].map(({ ok, label }) => (
                  <span key={label} className="text-[11px] flex items-center gap-1"
                    style={{ fontFamily: 'Nunito, sans-serif', color: ok ? '#789687' : '#C04A4A' }}>
                    {ok ? '●' : '○'} {label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Esqueci senha */}
          {tab === 'entrar' && (
            <div className="text-right -mt-1">
              <button type="button" onClick={onForgotPassword}
                className="text-xs font-bold"
                style={{ fontFamily: 'Nunito, sans-serif', color: '#806e84', background: 'none', border: 'none', cursor: 'pointer' }}>
                Esqueci minha senha
              </button>
            </div>
          )}

          {/* CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-[15px] rounded-2xl text-sm font-bold text-white transition-opacity disabled:opacity-60 mt-2"
            style={{ fontFamily: 'Nunito, sans-serif', backgroundColor: '#806e84', minHeight: 50 }}
          >
            {loading ? 'Aguarde...' : tab === 'criar' ? 'Criar minha conta →' : 'Entrar →'}
          </button>

          {/* Termos */}
          {tab === 'criar' && (
            <p className="text-center text-[11px] leading-relaxed mt-2"
              style={{ fontFamily: 'Nunito, sans-serif', color: '#7A7A7A' }}>
              Ao continuar, você concorda com nossos{' '}
              <a href="#" style={{ color: '#806e84' }}>Termos de Uso</a> e{' '}
              <a href="#" style={{ color: '#806e84' }}>Política de Privacidade</a>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
