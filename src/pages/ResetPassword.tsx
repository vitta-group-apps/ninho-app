import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('As senhas não coincidem.'); return; }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); } else { setSuccess(true); }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ backgroundColor: 'hsl(var(--ninho-mauve))' }}
    >
      <motion.div
        className="w-full max-w-sm rounded-3xl bg-white shadow-2xl p-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-bold mb-1" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
          Nova senha
        </h2>
        <p className="text-sm mb-5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
          Digite e confirme sua nova senha.
        </p>

        {success ? (
          <p className="text-sm font-semibold text-center py-4" style={{ color: 'hsl(var(--ninho-sage))', fontFamily: 'Nunito, sans-serif' }}>
            ✓ Senha alterada com sucesso! Você pode fazer login agora.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Nova senha"
              required
              minLength={6}
              className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            />
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Confirmar nova senha"
              required
              className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-60"
              style={{ backgroundColor: 'hsl(var(--ninho-sage))', fontFamily: 'Nunito, sans-serif' }}
            >
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
