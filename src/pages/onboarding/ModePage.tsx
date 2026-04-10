/**
 * NINHO — ModePage v3 · Bifurcação Visual Imersiva
 * Zeus: dois cards grandes, gradiente imersivo, seleção inverte as cores
 * Lumen: 8 palavras no headline. Auto-advance = zero clique extra.
 * Luke:  seleção → fill animado → avança em 380ms
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNinhoStore } from '@/store/useNinhoStore';
import type { OnboardingMode } from '@/store/useNinhoStore';
import { NinhoWordmark } from '@/components/NinhoLogo';

// ─── tokens ──────────────────────────────────────────────────────────────────

const T = {
  mauve50:  '#faf3fc',
  mauve100: '#f4e8f7',
  mauve200: '#e8d4ed',
  mauve500: '#8b5e96',
  mauve600: '#7a4f84',
  mauve700: '#6e2880',
  sage50:   '#f4fbf8',
  sage100:  '#e6f4ef',
  sage200:  '#cce9de',
  sage500:  '#4a9e7e',
  sage600:  '#378163',
  sage700:  '#1c5941',
  stone50:  '#f8f7f7',
  stone200: '#e2e0df',
  stone500: '#a9a5a2',
  stone900: '#3a3836',
  white:    '#ffffff',
} as const;

const Font = {
  h: "'Quicksand', 'SF Pro Rounded', system-ui, sans-serif",
  b: "'Nunito', 'SF Pro Text', system-ui, sans-serif",
} as const;

// ─── check icon ──────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── immersive card ───────────────────────────────────────────────────────────

interface CardConfig {
  mode: OnboardingMode;
  emoji: string;
  title: string;
  sub: string;
  tag: string;
  idleGrad: string;
  activeGrad: string;
  idleEmoji: string;
  activeTitle: string;
  activeSub: string;
  delay: number;
}

const CARDS: CardConfig[] = [
  {
    mode: 'pregnancy',
    emoji: '🌙',
    title: 'Ainda na gestação',
    sub: 'Pré-natal, exames e preparo para a chegada.',
    tag: 'Gestação',
    idleGrad: `linear-gradient(160deg, ${T.mauve50} 0%, ${T.mauve100} 100%)`,
    activeGrad: `linear-gradient(160deg, ${T.mauve500} 0%, ${T.mauve700} 100%)`,
    idleEmoji: T.mauve200,
    activeTitle: '#ffffff',
    activeSub: 'rgba(255,255,255,0.75)',
    delay: 0.12,
  },
  {
    mode: 'newborn',
    emoji: '🍼',
    title: 'Bebê já chegou',
    sub: 'Rotina diária, sono, alimentação e crescimento.',
    tag: 'Recém-nascido',
    idleGrad: `linear-gradient(160deg, ${T.sage50} 0%, ${T.sage100} 100%)`,
    activeGrad: `linear-gradient(160deg, ${T.sage500} 0%, ${T.sage700} 100%)`,
    idleEmoji: T.sage200,
    activeTitle: '#ffffff',
    activeSub: 'rgba(255,255,255,0.75)',
    delay: 0.22,
  },
];

interface ImmersiveCardProps {
  card: CardConfig;
  selected: OnboardingMode;
  onSelect: (mode: NonNullable<OnboardingMode>) => void;
}

function ImmersiveCard({ card, selected, onSelect }: ImmersiveCardProps) {
  const isSelected = selected === card.mode;
  const otherSelected = selected !== null && selected !== card.mode;

  return (
    <motion.button
      type="button"
      aria-pressed={isSelected}
      onClick={() => !selected && onSelect(card.mode as NonNullable<OnboardingMode>)}
      initial={{ opacity: 0, y: 32 }}
      animate={{
        opacity: otherSelected ? 0.28 : 1,
        y: 0,
        scale: isSelected ? 1.015 : otherSelected ? 0.94 : 1,
      }}
      transition={{
        opacity: { duration: 0.3 },
        scale: { duration: 0.35, ease: [0.34, 1.2, 0.64, 1] },
        y: { duration: 0.5, delay: card.delay, ease: [0.22, 1, 0.36, 1] },
      }}
      style={{
        width: '100%',
        minHeight: 200,
        borderRadius: 28,
        border: 'none',
        cursor: selected ? 'default' : 'pointer',
        outline: 'none',
        background: isSelected ? card.activeGrad : card.idleGrad,
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 12,
        textAlign: 'left',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isSelected
          ? '0 12px 40px rgba(0,0,0,0.18)'
          : '0 2px 12px rgba(0,0,0,0.06)',
        transition: 'background 0.35s ease, box-shadow 0.3s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* subtle texture ring */}
      <div style={{
        position: 'absolute',
        right: -40,
        top: -40,
        width: 180,
        height: 180,
        borderRadius: '50%',
        border: `40px solid ${isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)'}`,
        pointerEvents: 'none',
        transition: 'border-color 0.35s ease',
      }} />

      {/* top row: emoji + check */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <motion.span
          animate={isSelected ? { scale: [1, 1.22, 1] } : { scale: 1 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ fontSize: '2.5rem', lineHeight: 1, userSelect: 'none' }}
          aria-hidden="true"
        >
          {card.emoji}
        </motion.span>

        <AnimatePresence>
          {isSelected && (
            <motion.div
              key="check"
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.3 }}
              transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
              style={{
                width: 36, height: 36,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.22)',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <CheckIcon />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* text */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{
          fontFamily: Font.h,
          fontWeight: 700,
          fontSize: '1.35rem',
          lineHeight: 1.2,
          color: isSelected ? card.activeTitle : T.stone900,
          transition: 'color 0.3s ease',
          letterSpacing: '-0.01em',
        }}>
          {card.title}
        </span>
        <span style={{
          fontFamily: Font.b,
          fontWeight: 400,
          fontSize: '0.9rem',
          lineHeight: 1.5,
          color: isSelected ? card.activeSub : T.stone500,
          transition: 'color 0.3s ease',
          maxWidth: 240,
        }}>
          {card.sub}
        </span>
      </div>

      {/* tag pill */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        paddingInline: 10,
        paddingBlock: 4,
        borderRadius: 100,
        background: isSelected ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.05)',
        backdropFilter: 'blur(4px)',
        transition: 'background 0.3s ease',
      }}>
        <span style={{
          fontFamily: Font.b,
          fontWeight: 600,
          fontSize: '0.72rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: isSelected ? 'rgba(255,255,255,0.85)' : T.stone500,
          transition: 'color 0.3s ease',
        }}>
          {card.tag}
        </span>
      </div>
    </motion.button>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ModePage() {
  const { setOnboardingMode, setAppState } = useNinhoStore();
  const [selected, setSelected] = useState<OnboardingMode>(null);

  function choose(mode: NonNullable<OnboardingMode>) {
    if (selected) return;
    setSelected(mode);
    setTimeout(() => {
      setOnboardingMode(mode);
      setAppState('onboarding_family');
    }, 380);
  }

  return (
    <div style={{
      minHeight: '100svh',
      background: T.white,
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 'calc(env(safe-area-inset-top) + 20px)',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
    }}>

      {/* ── header ──────────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          paddingInline: 24, paddingBottom: 4,
        }}
      >
        <NinhoWordmark height={22} color={T.mauve700} />
      </motion.header>

      {/* ── headline ────────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        style={{ paddingInline: 24, paddingTop: 28, paddingBottom: 32 }}
      >
        <h1 style={{
          fontFamily: Font.h,
          fontWeight: 700,
          fontSize: 'clamp(1.75rem, 7vw, 2.2rem)',
          lineHeight: 1.15,
          letterSpacing: '-0.025em',
          color: T.stone900,
          margin: 0,
        }}>
          Em qual fase o&nbsp;ninho está?
        </h1>
        <p style={{
          fontFamily: Font.b,
          fontWeight: 400,
          fontSize: '1rem',
          lineHeight: 1.6,
          color: T.stone500,
          margin: '10px 0 0',
        }}>
          O app se adapta para ajudar do jeito certo.
        </p>
      </motion.section>

      {/* ── cards ───────────────────────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        paddingInline: 20,
        gap: 14,
      }}>
        {CARDS.map(card => (
          <ImmersiveCard
            key={card.mode}
            card={card}
            selected={selected}
            onSelect={choose}
          />
        ))}

        {/* reassurance */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          style={{
            fontFamily: Font.b,
            fontSize: '0.825rem',
            color: T.stone500,
            textAlign: 'center',
            margin: '4px 0 0',
          }}
        >
          Pode mudar isso depois nas configurações.
        </motion.p>
      </main>
    </div>
  );
}
