import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

type Tab = 'login' | 'signup';

export default function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('signup');
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
      if (tab === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        // After signup, session is auto-set — navigate to family creation
        navigate('/onboarding/family');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/onboarding/family');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Algo deu errado');
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
              onClick={() => { setTab(t); setError(''); setSuccess(''); }}
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Maria Silva"
                required
                className="h-12 rounded-2xl border-border"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label
              className="text-xs font-semibold"
              style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
            >
              Email
            </Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="voce@email.com"
              required
              className="h-12 rounded-2xl border-border"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            />
          </div>

          <div className="space-y-1.5">
            <Label
              className="text-xs font-semibold"
              style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
            >
              Senha
            </Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="h-12 rounded-2xl border-border"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            />
          </div>

          {error && (
            <p className="text-xs text-destructive font-medium" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs font-medium" style={{ color: 'hsl(var(--ninho-sage))', fontFamily: 'Nunito, sans-serif' }}>
              {success}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-13 rounded-2xl text-sm font-bold mt-2"
            style={{
              height: '52px',
              backgroundColor: 'hsl(var(--ninho-sage))',
              color: 'white',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            {loading ? 'Aguarde...' : tab === 'signup' ? 'Criar minha conta' : 'Entrar'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
