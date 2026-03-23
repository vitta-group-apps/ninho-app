/**
 * PaywallSheet
 *
 * Bottom sheet de upgrade. Aparece quando usuário toca em feature premium.
 *
 * Fluxo:
 *  1. Usuário vê benefícios concretos, não lista de features
 *  2. Escolhe mensal ou anual
 *  3. Toca em assinar → Edge Function cria Stripe Checkout session
 *  4. Redirect para Stripe → volta para o app com status atualizado
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { PaywallFeature } from '@/components/paywall/PaywallGate';

// ── Cores fixas ──
const MAUVE        = '#806e84';
const MAUVE_BG     = '#f4f0f3';
const MAUVE_BORDER = '#e3d9e2';
const SAGE         = '#789687';
const SAGE_BG      = '#ebf0ed';
const CARD_BG      = '#ffffff';
const CARD_BORDER  = '#E5E0D8';
const MUTED_BG     = '#E8E8E2';
const TXT          = '#2C2C2C';
const TXT_MUTED    = '#7A7A7A';
const AMBER        = '#C8894A';

// Benefícios mostrados no sheet — concretos, sem jargão técnico
const BENEFITS = [
  { emoji: '💡', text: 'Análise automática de padrões de sono e mamadas' },
  { emoji: '📋', text: 'Relatório médico pronto para levar à consulta' },
  { emoji: '🔔', text: 'Lembretes baseados na rotina real do seu filho' },
  { emoji: '👨‍👩‍👧', text: 'Compartilhe com parceiro, avós e babá' },
];

// Títulos contextuais por feature — mais relevante que título genérico
const FEATURE_TITLES: Record<PaywallFeature, string> = {
  relatorio:       'Leve um resumo completo para a próxima consulta',
  insights:        'Entenda os padrões por trás da rotina do seu filho',
  segunda_crianca: 'Acompanhe todos os seus filhos no mesmo lugar',
  cuidadores:      'Cuide junto — convide quem você quer perto',
  marcos_premium:  'Atividades e orientações para cada fase',
  lembretes:       'Lembretes que entendem a rotina real',
};

type PlanType = 'monthly' | 'annual';

interface PaywallSheetProps {
  open: boolean;
  feature: PaywallFeature;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaywallSheet({ open, feature, onClose, onSuccess }: PaywallSheetProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const [loading, setLoading]           = useState(false);

  async function handleSubscribe() {
    setLoading(true);
    try {
      // Chama Edge Function que cria Stripe Checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: selectedPlan === 'annual'
            ? 'price_1TE9SWEoS6pDYPW0FBL60N7d'  
            : 'price_1TE9S4EoS6pDYPW0GBbHsSfD', 
          successUrl: `${window.location.origin}/home?upgraded=true`,
          cancelUrl:  window.location.href,
        },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      toast({
        title: 'Não foi possível abrir o checkout',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto rounded-t-3xl overflow-hidden"
            style={{ backgroundColor: CARD_BG }}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full mx-auto mt-3"
              style={{ backgroundColor: CARD_BORDER }} />

            {/* Header */}
            <div className="px-5 pt-4 pb-5"
              style={{ background: `linear-gradient(160deg, ${MAUVE} 0%, #6b5a6f 100%)` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {/* Badge premium */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3"
                    style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
                    <span className="text-[10px]">✨</span>
                    <span className="text-[10px] font-bold font-nunito text-white uppercase tracking-wide">
                      Ninho Premium
                    </span>
                  </div>
                  <p className="text-[18px] font-bold font-quicksand text-white leading-snug">
                    {FEATURE_TITLES[feature]}
                  </p>
                </div>
                <button onClick={onClose} className="mt-1 flex-shrink-0"
                  style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-5 py-5 space-y-5"
              style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>

              {/* Benefícios */}
              <div className="space-y-2.5">
                {BENEFITS.map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[15px] flex-shrink-0"
                      style={{ backgroundColor: MAUVE_BG }}>
                      {b.emoji}
                    </div>
                    <p className="text-[13px] font-nunito leading-snug" style={{ color: TXT }}>
                      {b.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Seletor de plano */}
              <div className="space-y-2">
                {/* Plano anual — destaque */}
                <button
                  onClick={() => setSelectedPlan('annual')}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all"
                  style={{
                    backgroundColor: selectedPlan === 'annual' ? MAUVE_BG : MUTED_BG,
                    border: `2px solid ${selectedPlan === 'annual' ? MAUVE : 'transparent'}`,
                    cursor: 'pointer',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: selectedPlan === 'annual' ? MAUVE : 'transparent',
                        border: `2px solid ${selectedPlan === 'annual' ? MAUVE : '#CBCBC8'}`,
                      }}>
                      {selectedPlan === 'annual' && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-bold font-nunito" style={{ color: TXT }}>
                        Plano anual
                      </p>
                      <p className="text-[11px] font-nunito" style={{ color: TXT_MUTED }}>
                        R$12,42/mês · cobrado uma vez por ano
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] font-bold font-nunito px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: SAGE }}>
                      37% off
                    </span>
                    <p className="text-[14px] font-bold font-quicksand" style={{ color: MAUVE }}>
                      R$149/ano
                    </p>
                  </div>
                </button>

                {/* Plano mensal */}
                <button
                  onClick={() => setSelectedPlan('monthly')}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all"
                  style={{
                    backgroundColor: selectedPlan === 'monthly' ? MAUVE_BG : MUTED_BG,
                    border: `2px solid ${selectedPlan === 'monthly' ? MAUVE : 'transparent'}`,
                    cursor: 'pointer',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: selectedPlan === 'monthly' ? MAUVE : 'transparent',
                        border: `2px solid ${selectedPlan === 'monthly' ? MAUVE : '#CBCBC8'}`,
                      }}>
                      {selectedPlan === 'monthly' && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-bold font-nunito" style={{ color: TXT }}>
                        Plano mensal
                      </p>
                      <p className="text-[11px] font-nunito" style={{ color: TXT_MUTED }}>
                        Cancele quando quiser
                      </p>
                    </div>
                  </div>
                  <p className="text-[14px] font-bold font-quicksand" style={{ color: TXT }}>
                    R$19,90/mês
                  </p>
                </button>
              </div>

              {/* CTA principal */}
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full py-4 rounded-2xl text-[15px] font-bold font-nunito text-white transition-all active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: MAUVE, border: 'none', cursor: 'pointer' }}
              >
                {loading ? 'Abrindo checkout...' : selectedPlan === 'annual'
                  ? 'Assinar por R$149/ano →'
                  : 'Assinar por R$19,90/mês →'}
              </button>

              {/* Garantias */}
              <div className="flex items-center justify-center gap-4">
                {['Cancele quando quiser', 'Pagamento seguro', 'Sem surpresas'].map(g => (
                  <div key={g} className="flex items-center gap-1">
                    <span className="text-[10px]" style={{ color: SAGE }}>✓</span>
                    <span className="text-[10px] font-nunito" style={{ color: TXT_MUTED }}>{g}</span>
                  </div>
                ))}
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
