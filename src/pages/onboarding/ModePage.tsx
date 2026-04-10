/**
 * NINHO — ModePage v2 · Bifurcação de Contexto
 *
 * Zeus:  ContextCards grandes, verticais, centrados. Seleção visual recompensadora:
 *        borda colorida + checkmark + spring → auto-avança em 350ms.
 *        Sem chevron, sem lista — é uma escolha de vida, não um menu.
 * Lumen: "Em qual fase o ninho está?" — 8 palavras. < 15 palavras sempre.
 *        Cada opção clarifica o que o app vai entregar, não quem o usuário é.
 * Luke:  Auto-advance após seleção = zero clique extra = TTV menor.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { Text }          from '@/design-system/components/ui/Text';
import { useNinhoStore } from '@/store/useNinhoStore';
import type { OnboardingMode } from '@/store/useNinhoStore';

// ─── ContextCard ──────────────────────────────────────────────────────────────

interface ContextCardProps {
  mode:        OnboardingMode;
  emoji:       string;
  title:       string;
  description: string;
  theme:       'mauve' | 'sage';
  isSelected:  boolean;
  isDisabled:  boolean;
  delay:       number;
  onClick:     () => void;
}

const THEMES = {
  mauve: {
    idleBg:      'bg-[#f8f3f8]',
    selectedBg:  'bg-[#f0e6f0]',
    border:      'border-[#C7B3C5]',
    idleBorder:  'border-transparent',
    check:       'bg-[#806e84] text-white',
    label:       'text-[#5c4d5e]',
  },
  sage: {
    idleBg:      'bg-[#f0f5f2]',
    selectedBg:  'bg-[#e2ede8]',
    border:      'border-[#7da891]',
    idleBorder:  'border-transparent',
    check:       'bg-[#5e8a74] text-white',
    label:       'text-[#3d6150]',
  },
};

function ContextCard({
  emoji, title, description, theme,
  isSelected, isDisabled, delay, onClick,
}: ContextCardProps) {
  const t = THEMES[theme];

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={isDisabled}
      aria-pressed={isSelected}
      className={[
        'relative w-full flex flex-col items-center gap-4',
        'px-6 py-8 rounded-[24px] border-2',
        'transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'focus-visible:ring-ds-accent-tint',
        isSelected ? `${t.selectedBg} ${t.border}` : `${t.idleBg} ${t.idleBorder}`,
        isDisabled && !isSelected ? 'opacity-50' : '',
        'text-left cursor-pointer',
      ].join(' ')}
    >
      {/* Checkmark — aparece ao selecionar */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            key="check"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            className={`absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center ${t.check}`}
          >
            <Check size={14} strokeWidth={2.5} aria-hidden="true" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji âncora — 64px */}
      <motion.span
        animate={isSelected ? { scale: [1, 1.18, 1] } : { scale: 1 }}
        transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
        className="text-[3.75rem] leading-none select-none"
        aria-hidden="true"
      >
        {emoji}
      </motion.span>

      {/* Texto */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <Text
          variant="body-lg-semibold"
          className={`font-heading ${isSelected ? t.label : ''}`}
        >
          {title}
        </Text>
        <Text variant="caption-regular" color="secondary" className="max-w-[220px]">
          {description}
        </Text>
      </div>
    </motion.button>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ModePage() {
  const { setOnboardingMode, setAppState } = useNinhoStore();
  const [selected, setSelected] = useState<OnboardingMode>(null);

  function choose(mode: OnboardingMode) {
    if (selected) return; // evita double-tap durante animação
    setSelected(mode);
    // Pequena pausa recompensadora antes de avançar
    setTimeout(() => {
      setOnboardingMode(mode);
      setAppState('onboarding_family');
    }, 380);
  }

  return (
    <div
      className="min-h-screen bg-ds-pure-white flex flex-col"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}
    >

      {/* ── logo mark ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2 px-6 mb-2"
      >
        <NinhoMark />
        <Text variant="body-md-semibold" className="font-heading text-ds-accent-fg">
          ninho
        </Text>
      </motion.div>

      {/* ── headline ──────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        className="px-6 pt-6 pb-8"
      >
        <Text variant="h1" className="font-heading tracking-tight leading-tight">
          Em qual fase o{'\u00A0'}ninho está?
        </Text>
        <Text variant="body-md-regular" color="secondary" className="mt-2">
          O app se adapta para ajudar do jeito certo.
        </Text>
      </motion.section>

      {/* ── ContextCards — escolha visual ─────────────────────────────────── */}
      <main className="flex-1 flex flex-col px-6 gap-4 pb-10">
        <ContextCard
          mode="pregnancy"
          emoji="🌙"
          title="Ainda na gestação"
          description="Pré-natal, exames e preparo para a chegada."
          theme="mauve"
          isSelected={selected === 'pregnancy'}
          isDisabled={!!selected && selected !== 'pregnancy'}
          delay={0.14}
          onClick={() => choose('pregnancy')}
        />

        <ContextCard
          mode="newborn"
          emoji="🍼"
          title="Bebê já chegou"
          description="Rotina diária, sono, alimentação e crescimento."
          theme="sage"
          isSelected={selected === 'newborn'}
          isDisabled={!!selected && selected !== 'newborn'}
          delay={0.22}
          onClick={() => choose('newborn')}
        />

        {/* Reassurance — baixa ansiedade de decisão */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-center mt-1"
          style={{
            fontSize: 'var(--font-size-text-sm)',
            color: 'var(--color-neutral-foreground-fg-low-contrast)',
          }}
        >
          Pode mudar isso depois nas configurações.
        </motion.p>
      </main>
    </div>
  );
}

// ─── logo mark inline ─────────────────────────────────────────────────────────

function NinhoMark() {
  return (
    <div className="w-8 h-8 rounded-xl bg-ds-accent-subtle flex items-center justify-center">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          className="text-ds-accent-tint"
        />
      </svg>
    </div>
  );
}
