/**
 * NINHO — ModePage (Bifurcação Estratégica)
 *
 * Luke: "Em qual fase o seu ninho está?" — segmenta gestante vs. criança nascida.
 * Zeus: Dois cards grandes, toque mínimo 48px, sem bordas decorativas.
 * Lumen: Linguagem acolhedora, < 15 palavras por frase, foco no objeto de cuidado.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Text }   from '@/design-system/components/ui/Text';
import { useNinhoStore } from '@/store/useNinhoStore';
import type { OnboardingMode } from '@/store/useNinhoStore';

// ─── mode card ────────────────────────────────────────────────────────────────

interface ModeCardProps {
  emoji:       string;
  title:       string;
  description: string;
  accent:      string;   // bg class
  border:      string;   // border class
  onClick:     () => void;
  delay:       number;
}

function ModeCard({ emoji, title, description, accent, border, onClick, delay }: ModeCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileTap={{ scale: 0.97 }}
      className={[
        'w-full text-left rounded-[var(--radius-xxl)] p-[var(--padding-xl)]',
        'flex flex-col gap-[var(--gap-md)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent-tint focus-visible:ring-offset-2',
        'transition-transform duration-150',
        accent,
      ].join(' ')}
      style={{ minHeight: '148px' }}
    >
      <span className="text-5xl leading-none select-none" aria-hidden="true" style={{ fontSize: '3rem' }}>
        {emoji}
      </span>
      <div className="flex flex-col gap-[var(--gap-xs)]">
        <Text variant="body-lg-semibold" as="span" className="font-heading">
          {title}
        </Text>
        <Text variant="caption-regular" color="secondary" as="span">
          {description}
        </Text>
      </div>
    </motion.button>
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
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}
    >
      {/* ── hero ──────────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col gap-[var(--gap-sm)] px-[var(--padding-xl)] pt-[var(--padding-xl)] pb-[var(--padding-lg)]"
      >
        <span
          className="leading-none select-none"
          aria-hidden="true"
          style={{ fontSize: '3.5rem', lineHeight: 1 }}
        >
          🪺
        </span>
        <div className="flex flex-col gap-[var(--gap-xs)]">
          <Text variant="h1" className="font-heading tracking-tight">
            Em qual fase o ninho está?
          </Text>
          <Text variant="body-md-regular" color="secondary">
            Assim o app se adapta para ajudar do jeito certo.
          </Text>
        </div>
      </motion.section>

      {/* ── cards ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col px-[var(--padding-xl)] gap-[var(--gap-md)] pb-[var(--padding-xxl)]">

        <ModeCard
          emoji="🤰"
          title="Estamos esperando"
          description="Pré-natal, exames e preparação para a chegada."
          accent="bg-ds-secondary-subtle"
          border="border-ds-secondary-border"
          delay={0.1}
          onClick={() => choose('pregnancy')}
        />

        <ModeCard
          emoji="👶"
          title="Bebê já chegou"
          description="Rotina diária, sono, alimentação e crescimento."
          accent="bg-ds-accent-subtle"
          border="border-ds-accent-border"
          delay={0.2}
          onClick={() => choose('newborn')}
        />

        {/* reassurance */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
          style={{ fontSize: 'var(--font-size-text-sm)', color: 'var(--color-neutral-foreground-fg-low-contrast)' }}
        >
          Pode mudar isso depois nas configurações.
        </motion.p>
      </main>
    </div>
  );
}
