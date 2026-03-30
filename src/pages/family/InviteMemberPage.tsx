/**
 * InviteMemberPage — Página de produto para convidar novo membro da família.
 * Rota: /family/invite
 * Chama a Edge Function invite-family-member.
 * Débito técnico P2: adicionar seleção de crianças por membro.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { ScreenHeader, StickyFooterCTA } from '@/components/ds';
import { toast } from '@/hooks/use-toast';

const MAUVE = '#806e84';
const SAGE = '#789687';
const MUTED_BG = '#E8E8E2';
const CARD_BG = '#ffffff';
const CARD_BORDER = '#E5E0D8';
const TXT = '#2C2C2C';
const TXT_MUTED = '#7A7A7A';
const PAGE_BG = '#F8F5F0';

const ROLE_OPTIONS: { value: string; label: string; description: string }[] = [
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Acesso total — pode registrar eventos e gerenciar a família.',
  },
  {
    value: 'caregiver',
    label: 'Cuidador',
    description: 'Pode registrar e acompanhar eventos da rotina.',
  },
  {
    value: 'viewer',
    label: 'Visualizador',
    description: 'Apenas visualiza — não pode registrar eventos.',
  },
];

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function InviteMemberPage() {
  const navigate = useNavigate();
  const { familyId } = useActiveChild();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('caregiver');
  const [loading, setLoading] = useState(false);

  const isValid = isValidEmail(email) && !!role;

  async function handleSubmit() {
    if (!familyId || !isValid) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-family-member', {
        body: { email: email.trim(), role, familyId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: `✉️ Convite enviado para ${email.trim()}` });
      navigate(-1);
    } catch (e: unknown) {
      toast({
        title: 'Não foi possível enviar o convite',
        description: e instanceof Error ? e.message : 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: PAGE_BG }}>
      <ScreenHeader
        title="Convidar membro"
        onBack={() => navigate(-1)}
      />

      <div className="ds-form-body">
        <div className="space-y-6">

          {/* Email */}
          <div>
            <label className="block mb-[5px]" style={{
              fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700,
              color: TXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Email do cuidador
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              autoFocus
              className="w-full px-4 py-3 text-sm outline-none transition-all"
              style={{
                fontFamily: 'Nunito, sans-serif',
                backgroundColor: MUTED_BG,
                border: `1.5px solid ${isValidEmail(email) ? MAUVE : 'transparent'}`,
                borderRadius: 12,
                color: TXT,
                fontSize: 16,
              }}
              onFocus={e => { if (!isValidEmail(email)) e.target.style.borderColor = '#C7B3C5'; }}
              onBlur={e => { if (!isValidEmail(email)) e.target.style.borderColor = 'transparent'; }}
            />
            <p className="text-[11px] mt-1.5 font-nunito" style={{ color: TXT_MUTED }}>
              A pessoa receberá um email com o link para entrar no Ninho.
            </p>
          </div>

          {/* Papel */}
          <div>
            <label className="block mb-3" style={{
              fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700,
              color: TXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Nível de acesso
            </label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className="w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.99]"
                  style={{
                    backgroundColor: role === opt.value ? '#f4f0f3' : CARD_BG,
                    border: `1.5px solid ${role === opt.value ? MAUVE : CARD_BORDER}`,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      backgroundColor: role === opt.value ? MAUVE : 'transparent',
                      border: `2px solid ${role === opt.value ? MAUVE : '#CBCBC8'}`,
                    }}
                  >
                    {role === opt.value && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold font-quicksand" style={{ color: TXT }}>
                      {opt.label}
                    </p>
                    <p className="text-[11px] font-nunito mt-0.5 leading-snug" style={{ color: TXT_MUTED }}>
                      {opt.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div
            className="flex items-start gap-2 px-3 py-3 rounded-xl"
            style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
          >
            <span className="text-sm flex-shrink-0">ℹ️</span>
            <p className="text-[11px] font-nunito leading-relaxed" style={{ color: TXT_MUTED }}>
              O acesso pode ser alterado ou removido a qualquer momento na página de Família.
            </p>
          </div>

        </div>
      </div>

      <StickyFooterCTA
        primaryLabel={loading ? 'Enviando convite...' : 'Enviar convite'}
        onPrimary={handleSubmit}
        primaryDisabled={!isValid}
        primaryLoading={loading}
        primaryColor={SAGE}
      />
    </div>
  );
}
