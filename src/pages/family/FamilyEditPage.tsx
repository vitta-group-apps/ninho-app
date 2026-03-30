/**
 * FamilyEditPage — Página de produto para editar dados da família.
 * Rota: /family/edit
 * Separada do onboarding — carrega dados existentes e permite editar nome.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { ScreenHeader, StickyFooterCTA } from '@/components/ds';
import { toast } from '@/hooks/use-toast';

const MAUVE = '#806e84';
const MUTED_BG = '#E8E8E2';
const CARD_BG = '#ffffff';
const CARD_BORDER = '#E5E0D8';
const TXT = '#2C2C2C';
const TXT_MUTED = '#7A7A7A';
const PAGE_BG = '#F8F5F0';

export default function FamilyEditPage() {
  const navigate = useNavigate();
  const { familyId } = useActiveChild();

  const [familyName, setFamilyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const isValid = familyName.trim().length >= 2;

  useEffect(() => {
    if (!familyId) return;

    (async () => {
      const { data, error } = await supabase
        .from('families')
        .select('name')
        .eq('id', familyId)
        .maybeSingle();

      if (!error && data) {
        setFamilyName(data.name);
      }

      setLoadingData(false);
    })();
  }, [familyId]);

  async function handleSubmit() {
    if (!familyId || !isValid) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('families')
        .update({ name: familyName.trim() })
        .eq('id', familyId);

      if (error) throw error;

      toast({ title: '✓ Nome da família atualizado' });
      navigate(-1);
    } catch {
      toast({
        title: 'Não foi possível salvar as alterações',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: PAGE_BG }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: MAUVE }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: PAGE_BG }}>
      <ScreenHeader
        title="Editar família"
        onBack={() => navigate(-1)}
      />

      <div className="ds-form-body">
        <div className="space-y-5">

          <div>
            <label className="block mb-[5px]" style={{
              fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700,
              color: TXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Nome da família
            </label>
            <input
              type="text"
              value={familyName}
              onChange={e => setFamilyName(e.target.value)}
              placeholder="Ex: Família Silva, Casa Salmon…"
              autoFocus
              className="w-full px-4 py-3 text-sm outline-none transition-all"
              style={{
                fontFamily: 'Nunito, sans-serif',
                backgroundColor: MUTED_BG,
                border: `1.5px solid ${isValid ? MAUVE : 'transparent'}`,
                borderRadius: 12,
                color: TXT,
                fontSize: 16,
              }}
              onFocus={e => { if (!isValid) e.target.style.borderColor = '#C7B3C5'; }}
              onBlur={e => { if (!isValid) e.target.style.borderColor = 'transparent'; }}
            />
          </div>

          <div
            className="flex items-start gap-2 px-3 py-3 rounded-xl"
            style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
          >
            <span className="text-sm">ℹ️</span>
            <p className="text-[12px] font-nunito leading-relaxed" style={{ color: TXT_MUTED }}>
              O nome da família aparece para todos os cuidadores vinculados.
            </p>
          </div>

        </div>
      </div>

      <StickyFooterCTA
        primaryLabel={loading ? 'Salvando...' : 'Salvar alterações'}
        onPrimary={handleSubmit}
        primaryDisabled={!isValid}
        primaryLoading={loading}
        primaryColor={MAUVE}
      />
    </div>
  );
}
