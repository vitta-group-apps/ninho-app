/**
 * PaywallGate
 *
 * Wrapper que protege features premium.
 *
 * Uso:
 *  <PaywallGate feature="relatorio">
 *    <BotaoExportarRelatorio />
 *  </PaywallGate>
 *
 * Se isPremium → renderiza children normalmente.
 * Se free → renderiza children com blur + overlay de lock.
 * Toque no overlay → abre PaywallSheet.
 *
 * Props:
 *  feature     — identifica qual feature está sendo bloqueada (para analytics e copy)
 *  children    — conteúdo premium a proteger
 *  blurOnly    — só blur, sem overlay clicável (para previews)
 *  onUnlocked  — callback chamado quando usuário assina e volta
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSubscription } from '@/hooks/useSubscription';
import { PaywallSheet } from '@/components/paywall/PaywallSheet';

export type PaywallFeature =
  | 'relatorio'
  | 'insights'
  | 'segunda_crianca'
  | 'cuidadores'
  | 'marcos_premium'
  | 'lembretes';

interface PaywallGateProps {
  feature: PaywallFeature;
  children: React.ReactNode;
  blurOnly?: boolean;
  onUnlocked?: () => void;
}

// Copy por feature — orientado a benefício, não a feature técnica
const FEATURE_COPY: Record<PaywallFeature, { emoji: string; title: string; teaser: string }> = {
  relatorio:       { emoji: '📋', title: 'Relatório médico',        teaser: 'Gere um resumo completo para levar à consulta' },
  insights:        { emoji: '💡', title: 'Análise de padrões',      teaser: 'Veja tendências de sono, mamadas e desenvolvimento' },
  segunda_crianca: { emoji: '👶', title: 'Mais de uma criança',     teaser: 'Acompanhe todos os seus filhos no mesmo lugar' },
  cuidadores:      { emoji: '👨‍👩‍👧', title: 'Cuidadores extras',       teaser: 'Convide parceiro, avós ou babá para acompanhar junto' },
  marcos_premium:  { emoji: '⭐', title: 'Conteúdo por fase',       teaser: 'Atividades e orientações personalizadas para a idade' },
  lembretes:       { emoji: '🔔', title: 'Lembretes inteligentes',  teaser: 'Alertas baseados na rotina real, não em horário fixo' },
};

export function PaywallGate({ feature, children, blurOnly = false, onUnlocked }: PaywallGateProps) {
  const { isPremium, loading } = useSubscription();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Enquanto carrega, renderiza children normalmente (evita flash)
  if (loading || isPremium) return <>{children}</>;

  const copy = FEATURE_COPY[feature];

  return (
    <>
      {/* Conteúdo bloqueado com blur */}
      <div className="relative select-none">
        <div style={{ filter: 'blur(3px)', pointerEvents: 'none', userSelect: 'none' }}>
          {children}
        </div>

        {/* Overlay clicável */}
        {!blurOnly && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSheetOpen(true)}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl"
            style={{
              backgroundColor: 'rgba(248,245,240,0.82)',
              backdropFilter: 'blur(2px)',
              border: '1.5px solid #e3d9e2',
              cursor: 'pointer',
            }}
          >
            <span className="text-[28px]">{copy.emoji}</span>
            <p className="text-[13px] font-bold font-quicksand text-center px-4 leading-tight"
              style={{ color: '#2C2C2C' }}>
              {copy.title}
            </p>
            <p className="text-[11px] font-nunito text-center px-6 leading-snug"
              style={{ color: '#7A7A7A' }}>
              {copy.teaser}
            </p>
            <div className="mt-1 px-4 py-2 rounded-xl text-[11px] font-bold font-nunito text-white"
              style={{ backgroundColor: '#806e84' }}>
              Ver planos →
            </div>
          </motion.button>
        )}
      </div>

      {/* Sheet de upgrade */}
      <PaywallSheet
        open={sheetOpen}
        feature={feature}
        onClose={() => setSheetOpen(false)}
        onSuccess={() => {
          setSheetOpen(false);
          onUnlocked?.();
        }}
      />
    </>
  );
}