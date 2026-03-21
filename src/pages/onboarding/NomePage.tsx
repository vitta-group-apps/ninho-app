/**
 * NomePage — Onboarding Step 1 of 3
 * Collects caregiver name/nickname and saves to profiles.full_name
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import simboloNinho from '@/assets/simbolo-ninho.png';

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function NomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const initials = useMemo(() => getInitials(name) || '?', [name]);
  const isValid = name.trim().length >= 2;

  async function handleContinue() {
    if (!isValid || !user) return;
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({ full_name: name.trim() })
        .eq('user_id', user.id);
      if (err) throw err;
      navigate('/onboarding/family');
    } catch {
      setError('Não conseguimos salvar seu nome. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#806e84' }}>
      {/* Header with rounded bottom */}
      <div
        className="px-5 pt-12 pb-7"
        style={{ borderRadius: '0 0 28px 28px', backgroundColor: '#806e84' }}
      >
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <img src={simboloNinho} alt="Ninho" style={{ width: 18, height: 18, opacity: 0.6 }} />
          <span
            className="text-[13px] font-semibold"
            style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Nunito, sans-serif' }}
          >
            Passo 1 de 3
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-6">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className="h-1 rounded-full flex-1"
              style={{ backgroundColor: s === 1 ? 'white' : 'rgba(255,255,255,0.25)' }}
            />
          ))}
        </div>

        <h1
          className="text-2xl font-bold"
          style={{ color: 'white', fontFamily: 'Quicksand, sans-serif' }}
        >
          Como você se chama? 👋
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'Nunito, sans-serif' }}
        >
          Pode ser seu nome ou apelido — é assim que vamos te chamar por aqui.
        </p>
      </div>

      {/* Body */}
      <div
        className="flex-1 flex flex-col px-5 pt-8"
        style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}
      >
        {/* Avatar preview */}
        <motion.div
          className="flex justify-center mb-8"
          animate={{ scale: isValid ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="flex items-center justify-center rounded-full font-bold text-2xl"
            style={{
              width: 80,
              height: 80,
              backgroundColor: '#806e84',
              color: 'white',
              fontFamily: 'Quicksand, sans-serif',
              boxShadow: '0 4px 20px rgba(128,110,132,0.35)',
            }}
          >
            {initials}
          </div>
        </motion.div>

        <div className="space-y-1.5 mb-3">
          <label
            className="text-xs font-semibold"
            style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
          >
            Seu nome ou apelido
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Larissa, Lari, Mãe da Bê…"
            autoFocus
            className="w-full h-12 rounded-2xl px-4 text-sm outline-none border transition-all"
            style={{
              fontFamily: 'Nunito, sans-serif',
              backgroundColor: 'hsl(var(--muted))',
              borderColor: isValid ? '#806e84' : 'transparent',
              color: 'hsl(var(--ninho-brown))',
            }}
            onKeyDown={e => { if (e.key === 'Enter') handleContinue(); }}
          />
        </div>

        {/* Info tip */}
        <div
          className="flex items-start gap-2 px-3 py-2.5 rounded-xl mb-6"
          style={{ backgroundColor: 'hsl(var(--ninho-mauve) / 0.08)' }}
        >
          <span className="text-sm">💡</span>
          <p
            className="text-xs leading-relaxed"
            style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
          >
            Aparece nos registros compartilhados com outros cuidadores.
          </p>
        </div>

        {error && (
          <p
            className="text-xs text-destructive font-medium mb-4"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            {error}
          </p>
        )}

        <div className="flex-1" />

        <button
          onClick={handleContinue}
          disabled={!isValid || loading}
          className="w-full rounded-2xl font-bold text-[15px] mb-6 transition-all"
          style={{
            height: 52,
            backgroundColor: isValid ? '#806e84' : 'hsl(var(--muted))',
            color: isValid ? 'white' : 'hsl(var(--muted-foreground))',
            fontFamily: 'Nunito, sans-serif',
          }}
        >
          {loading ? 'Salvando...' : 'Continuar →'}
        </button>
      </div>
    </div>
  );
}
