/**
 * FamilyPage — Onboarding Step 2 of 3
 * Creates the family record + official family member link
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import simboloNinho from '@/assets/simbolo-ninho.png';

const WHO_OPTIONS = ['Só eu', 'Eu e meu parceiro(a)', 'Avós também', 'Temos babá'];

export default function FamilyPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [familyName, setFamilyName] = useState('');
  const [who, setWho] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = familyName.trim().length >= 2;

  async function handleSubmit() {
    if (!user) {
      navigate('/onboarding/auth');
      return;
    }

    if (!isValid) return;

    setError('');
    setLoading(true);

    try {
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          name: familyName.trim(),
          owner_id: user.id,
        })
        .select('id')
        .single();

      if (familyError) throw familyError;

      const { error: familyMemberError } = await supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: user.id,
          role: 'owner',
          status: 'active',
          invited_by: null,
        });

      if (familyMemberError) throw familyMemberError;

      sessionStorage.setItem('onboarding_family_id', family.id);
      navigate('/onboarding/child');
    } catch {
      setError('Não conseguimos criar sua família agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) return null;

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
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Step */}
        <div className="relative z-10 flex items-center gap-2 mb-4">
          <img
            src={simboloNinho}
            alt="Ninho"
            style={{
              width: 16,
              height: 16,
              opacity: 0.6,
              filter: 'brightness(0) invert(1)',
            }}
          />
          <span
            className="text-[12px] font-semibold"
            style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Nunito, sans-serif' }}
          >
            Passo 2 de 3
          </span>
        </div>

        {/* Progress */}
        <div className="relative z-10 flex gap-1.5 mb-5">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className="h-1 rounded-full flex-1"
              style={{ backgroundColor: s <= 2 ? 'white' : 'rgba(255,255,255,0.25)' }}
            />
          ))}
        </div>

        <h1
          className="relative z-10 text-[22px] font-bold"
          style={{ color: 'white', fontFamily: 'Quicksand, sans-serif' }}
        >
          Crie o espaço da sua família 🏡
        </h1>
        <p
          className="relative z-10 text-[13px] mt-1"
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontFamily: 'Nunito, sans-serif',
            lineHeight: 1.5,
          }}
        >
          Dê um nome ao grupo — pode ser o sobrenome ou algo que faça sentido pra vocês.
        </p>
      </div>

      {/* Corpo claro */}
      <div className="flex-1 flex flex-col px-5 pt-7 pb-8">
        {/* Input família */}
        <div className="mb-6">
          <label
            className="block mb-[5px]"
            style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: 10,
              fontWeight: 700,
              color: '#7A7A7A',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Nome da família
          </label>
          <input
            type="text"
            value={familyName}
            onChange={e => setFamilyName(e.target.value)}
            placeholder="Ex: Família Silva, Casa Salmon…"
            className="w-full px-4 py-3 text-sm outline-none transition-all"
            style={{
              fontFamily: 'Nunito, sans-serif',
              backgroundColor: '#E8E8E2',
              border: `1.5px solid ${isValid ? '#806e84' : 'transparent'}`,
              borderRadius: 12,
              color: '#2C2C2C',
              fontSize: 16,
            }}
            onFocus={e => {
              if (!isValid) e.target.style.borderColor = '#C7B3C5';
            }}
            onBlur={e => {
              if (!isValid) e.target.style.borderColor = 'transparent';
            }}
          />
        </div>

        {/* Quem cuida chips */}
        <div className="mb-6">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.5px] mb-3"
            style={{ color: '#7A7A7A', fontFamily: 'Nunito, sans-serif' }}
          >
            Quem cuida?
          </p>
          <div className="flex flex-wrap gap-2">
            {WHO_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setWho(w => (w === opt ? '' : opt))}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  backgroundColor: who === opt ? '#806e84' : '#fff',
                  color: who === opt ? 'white' : '#4b4b47',
                  border: who === opt ? 'none' : '1.5px solid #E5E0D8',
                  cursor: 'pointer',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          <p
            className="text-[11px] mt-2"
            style={{ color: '#7A7A7A', fontFamily: 'Nunito, sans-serif' }}
          >
            Não é obrigatório — apenas contexto
          </p>
        </div>

        {/* Info box */}
        <div
          className="flex items-start gap-2 px-3 py-3 rounded-xl mb-6"
          style={{ backgroundColor: '#f4f0f3', border: '1px solid #e3d9e2' }}
        >
          <span className="text-sm">👤</span>
          <p
            className="text-xs leading-relaxed"
            style={{ color: '#7A7A7A', fontFamily: 'Nunito, sans-serif' }}
          >
            Você é o <strong style={{ color: '#806e84' }}>Responsável</strong> — pode convidar outros cuidadores depois, a qualquer momento.
          </p>
        </div>

        {error && (
          <div
            className="px-3 py-2.5 rounded-xl mb-4"
            style={{ backgroundColor: '#FCEAEA', border: '1px solid #f5caca' }}
          >
            <p
              className="text-xs font-medium"
              style={{ color: '#C04A4A', fontFamily: 'Nunito, sans-serif' }}
            >
              {error}
            </p>
          </div>
        )}

        <div className="flex-1" />

        <button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="w-full rounded-2xl font-bold text-[15px] text-white mb-3 transition-all"
          style={{
            height: 52,
            backgroundColor: '#806e84',
            fontFamily: 'Nunito, sans-serif',
            opacity: !isValid || loading ? 0.45 : 1,
            border: 'none',
            cursor: isValid ? 'pointer' : 'default',
          }}
        >
          {loading ? 'Criando...' : 'Continuar →'}
        </button>

        <button
          onClick={() => navigate('/onboarding/child')}
          className="w-full text-center text-[13px] font-medium mb-2"
          style={{
            color: '#7A7A7A',
            fontFamily: 'Nunito, sans-serif',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Pular por agora
        </button>
      </div>
    </div>
  );
}
