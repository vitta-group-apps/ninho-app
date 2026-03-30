/**
 * ChildCreatePage — Página de produto para adicionar nova criança.
 * Rota: /family/add-child
 * Separada do onboarding — não marca onboarding_complete, não usa sessionStorage.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import type { ChildSexAtBirth } from '@/types/child';
import { ScreenHeader, StickyFooterCTA } from '@/components/ds';
import { toast } from '@/hooks/use-toast';

const MAUVE = '#806e84';
const MUTED_BG = '#E8E8E2';
const CARD_BORDER = '#E5E0D8';
const TXT = '#2C2C2C';
const TXT_MUTED = '#7A7A7A';
const PAGE_BG = '#F8F5F0';

const SEX_OPTIONS: { value: ChildSexAtBirth; label: string }[] = [
  { value: 'female', label: 'Menina 👧' },
  { value: 'male', label: 'Menino 👦' },
  { value: 'unknown', label: 'Prefiro não dizer' },
];

export default function ChildCreatePage() {
  const navigate = useNavigate();
  const { familyId, refetch } = useActiveChild();

  const [childName, setChildName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sexAtBirth, setSexAtBirth] = useState<ChildSexAtBirth>('unknown');
  const [loading, setLoading] = useState(false);

  const isValid = childName.trim().length >= 1 && birthDate !== '';

  async function handleSubmit() {
    if (!familyId || !isValid) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('children').insert({
        family_id: familyId,
        name: childName.trim(),
        birth_date: birthDate,
        sex_at_birth: sexAtBirth,
      });

      if (error) throw error;

      await refetch();
      toast({ title: `👶 ${childName.trim()} adicionado(a) com sucesso` });
      navigate('/family');
    } catch {
      toast({
        title: 'Não foi possível adicionar a criança',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: PAGE_BG }}>
      <ScreenHeader
        title="Adicionar criança"
        onBack={() => navigate(-1)}
      />

      <div className="ds-form-body">
        <div className="space-y-5">

          <div>
            <label className="block mb-[5px]" style={{
              fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700,
              color: TXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Nome ou apelido
            </label>
            <input
              type="text"
              value={childName}
              onChange={e => setChildName(e.target.value)}
              placeholder="Ex: Rafael, Bê, Manu…"
              autoFocus
              className="w-full px-4 py-3 text-sm outline-none transition-all"
              style={{
                fontFamily: 'Nunito, sans-serif',
                backgroundColor: MUTED_BG,
                border: `1.5px solid ${childName.trim() ? MAUVE : 'transparent'}`,
                borderRadius: 12,
                color: TXT,
                fontSize: 16,
              }}
              onFocus={e => { if (!childName.trim()) e.target.style.borderColor = '#C7B3C5'; }}
              onBlur={e => { if (!childName.trim()) e.target.style.borderColor = 'transparent'; }}
            />
          </div>

          <div>
            <label className="block mb-[5px]" style={{
              fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700,
              color: TXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.5px',
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
                backgroundColor: MUTED_BG,
                border: `1.5px solid ${birthDate ? MAUVE : 'transparent'}`,
                borderRadius: 12,
                color: TXT,
              }}
            />
          </div>

          <div>
            <label className="block mb-2" style={{
              fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700,
              color: TXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Sexo ao nascer (opcional)
            </label>
            <div className="flex flex-wrap gap-2">
              {SEX_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSexAtBirth(opt.value)}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                  style={{
                    fontFamily: 'Nunito, sans-serif',
                    backgroundColor: sexAtBirth === opt.value ? MAUVE : '#fff',
                    color: sexAtBirth === opt.value ? 'white' : '#4b4b47',
                    border: sexAtBirth === opt.value ? 'none' : `1.5px solid ${CARD_BORDER}`,
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      <StickyFooterCTA
        primaryLabel={loading ? 'Salvando...' : 'Adicionar criança'}
        onPrimary={handleSubmit}
        primaryDisabled={!isValid}
        primaryLoading={loading}
        primaryColor={MAUVE}
      />
    </div>
  );
}
