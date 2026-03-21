/**
 * ChildPage — Onboarding Step 3 of 3
 * Creates the child record and marks onboarding_complete
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import simboloNinho from '@/assets/simbolo-ninho.png';

const SEX_OPTIONS = [
  { value: 'F', label: 'Menina 👧' },
  { value: 'M', label: 'Menino 👦' },
  { value: '', label: 'Prefiro não dizer' },
];

export default function ChildPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [childName, setChildName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = childName.trim().length >= 1 && birthDate !== '';

  async function handleSubmit() {
    if (!user) return;
    const familyId = sessionStorage.getItem('onboarding_family_id');
    if (!familyId) {
      setError('Família não encontrada. Volte e crie sua família primeiro.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: childError } = await supabase.from('children').insert({
        family_id: familyId,
        name: childName.trim(),
        birth_date: birthDate,
        sex: sex ?? null,
      });
      if (childError) throw childError;

      await supabase
        .from('profiles')
        .update({ onboarding_complete: true } as Record<string, unknown>)
        .eq('user_id', user.id);

      sessionStorage.setItem('onboarding_child_name', childName.trim());
      navigate('/onboarding/complete');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar criança');
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

        {/* Step */}
        <div className="relative z-10 flex items-center gap-2 mb-4">
          <img src={simboloNinho} alt="Ninho"
            style={{ width: 16, height: 16, opacity: 0.6, filter: 'brightness(0) invert(1)' }} />
          <span className="text-[12px] font-semibold"
            style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Nunito, sans-serif' }}>
            Passo 3 de 3
          </span>
        </div>

        {/* Progress — todos brancos no último passo */}
        <div className="relative z-10 flex gap-1.5 mb-5">
          {[1, 2, 3].map(s => (
            <div key={s} className="h-1 rounded-full flex-1"
              style={{ backgroundColor: 'white' }} />
          ))}
        </div>

        <h1 className="relative z-10 text-[22px] font-bold"
          style={{ color: 'white', fontFamily: 'Quicksand, sans-serif' }}>
          Quem você está cuidando? 🍼
        </h1>
        <p className="relative z-10 text-[13px] mt-1"
          style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Nunito, sans-serif', lineHeight: 1.5 }}>
          Adicione o bebê ou criança — pode ser o nome, apelido ou como você chama.
        </p>
      </div>

      {/* Corpo claro */}
      <div className="flex-1 flex flex-col px-5 pt-7 pb-8">

        <div className="space-y-4 mb-6">

          {/* Nome */}
          <div>
            <label className="block mb-[5px]"
              style={{
                fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700,
                color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
              Nome ou apelido
            </label>
            <input
              type="text"
              value={childName}
              onChange={e => setChildName(e.target.value)}
              placeholder="Ex: Rafael, Bê, Manu…"
              className="w-full px-4 py-3 text-sm outline-none transition-all"
              style={{
                fontFamily: 'Nunito, sans-serif',
                backgroundColor: '#E8E8E2',
                border: `1.5px solid ${childName.trim() ? '#806e84' : 'transparent'}`,
                borderRadius: 12,
                color: '#2C2C2C',
                fontSize: 16,
              }}
              onFocus={e => { if (!childName.trim()) e.target.style.borderColor = '#C7B3C5'; }}
              onBlur={e => { if (!childName.trim()) e.target.style.borderColor = 'transparent'; }}
            />
          </div>

          {/* Data nascimento */}
          <div>
            <label className="block mb-[5px]"
              style={{
                fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700,
                color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
              Data de nascimento
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 text-sm outline-none transition-all"
              style={{
                fontFamily: 'Nunito, sans-serif',
                backgroundColor: '#E8E8E2',
                border: `1.5px solid ${birthDate ? '#806e84' : 'transparent'}`,
                borderRadius: 12,
                color: '#2C2C2C',
              }}
            />
          </div>

          {/* Sexo chips */}
          <div>
            <label className="block mb-2"
              style={{
                fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700,
                color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
              Sexo (opcional)
            </label>
            <div className="flex flex-wrap gap-2">
              {SEX_OPTIONS.map(opt => (
                <button
                  key={opt.value + opt.label}
                  type="button"
                  onClick={() => setSex(s => s === opt.value ? null : opt.value)}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                  style={{
                    fontFamily: 'Nunito, sans-serif',
                    backgroundColor: sex === opt.value ? '#806e84' : '#fff',
                    color: sex === opt.value ? 'white' : '#4b4b47',
                    border: sex === opt.value ? 'none' : '1.5px solid #E5E0D8',
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="px-3 py-2.5 rounded-xl mb-4"
            style={{ backgroundColor: '#FCEAEA', border: '1px solid #f5caca' }}>
            <p className="text-xs font-medium"
              style={{ color: '#C04A4A', fontFamily: 'Nunito, sans-serif' }}>
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
          {loading ? 'Salvando...' : 'Tudo pronto! Entrar →'}
        </button>

        <button
          onClick={() => navigate('/onboarding/complete')}
          className="w-full text-center text-[13px] font-medium mb-2"
          style={{
            color: '#7A7A7A',
            fontFamily: 'Nunito, sans-serif',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Pular e adicionar depois
        </button>
      </div>
    </div>
  );
}
}
