import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

type Tab = 'login' | 'signup';

export function LoginPage() {
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        setSuccess('Conta criada! Verifique seu email para confirmar.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Algo deu errado';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) { setError('Digite seu email primeiro.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { setError(error.message); } else { setSuccess('Email de redefinição enviado!'); }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ backgroundColor: 'hsl(var(--ninho-mauve))' }}
    >
      {/* Logo */}
      <motion.div
        className="flex flex-col items-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <svg width="52" height="52" viewBox="0 0 100 100" fill="none">
          <path d="M 18 72 Q 8 32 50 18 Q 92 8 88 50 Q 84 82 50 88 Q 22 92 18 72" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M 30 66 Q 24 44 50 36 Q 74 28 72 52 Q 70 70 50 74 Q 32 77 30 66" stroke="rgba(255,255,255,0.7)" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="50" cy="55" r="7" fill="white" />
          <circle cx="37" cy="53" r="3.5" fill="rgba(255,255,255,0.65)" />
          <circle cx="63" cy="53" r="3.5" fill="rgba(255,255,255,0.65)" />
        </svg>
        <h1 className="text-3xl font-bold text-white mt-2" style={{ fontFamily: 'Quicksand, sans-serif' }}>
          ninho
        </h1>
      </motion.div>

      {/* Auth Card */}
      <motion.div
        className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['login', 'signup'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setSuccess(''); }}
              className="flex-1 py-4 text-sm font-semibold transition-colors relative"
              style={{
                fontFamily: 'Nunito, sans-serif',
                color: tab === t ? 'hsl(var(--ninho-mauve))' : 'hsl(var(--muted-foreground))',
              }}
            >
              {t === 'login' ? 'Entrar' : 'Criar conta'}
              {tab === t && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: 'hsl(var(--ninho-mauve))' }}
                />
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}>
                Nome completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Maria Silva"
                required
                className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:ring-2 transition-all"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="voce@email.com"
              required
              className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:ring-2 transition-all"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:ring-2 transition-all"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium" style={{ fontFamily: 'Nunito, sans-serif' }}>{error}</p>
          )}
          {success && (
            <p className="text-xs font-medium" style={{ color: 'hsl(var(--ninho-sage))', fontFamily: 'Nunito, sans-serif' }}>{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-opacity disabled:opacity-60"
            style={{ backgroundColor: 'hsl(var(--ninho-sage))', fontFamily: 'Nunito, sans-serif' }}
          >
            {loading ? 'Aguarde...' : tab === 'login' ? 'Entrar' : 'Criar minha conta'}
          </button>

          {tab === 'login' && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="w-full text-xs text-center pt-1 transition-opacity hover:opacity-70"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
            >
              Esqueci minha senha
            </button>
          )}
        </form>
      </motion.div>
    </div>
  );
}
