/**
 * NINHO — ChildPage v4 · Passo 3 de 3
 *
 * Fases:
 *   'form'         → Cadastro da criança (nome, data, sexo)
 *   'more_child'   → "Tem mais uma criança?" — upsell natural de múltiplas crianças
 *   'premium_wall' → Paywall de múltiplas crianças (Premium)
 *
 * Sell point: monitorar mais de uma criança é Premium.
 * Momento certo: logo após salvar com sucesso, quando o vínculo emocional está alto.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useNinhoStore } from '@/store/useNinhoStore';
import { NinhoWordmark, NinhoIcon } from '@/components/NinhoLogo';

// ─── tokens ──────────────────────────────────────────────────────────────────

const T = {
  mauve50:  '#faf3fc',
  mauve100: '#f4e8f7',
  mauve200: '#e8d4ed',
  mauve300: '#d8b9df',
  mauve500: '#8b5e96',
  mauve700: '#6e2880',
  sage100:  '#e6f4ef',
  sage300:  '#b8dbcd',
  sage500:  '#4a9e7e',
  amber50:  '#fffbf0',
  amber200: '#fde68a',
  amber500: '#f59e0b',
  stone50:  '#f8f7f7',
  stone100: '#eeedec',
  stone200: '#e2e0df',
  stone300: '#ceccca',
  stone400: '#c8c4c1',
  stone500: '#a9a5a2',
  stone700: '#706d69',
  stone900: '#3a3836',
  clay50:   '#fcf4f3',
  clay200:  '#ecd3d0',
  clay800:  '#671d14',
  white:    '#ffffff',
} as const;

const Font = {
  h: "'Quicksand', system-ui, sans-serif",
  b: "'Nunito', system-ui, sans-serif",
} as const;

type Phase = 'form' | 'more_child' | 'premium_wall';

// ─── step dots ────────────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}
      aria-label={`Passo ${current} de ${total}`}
      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const active = i + 1 === current;
        const done   = i + 1 < current;
        return (
          <div key={i} style={{
            height: 8, width: active ? 24 : 8, borderRadius: 100,
            background: done || active ? T.mauve500 : T.stone200,
            transition: 'width 0.3s ease, background 0.3s ease',
          }} />
        );
      })}
    </div>
  );
}

// ─── spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#ffffff', flexShrink: 0 }}
    />
  );
}

// ─── sex picker ───────────────────────────────────────────────────────────────

type Sex = 'male' | 'female' | 'other';

const SEX_OPTIONS: { value: Sex; emoji: string; label: string }[] = [
  { value: 'male',   emoji: '👦', label: 'Menino' },
  { value: 'female', emoji: '👧', label: 'Menina' },
  { value: 'other',  emoji: '🧒', label: 'Outro'  },
];

function SexPicker({ value, onChange }: { value?: Sex; onChange: (v: Sex) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: Font.b, fontWeight: 600, fontSize: '0.85rem', color: T.stone700 }}>Sexo</span>
        <span style={{ fontFamily: Font.b, fontSize: '0.8rem', color: T.stone300 }}>(opcional)</span>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {SEX_OPTIONS.map(o => {
          const selected = value === o.value;
          return (
            <button key={o.value} type="button" aria-pressed={selected} onClick={() => onChange(o.value)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                paddingBlock: 14, borderRadius: 16,
                border: `1.5px solid ${selected ? T.mauve300 : T.stone200}`,
                background: selected ? T.mauve50 : T.stone50,
                cursor: 'pointer', outline: 'none',
                fontFamily: Font.b, fontWeight: selected ? 700 : 500, fontSize: '0.875rem',
                color: selected ? T.mauve700 : T.stone700,
                transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: '1.4rem', lineHeight: 1 }} aria-hidden="true">{o.emoji}</span>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── aha! moment ──────────────────────────────────────────────────────────────

function AhaMoment({ name, isPregnancy }: { name: string; isPregnancy: boolean }) {
  const firstName = name.trim().split(' ')[0];
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28 }} role="status" aria-live="polite"
      style={{ borderRadius: 14, padding: '12px 16px', background: isPregnancy ? T.mauve50 : T.sage100, border: `1px solid ${isPregnancy ? T.mauve200 : T.sage300}` }}
    >
      <p style={{ fontFamily: Font.b, fontSize: 14, color: isPregnancy ? T.mauve700 : T.sage500, margin: 0 }}>
        {isPregnancy
          ? `✨ Que nome lindo! Vamos preparar tudo para a chegada de ${firstName}.`
          : `✨ Que nome lindo! Vamos organizar o mundo para ${firstName}.`}
      </p>
    </motion.div>
  );
}

// ─── more child screen ────────────────────────────────────────────────────────

function MoreChildScreen({ babyName, onYes, onNo }: { babyName: string; onYes: () => void; onNo: () => void }) {
  const firstName = babyName.trim().split(' ')[0];
  return (
    <motion.div
      key="more_child"
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        minHeight: '100svh', background: T.white,
        display: 'flex', flexDirection: 'column',
        paddingTop: 'calc(env(safe-area-inset-top) + 20px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)',
      }}
    >
      {/* header */}
      <header style={{ paddingInline: 24, paddingBottom: 12 }}>
        <NinhoWordmark height={20} color={T.mauve700} />
      </header>

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        paddingInline: 24, gap: 32, maxWidth: 440, width: '100%', alignSelf: 'center',
      }}>
        {/* icon */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: `linear-gradient(135deg, ${T.mauve100}, ${T.mauve200})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 32px ${T.mauve200}`,
          }}>
            <NinhoIcon size={44} color={T.mauve700} />
          </div>
        </motion.div>

        {/* copy */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'center' }}
        >
          <h2 style={{
            fontFamily: Font.h, fontWeight: 700,
            fontSize: 'clamp(1.5rem, 7vw, 1.9rem)',
            letterSpacing: '-0.025em', lineHeight: 1.2,
            color: T.stone900, margin: 0,
          }}>
            {firstName} está no ninho. 🎉<br />Tem mais algum filho?
          </h2>
          <p style={{ fontFamily: Font.b, fontSize: '0.95rem', lineHeight: 1.6, color: T.stone500, margin: 0 }}>
            Com o Ninho Premium você acompanha todas as crianças em um só lugar — com rotinas e históricos separados.
          </p>
        </motion.div>

        {/* actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <button type="button" onClick={onYes} style={{
            height: 56, borderRadius: 100, border: 'none',
            background: `linear-gradient(135deg, ${T.mauve500}, ${T.mauve700})`,
            cursor: 'pointer', fontFamily: Font.h, fontWeight: 700, fontSize: '1rem',
            color: T.white, letterSpacing: '-0.01em',
            boxShadow: `0 6px 20px ${T.mauve500}50`,
            WebkitTapHighlightColor: 'transparent',
          }}>
            Sim, quero adicionar outra criança
          </button>
          <button type="button" onClick={onNo} style={{
            height: 52, borderRadius: 100,
            border: `1.5px solid ${T.stone200}`, background: T.white,
            cursor: 'pointer', fontFamily: Font.b, fontWeight: 600, fontSize: '0.95rem',
            color: T.stone700, WebkitTapHighlightColor: 'transparent',
          }}>
            Não, por agora só {firstName}
          </button>
        </motion.div>
      </main>
    </motion.div>
  );
}

// ─── premium wall (múltiplas crianças) ───────────────────────────────────────

const MULTI_CHILD_FEATURES = [
  { emoji: '👶', title: 'Múltiplas crianças', desc: 'Perfis separados, histórico individual, rotinas independentes.' },
  { emoji: '👥', title: 'Rede de cuidadores', desc: 'Parceiro(a), avó, babá e pediatra — todos acompanham juntos.' },
  { emoji: '📋', title: 'Relatório médico', desc: 'Compartilhe o diário de saúde com o pediatra em um toque.' },
  { emoji: '🔔', title: 'Lembretes inteligentes', desc: 'Vacinas, consultas e marcos de desenvolvimento no momento certo.' },
];

function PremiumWallScreen({ onUpgrade, onDismiss }: { onUpgrade: () => void; onDismiss: () => void }) {
  return (
    <motion.div
      key="premium_wall"
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        minHeight: '100svh',
        background: `radial-gradient(ellipse 130% 60% at 50% -5%, ${T.mauve200}, ${T.white})`,
        display: 'flex', flexDirection: 'column',
        paddingTop: 'calc(env(safe-area-inset-top) + 20px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)',
        overflowY: 'auto',
      }}
    >
      {/* header */}
      <header style={{ paddingInline: 24, paddingBottom: 16 }}>
        <NinhoWordmark height={20} color={T.mauve700} />
      </header>

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        paddingInline: 24, gap: 28, maxWidth: 460, width: '100%', alignSelf: 'center',
      }}>
        {/* crown + badge */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: `linear-gradient(135deg, ${T.amber200}, #fbbf24)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', boxShadow: '0 8px 32px rgba(245,158,11,0.3)',
          }}>
            👑
          </div>
          <span style={{
            display: 'inline-flex', paddingInline: 14, paddingBlock: 5, borderRadius: 100,
            background: `linear-gradient(135deg, ${T.mauve100}, ${T.mauve200})`,
            fontFamily: Font.b, fontWeight: 700, fontSize: '0.75rem',
            color: T.mauve700, letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            Ninho Premium
          </span>
        </motion.div>

        {/* headline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={{ textAlign: 'center' }}
        >
          <h2 style={{
            fontFamily: Font.h, fontWeight: 700,
            fontSize: 'clamp(1.5rem, 6vw, 1.85rem)',
            letterSpacing: '-0.025em', lineHeight: 1.2,
            color: T.stone900, margin: '0 0 10px',
          }}>
            Acompanhe todos os seus filhos em um só ninho.
          </h2>
          <p style={{ fontFamily: Font.b, fontSize: '0.9rem', lineHeight: 1.6, color: T.stone500, margin: 0 }}>
            Menos dúvida, menos esquecimento — mais segurança no cuidado de cada um.
          </p>
        </motion.div>

        {/* features */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{
            borderRadius: 20, border: `1.5px solid ${T.mauve200}`,
            background: T.white, padding: '20px 20px 16px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}
        >
          {MULTI_CHILD_FEATURES.map(f => (
            <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span style={{ fontSize: '1.3rem', lineHeight: 1, marginTop: 2, flexShrink: 0 }} aria-hidden="true">{f.emoji}</span>
              <div>
                <p style={{ fontFamily: Font.b, fontWeight: 700, fontSize: '0.875rem', color: T.stone900, margin: '0 0 2px' }}>{f.title}</p>
                <p style={{ fontFamily: Font.b, fontSize: '0.8rem', color: T.stone500, margin: 0, lineHeight: 1.4 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <button type="button" onClick={onUpgrade} style={{
            height: 56, borderRadius: 100, border: 'none',
            background: `linear-gradient(135deg, ${T.amber500}, #d97706)`,
            cursor: 'pointer', fontFamily: Font.h, fontWeight: 700, fontSize: '1rem',
            color: T.white, letterSpacing: '-0.01em',
            boxShadow: '0 6px 20px rgba(245,158,11,0.4)',
            WebkitTapHighlightColor: 'transparent',
          }}>
            Experimentar grátis por 7 dias
          </button>
          <p style={{ fontFamily: Font.b, fontSize: '0.78rem', color: T.stone400, textAlign: 'center', margin: 0 }}>
            R$19,90/mês ou R$149/ano · cancela a qualquer hora
          </p>
          <button type="button" onClick={onDismiss} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: Font.b, fontSize: '0.85rem', color: T.stone400,
            textAlign: 'center', padding: '4px 0',
            WebkitTapHighlightColor: 'transparent',
          }}>
            Continuar com um filho por agora →
          </button>
        </motion.div>
      </main>
    </motion.div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ChildPage() {
  const store = useNinhoStore();
  const isPregnancy = store.onboardingMode === 'pregnancy';

  const [phase,     setPhase]     = useState<Phase>('form');
  const [name,      setName]      = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex,       setSex]       = useState<Sex | undefined>();
  const [touched,   setTouched]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [apiError,  setApiError]  = useState<string | null>(null);

  const trimmedName = name.trim();
  const showAha     = trimmedName.length >= 2;
  const nameError   = touched && trimmedName.length < 1
    ? 'O nome é necessário para personalizar a experiência'
    : null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (trimmedName.length < 1) return;

    const familyId = store.currentFamily?.id;
    if (!familyId) {
      toast.error('Família não encontrada. Reinicie o processo.');
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const { data: child, error: sbErr } = await supabase
        .from('children')
        .insert({
          family_id:      familyId,
          preferred_name: trimmedName,
          birth_date:     birthDate || null,
          sex_at_birth:   sex ?? 'other',
        })
        .select()
        .single();

      if (sbErr) throw sbErr;

      store.setChildren([child as any]);
      store.setCurrentChild(child as any);
      setPhase('more_child'); // ← não avança direto; pergunta sobre mais filhos
    } catch (err: any) {
      setApiError(err?.message ?? 'Não foi possível registrar o bebê. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function goToCopilots() {
    store.setAppState('onboarding_copilots');
  }

  function handleUpgrade() {
    store.setSubscription('premium');
    goToCopilots();
  }

  // ── phases ───────────────────────────────────────────────────────────────

  if (phase === 'more_child') {
    return (
      <AnimatePresence mode="wait">
        <MoreChildScreen
          babyName={trimmedName}
          onYes={() => setPhase('premium_wall')}
          onNo={goToCopilots}
        />
      </AnimatePresence>
    );
  }

  if (phase === 'premium_wall') {
    return (
      <AnimatePresence mode="wait">
        <PremiumWallScreen onUpgrade={handleUpgrade} onDismiss={goToCopilots} />
      </AnimatePresence>
    );
  }

  // ── form ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100svh', background: T.white,
      display: 'flex', flexDirection: 'column',
      paddingTop: 'calc(env(safe-area-inset-top) + 20px)',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
    }}>

      {/* ── header ──────────────────────────────────────────────────────────── */}
      <header style={{ paddingInline: 24, paddingBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <StepDots current={3} total={3} />
        <NinhoWordmark height={18} color={T.mauve500} />
      </header>

      {/* ── hero ────────────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingInline: 24, paddingBottom: 28 }}
      >
        <span aria-hidden="true" style={{ fontSize: '3.75rem', lineHeight: 1, userSelect: 'none' }}>
          {isPregnancy ? '🤰' : '🍼'}
        </span>
        <h1 style={{
          fontFamily: Font.h, fontWeight: 700,
          fontSize: 'clamp(1.75rem, 7vw, 2.2rem)',
          letterSpacing: '-0.025em', lineHeight: 1.15,
          color: T.stone900, margin: 0,
        }}>
          {isPregnancy ? 'Qual é o nome escolhido?' : 'Como se chama seu bebê?'}
        </h1>
        <p style={{ fontFamily: Font.b, fontSize: '0.975rem', lineHeight: 1.6, color: T.stone500, margin: 0 }}>
          {isPregnancy
            ? 'Pode ser o nome que vocês escolheram — ou um apelido por enquanto.'
            : 'Só o nome e a data de nascimento — o resto você preenche depois.'}
        </p>
      </motion.section>

      {/* ── divisor ─────────────────────────────────────────────────────────── */}
      <div aria-hidden="true" style={{ height: 1, background: T.stone100, marginInline: 24 }} />

      {/* ── form ────────────────────────────────────────────────────────────── */}
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        paddingInline: 24, paddingTop: 28,
        maxWidth: 420, width: '100%', alignSelf: 'center', gap: 16,
      }}>
        <form onSubmit={handleCreate} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* nome */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="child-name"
              style={{ fontFamily: Font.b, fontWeight: 600, fontSize: '0.85rem', color: T.stone700 }}
            >
              {isPregnancy ? 'Nome escolhido' : 'Nome do bebê'}
            </label>
            <div style={{
              height: 56, borderRadius: 16, background: T.stone50,
              border: `1.5px solid ${nameError ? '#dfb9b4' : touched && trimmedName.length > 0 ? T.sage300 : T.stone200}`,
              display: 'flex', alignItems: 'center', paddingInline: 18,
              transition: 'border-color 200ms',
            }}>
              <input
                id="child-name" type="text" placeholder="Mateus, Lara, Sofia…"
                value={name} autoFocus autoComplete="off"
                onChange={e => { setName(e.target.value); setTouched(false); setApiError(null); }}
                onBlur={() => setTouched(true)} disabled={loading}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: Font.b, fontSize: 15, color: T.stone900 }}
              />
            </div>
            <AnimatePresence>
              {nameError && (
                <motion.p key="name-err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ fontFamily: Font.b, fontSize: 13, color: '#a74235', margin: 0, paddingLeft: 4 }}
                >
                  {nameError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* aha! moment */}
          <AnimatePresence>
            {showAha && <AhaMoment name={name} isPregnancy={isPregnancy} />}
          </AnimatePresence>

          {/* data */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="birth-date"
              style={{ fontFamily: Font.b, fontWeight: 600, fontSize: '0.85rem', color: T.stone700 }}
            >
              {isPregnancy ? 'Previsão de nascimento' : 'Data de nascimento'}
            </label>
            <div style={{
              height: 56, borderRadius: 16, background: T.stone50,
              border: `1.5px solid ${T.stone200}`,
              display: 'flex', alignItems: 'center', paddingInline: 18,
            }}>
              <input
                id="birth-date" type="date" value={birthDate}
                onChange={e => setBirthDate(e.target.value)} disabled={loading}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: Font.b, fontSize: 15, color: birthDate ? T.stone900 : T.stone300 }}
              />
            </div>
            <p style={{ fontFamily: Font.b, fontSize: '0.8rem', color: T.stone300, margin: 0, paddingLeft: 4 }}>
              {isPregnancy
                ? 'Usamos isso para acompanhar o desenvolvimento pré-natal.'
                : 'Usamos isso para os insights de crescimento.'}
            </p>
          </div>

          <SexPicker value={sex} onChange={setSex} />

          {/* api error */}
          <AnimatePresence>
            {apiError && (
              <motion.div key="api-err" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                role="alert"
                style={{ borderRadius: 14, padding: '12px 16px', background: T.clay50, border: `1px solid ${T.clay200}` }}
              >
                <p style={{ fontFamily: Font.b, fontSize: 13, color: T.clay800, margin: 0 }}>{apiError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* submit */}
          <motion.button type="submit" disabled={loading} whileTap={!loading ? { scale: 0.975 } : {}}
            style={{
              height: 56, borderRadius: 100, border: 'none',
              background: `linear-gradient(135deg, ${T.mauve500}, ${T.mauve700})`,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: Font.h, fontWeight: 700, fontSize: '1rem',
              color: T.white, letterSpacing: '-0.01em',
              boxShadow: `0 6px 20px ${T.mauve500}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              WebkitTapHighlightColor: 'transparent',
              opacity: loading ? 0.85 : 1, transition: 'opacity 0.2s',
            } as React.CSSProperties}
          >
            {loading ? <Spinner /> : null}
            {loading ? 'Criando o ninho…' : 'Salvar e continuar →'}
          </motion.button>
        </form>

        <p style={{ fontFamily: Font.b, fontSize: 13, color: T.stone300, textAlign: 'center', margin: 0 }}>
          {isPregnancy ? '🌱 Vamos preparar tudo para a chegada.' : '✨ Em segundos, o painel de cuidados estará pronto.'}
        </p>
      </main>
    </div>
  );
}
