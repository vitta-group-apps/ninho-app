/**
 * NINHO — ModePage: Bifurcação Estratégica
 *
 * Zeus: Cards visuais grandes (Card DS elevated), Heroicons, tipografia ExtraBold,
 *       fundo branco puro, zero bordas decorativas, toque mínimo 80px.
 * Lumen: "Em qual fase o seu ninho está?" — frase < 15 palavras, acolhedora.
 * Luke: Segmenta UX inteira — Gestação (preparação) vs. Recém-nascido (rotina).
 * Lora: Card elevated = bg-ds-pure-white + shadow-ds-xs. Tokens semânticos.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Home, ChevronRight } from 'lucide-react';
import { Text }  from '@/design-system/components/ui/Text';
import { Card }  from '@/design-system/components/ui/Card';
import { useNinhoStore } from '@/store/useNinhoStore';
import type { OnboardingMode } from '@/store/useNinhoStore';

// ─── mode card ────────────────────────────────────────────────────────────────

interface ModeOptionProps {
  icon:        React.ReactNode;
  iconBg:      string;
  iconColor:   string;
  title:       string;
  description: string;
  delay:       number;
  onClick:     () => void;
}

function ModeOption({ icon, iconBg, iconColor, title, description, delay, onClick }: ModeOptionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.985 }}
    >
      <Card
        variant="elevated"
        padding="none"
        onClick={onClick}
        className="w-full"
      >
        {/* touch target mínimo: padding interno garante > 80px de altura */}
        <div className="flex items-center gap-[var(--gap-lg)] px-[var(--padding-xl)] py-[var(--padding-xl)]">

          {/* ícone em círculo colorido */}
          <div
            className={`shrink-0 w-16 h-16 rounded-[var(--radius-xxl)] flex items-center justify-center ${iconBg}`}
          >
            <div className={`w-8 h-8 ${iconColor}`}>
              {icon}
            </div>
          </div>

          {/* texto */}
          <div className="flex-1 min-w-0 flex flex-col gap-[var(--gap-xxs)]">
            <Text variant="body-lg-semibold" className="font-heading">
              {title}
            </Text>
            <Text variant="caption-regular" color="secondary">
              {description}
            </Text>
          </div>

          {/* chevron */}
          <ChevronRight
            className="shrink-0 w-5 h-5 text-ds-neutral-fg"
            aria-hidden="true"
          />
        </div>
      </Card>
    </motion.div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ModePage() {
  const { setOnboardingMode, setAppState } = useNinhoStore();

  function choose(mode: OnboardingMode) {
    setOnboardingMode(mode);
    setAppState('onboarding_family');
  }

  return (
    <div
      className="min-h-screen bg-ds-pure-white flex flex-col"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}
    >

      {/* ── hero ──────────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="px-[var(--padding-xl)] pt-[var(--padding-lg)] pb-[var(--padding-xxl)]"
      >
        {/* logotype / marca */}
        <div className="flex items-center gap-[var(--gap-sm)] mb-[var(--gap-xxl)]">
          <div className="w-9 h-9 rounded-[var(--radius-lg)] bg-ds-accent-subtle flex items-center justify-center">
            <HeartNinhoIcon />
          </div>
          <Text variant="body-lg-semibold" className="font-heading text-ds-accent-fg">
            ninho
          </Text>
        </div>

        {/* headline */}
        <Text variant="h1" className="font-heading tracking-tight leading-tight">
          Em qual fase o{'\u00A0'}ninho está?
        </Text>
        <Text variant="body-md-regular" color="secondary" className="mt-[var(--gap-sm)]">
          O app se adapta para ajudar do jeito certo.
        </Text>
      </motion.section>

      {/* ── opções ────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col px-[var(--padding-xl)] gap-[var(--gap-md)] pb-[var(--padding-xxl)]">

        <ModeOption
          icon={<Sparkles strokeWidth={1.5} />}
          iconBg="bg-ds-secondary-subtle"
          iconColor="text-ds-secondary-fg"
          title="Ainda na gestação"
          description="Pré-natal, exames e preparação para a chegada."
          delay={0.12}
          onClick={() => choose('pregnancy')}
        />

        <ModeOption
          icon={<Home strokeWidth={1.5} />}
          iconBg="bg-ds-accent-subtle"
          iconColor="text-ds-accent-fg"
          title="Bebê já chegou"
          description="Rotina diária, sono, alimentação e crescimento."
          delay={0.22}
          onClick={() => choose('newborn')}
        />

        {/* reassurance */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="text-center mt-[var(--gap-sm)]"
          style={{
            fontSize: 'var(--font-size-text-sm)',
            color: 'var(--color-neutral-foreground-fg-low-contrast)',
            lineHeight: 1.5,
          }}
        >
          Pode mudar isso depois nas configurações.
        </motion.p>
      </main>
    </div>
  );
}

// ─── mini ícone do ninho (inline) ─────────────────────────────────────────────

function HeartNinhoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        className="text-ds-accent-tint"
      />
    </svg>
  );
}
