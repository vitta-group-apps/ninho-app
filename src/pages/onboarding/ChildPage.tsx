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

      // Mark onboarding complete
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#806e84' }}>
      {/* Header */}
      <div
        className="px-5 pt-12 pb-7"
        style={{ borderRadius: '0 0 28px 28px', backgroundColor: '#806e84' }}
      >
        <div className="flex items-center gap-2 mb-6">
          <img src={simboloNinho} alt="Ninho" style={{ width: 18, height: 18, opacity: 0.6 }} />
          <span
            className="text-[13px] font-semibold"
            style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Nunito, sans-serif' }}
          >
            Passo 3 de 3
          </span>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className="h-1 rounded-full flex-1"
              style={{ backgroundColor: 'white' }}
            />
          ))}
        </div>

        <h1
          className="text-2xl font-bold"
          style={{ color: 'white', fontFamily: 'Quicksand, sans-serif' }}
        >
          Quem você está cuidando? 🍼
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'Nunito, sans-serif' }}
        >
          Adicione o bebê ou criança — pode ser o nome, apelido ou como você chama.
        </p>
      </div>

      {/* Body */}
      <div
        className="flex-1 flex flex-col px-5 pt-8"
        style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}
      >
        <div className="space-y-4 mb-6">
          <div className="space-y-1.5">
            <label
              className="text-xs font-semibold"
              style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
            >
              Nome ou apelido
            </label>
            <input
              type="text"
              value={childName}
              onChange={e => setChildName(e.target.value)}
              placeholder="Rafael"
              className="w-full h-12 rounded-2xl px-4 text-sm outline-none border transition-all"
              style={{
                fontFamily: 'Nunito, sans-serif',
                backgroundColor: 'hsl(var(--muted))',
                borderColor: childName.trim() ? '#806e84' : 'transparent',
                color: 'hsl(var(--ninho-brown))',
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="text-xs font-semibold"
              style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
            >
              Data de nascimento
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full h-12 rounded-2xl px-4 text-sm outline-none border transition-all"
              style={{
                fontFamily: 'Nunito, sans-serif',
                backgroundColor: 'hsl(var(--muted))',
                borderColor: birthDate ? '#806e84' : 'transparent',
                color: 'hsl(var(--ninho-brown))',
              }}
            />
          </div>

          {/* Sex chips */}
          <div className="space-y-2">
            <label
              className="text-xs font-semibold"
              style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
            >
              Sexo (opcional)
            </label>
            <div className="flex flex-wrap gap-2">
              {SEX_OPTIONS.map(opt => (
                <button
                  key={opt.value + opt.label}
                  type="button"
                  onClick={() => setSex(s => s === opt.value ? null : opt.value)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={{
                    fontFamily: 'Nunito, sans-serif',
                    backgroundColor: sex === opt.value ? '#806e84' : 'hsl(var(--muted))',
                    color: sex === opt.value ? 'white' : 'hsl(var(--muted-foreground))',
                    border: sex === opt.value ? 'none' : '1px solid hsl(var(--border))',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
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
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="w-full rounded-2xl font-bold text-[15px] mb-3 transition-all"
          style={{
            height: 52,
            backgroundColor: isValid ? '#806e84' : 'hsl(var(--muted))',
            color: isValid ? 'white' : 'hsl(var(--muted-foreground))',
            fontFamily: 'Nunito, sans-serif',
          }}
        >
          {loading ? 'Salvando...' : 'Tudo pronto! Entrar →'}
        </button>

        <button
          onClick={() => navigate('/onboarding/complete')}
          className="w-full text-center text-sm font-medium mb-6"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
        >
          Pular e adicionar depois
        </button>
      </div>
    </div>
  );
}
