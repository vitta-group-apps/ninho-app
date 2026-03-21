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
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F5F0' }}>

      {/* Header roxo */}
      <div
        className="relative overflow-hidden flex-shrink-0 px-5 pb-7"
        style={{
          backgroundColor: '#806e84',
          borderRadius: '0 0 28px 28px',
          paddingTop: 'calc(env(safe-area-inset-top) + 20px)',
        }}
      >
        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }} />

        {/* Step + progress */}
        <div className="relative z-10 flex items-center gap-2 mb-4">
          <img src={simboloNinho} alt="Ninho"
            style={{ width: 16, height: 16, opacity: 0.6, filter: 'brightness(0) invert(1)' }} />
          <span className="text-[12px] font-semibold"
            style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Nunito, sans-serif' }}>
            Passo 1 de 3
          </span>
        </div>

        <div className="relative z-10 flex gap-1.5 mb-5">
          {[1, 2, 3].map(s => (
            <div key={s} className="h-1 rounded-full flex-1"
              style={{ backgroundColor: s === 1 ? 'white' : 'rgba(255,255,255,0.25)' }} />
          ))}
        </div>

        <h1 className="relative z-10 text-[22px] font-bold"
          style={{ color: 'white', fontFamily: 'Quicksand, sans-serif' }}>
          Como você se chama? 👋
        </h1>
        <p className="relative z-10 text-[13px] mt-1"
          style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Nunito, sans-serif', lineHeight: 1.5 }}>
          Pode ser seu nome ou apelido — é assim que vamos te chamar por aqui.
        </p>
      </div>

      {/* Corpo claro */}
      <div className="flex-1 flex flex-col px-5 pt-8 pb-8">

        {/* Avatar preview */}
        <motion.div
          className="flex justify-center mb-8"
          animate={{ scale: isValid ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="flex items-center justify-center rounded-full font-bold text-2xl"
            style={{
              width: 80, height: 80,
              backgroundColor: '#806e84',
              color: 'white',
              fontFamily: 'Quicksand, sans-serif',
              boxShadow: '0 4px 20px rgba(128,110,132,0.35)',
            }}
          >
            {initials}
          </div>
        </motion.div>

        {/* Input */}
        <div className="mb-3">
          <label className="block mb-[5px]"
            style={{
              fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700,
              color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
            Seu nome ou apelido
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Larissa, Lari, Mãe da Bê…"
            autoFocus
            className="w-full px-4 py-3 text-sm outline-none transition-all"
            style={{
              fontFamily: 'Nunito, sans-serif',
              backgroundColor: '#E8E8E2',
              border: `1.5px solid ${isValid ? '#806e84' : 'transparent'}`,
              borderRadius: 12,
              color: '#2C2C2C',
              fontSize: 16,
            }}
            onFocus={e => { if (!isValid) e.target.style.borderColor = '#C7B3C5'; }}
            onBlur={e => { if (!isValid) e.target.style.borderColor = 'transparent'; }}
            onKeyDown={e => { if (e.key === 'Enter') handleContinue(); }}
          />
        </div>

        {/* Info tip */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl mb-6"
          style={{ backgroundColor: '#f4f0f3', border: '1px solid #e3d9e2' }}>
          <span className="text-sm">💡</span>
          <p className="text-xs leading-relaxed"
            style={{ color: '#7A7A7A', fontFamily: 'Nunito, sans-serif' }}>
            Aparece nos registros compartilhados com outros cuidadores.
          </p>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-xl text-xs"
            style={{ backgroundColor: '#FCEAEA', border: '1px solid #f5caca', color: '#C04A4A', fontFamily: 'Nunito, sans-serif' }}>
            {error}
          </div>
        )}

        <div className="flex-1" />

        <button
          onClick={handleContinue}
          disabled={!isValid || loading}
          className="w-full rounded-2xl font-bold text-[15px] text-white transition-all"
          style={{
            height: 52,
            backgroundColor: '#806e84',
            fontFamily: 'Nunito, sans-serif',
            opacity: !isValid || loading ? 0.45 : 1,
            border: 'none',
            cursor: isValid ? 'pointer' : 'default',
          }}
        >
          {loading ? 'Salvando...' : 'Continuar →'}
        </button>
      </div>
    </div>
  );
}
