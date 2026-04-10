/**
 * NINHO — ChildPage v3 · Passo 3 de 3
 * Zero dependências do DS — tokens brutos + Framer Motion.
 *
 * Conectividade de estado:
 *   store.onboardingMode ('pregnancy' | 'newborn') → altera headline, emoji,
 *   labels e copy de suporte em tempo real — contexto persistido pelo Zustand.
 *
 * Feedback reativo: ao digitar o nome o Aha! moment usa o firstName inline.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useNinhoStore } from '@/store/useNinhoStore';

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
  stone50:  '#f8f7f7',
  stone100: '#eeedec',
  stone200: '#e2e0df',
  stone300: '#ceccca',
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

// ─── step dots ────────────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
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
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      style={{
        width: 16, height: 16, borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.35)',
        borderTopColor: '#ffffff', flexShrink: 0,
      }}
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
        <span style={{ fontFamily: Font.b, fontWeight: 600, fontSize: '0.85rem', color: T.stone700 }}>
          Sexo
        </span>
        <span style={{ fontFamily: Font.b, fontSize: '0.8rem', color: T.stone300 }}>
          (opcional)
        </span>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {SEX_OPTIONS.map(o => {
          const selected = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(o.value)}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                paddingBlock: 14,
                borderRadius: 16,
                border: `1.5px solid ${selected ? T.mauve300 : T.stone200}`,
                background: selected ? T.mauve50 : T.stone50,
                cursor: 'pointer', outline: 'none',
                fontFamily: Font.b, fontWeight: selected ? 700 : 500,
                fontSize: '0.875rem',
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
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28 }}
      role="status"
      aria-live="polite"
      style={{
        borderRadius: 14, padding: '12px 16px',
        background: isPregnancy ? T.mauve50 : T.sage100,
        border: `1px solid ${isPregnancy ? T.mauve200 : T.sage300}`,
      }}
    >
      <p style={{
        fontFamily: Font.b, fontSize: 14,
        color: isPregnancy ? T.mauve700 : T.sage500,
        margin: 0,
      }}>
        {isPregnancy
          ? `✨ Que nome lindo! Vamos preparar tudo para a chegada de ${firstName}.`
          : `✨ Que nome lindo! Vamos organizar o mundo para ${firstName}.`}
      </p>
    </motion.div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ChildPage() {
  const store = useNinhoStore();
  const isPregnancy = store.onboardingMode === 'pregnancy';

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
      store.setAppState('onboarding_copilots');
    } catch (err: any) {
      setApiError(err?.message ?? 'Não foi possível registrar o bebê. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100svh', background: T.white,
      display: 'flex', flexDirection: 'column',
      paddingTop: 'calc(env(safe-area-inset-top) + 20px)',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
    }}>

      {/* ── header ──────────────────────────────────────────────────────────── */}
      <header style={{ paddingInline: 24, paddingBottom: 12 }}>
        <StepDots current={3} total={3} />
      </header>

      {/* ── hero ────────────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          display: 'flex', flexDirection: 'column', gap: 12,
          paddingInline: 24, paddingBottom: 28,
        }}
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
        <p style={{
          fontFamily: Font.b, fontSize: '0.975rem', lineHeight: 1.6,
          color: T.stone500, margin: 0,
        }}>
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
                id="child-name"
                type="text"
                placeholder="Mateus, Lara, Sofia…"
                value={name}
                autoFocus
                autoComplete="off"
                onChange={e => { setName(e.target.value); setTouched(false); setApiError(null); }}
                onBlur={() => setTouched(true)}
                disabled={loading}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontFamily: Font.b, fontSize: 15, color: T.stone900,
                }}
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
                id="birth-date"
                type="date"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                disabled={loading}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontFamily: Font.b, fontSize: 15, color: birthDate ? T.stone900 : T.stone300,
                }}
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
          <motion.button
            type="submit"
            disabled={loading}
            whileTap={!loading ? { scale: 0.975 } : {}}
            style={{
              height: 56, borderRadius: 100, border: 'none',
              background: `linear-gradient(135deg, ${T.mauve500}, ${T.mauve700})`,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: Font.h, fontWeight: 700, fontSize: '1rem',
              color: T.white, letterSpacing: '-0.01em',
              boxShadow: `0 6px 20px ${T.mauve500}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              WebkitTapHighlightColor: 'transparent',
              opacity: loading ? 0.85 : 1,
              transition: 'opacity 0.2s',
            } as React.CSSProperties}
          >
            {loading ? <Spinner /> : null}
            {loading ? 'Criando o ninho…' : 'Entrar no ninho 🪺'}
          </motion.button>
        </form>

        <p style={{ fontFamily: Font.b, fontSize: 13, color: T.stone300, textAlign: 'center', margin: 0 }}>
          {isPregnancy ? '🌱 Vamos preparar tudo para a chegada.' : '✨ Em segundos, o painel de cuidados estará pronto.'}
        </p>
      </main>
    </div>
  );
}
