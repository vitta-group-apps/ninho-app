/**
 * FamilyPage — Onboarding Step 2 of 3
 * Creates the family record + membership
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
        .insert({ name: familyName.trim(), owner_id: user.id })
        .select('id')
        .single();
      if (familyError) throw familyError;

      const { error: memberError } = await supabase
        .from('memberships')
        .insert({ family_id: family.id, user_id: user.id, role: 'admin' });
      if (memberError) console.warn('[FamilyPage] membership insert (non-fatal):', memberError);

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
            Passo 2 de 3
          </span>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className="h-1 rounded-full flex-1"
              style={{ backgroundColor: s <= 2 ? 'white' : 'rgba(255,255,255,0.25)' }}
            />
          ))}
        </div>

        <h1
          className="text-2xl font-bold"
          style={{ color: 'white', fontFamily: 'Quicksand, sans-serif' }}
        >
          Crie o espaço da sua família 🏡
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'Nunito, sans-serif' }}
        >
          Dê um nome ao grupo — pode ser o sobrenome ou algo que faça sentido pra vocês.
        </p>
      </div>

      {/* Body */}
      <div
        className="flex-1 flex flex-col px-5 pt-8"
        style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}
      >
        <div className="space-y-1.5 mb-6">
          <label
            className="text-xs font-semibold"
            style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
          >
            Nome da família
          </label>
          <input
            type="text"
            value={familyName}
            onChange={e => setFamilyName(e.target.value)}
            placeholder="Ex: Família Silva, Casa Salmon…"
            className="w-full h-12 rounded-2xl px-4 text-sm outline-none border transition-all"
            style={{
              fontFamily: 'Nunito, sans-serif',
              backgroundColor: 'hsl(var(--muted))',
              borderColor: isValid ? '#806e84' : 'transparent',
              color: 'hsl(var(--ninho-brown))',
            }}
          />
        </div>

        {/* Who cares chips */}
        <div className="mb-6">
          <p
            className="text-xs font-semibold mb-3"
            style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
          >
            Quem cuida?
          </p>
          <div className="flex flex-wrap gap-2">
            {WHO_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setWho(w => (w === opt ? '' : opt))}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  backgroundColor: who === opt ? '#806e84' : 'hsl(var(--muted))',
                  color: who === opt ? 'white' : 'hsl(var(--muted-foreground))',
                  border: who === opt ? 'none' : '1px solid hsl(var(--border))',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          <p
            className="text-[11px] mt-2"
            style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
          >
            Não é obrigatório — apenas contexto
          </p>
        </div>

        {/* Info box */}
        <div
          className="flex items-start gap-2 px-3 py-3 rounded-xl mb-6"
          style={{ backgroundColor: 'hsl(var(--ninho-mauve) / 0.08)' }}
        >
          <span className="text-sm">👤</span>
          <p
            className="text-xs leading-relaxed"
            style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
          >
            Você é o <strong>Administrador</strong> — pode convidar outros cuidadores depois, a qualquer momento.
          </p>
        </div>

        {error && (
          <div
            className="px-3 py-2.5 rounded-xl mb-4"
            style={{ backgroundColor: 'hsl(var(--destructive) / 0.08)', border: '1px solid hsl(var(--destructive) / 0.2)' }}
          >
            <p className="text-xs text-destructive font-medium" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {error}
            </p>
          </div>
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
          {loading ? 'Criando...' : 'Continuar →'}
        </button>

        <button
          onClick={() => navigate('/onboarding/child')}
          className="w-full text-center text-sm font-medium mb-6"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
        >
          Pular por agora
        </button>
      </div>
    </div>
  );
}
