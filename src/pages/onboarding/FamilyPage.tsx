/**
 * NINHO — FamilyPage v3 · Passo 2 de 3
 * Zero dependências do DS — apenas tokens brutos + Framer Motion.
 * Lumen: "Vamos criar o lar do bebê" — acolhedor, sem burocracia.
 * Minerva: input único, botão grande, reassurance copy embaixo.
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
  sage300:  '#b8dbcd',
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
        const filled   = i + 1 < current;
        const active   = i + 1 === current;
        return (
          <div
            key={i}
            style={{
              height: 8,
              width: active ? 24 : 8,
              borderRadius: 100,
              background: filled || active ? T.mauve500 : T.stone200,
              transition: 'width 0.3s ease, background 0.3s ease',
            }}
          />
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
        borderTopColor: '#ffffff',
        flexShrink: 0,
      }}
    />
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function FamilyPage() {
  const store = useNinhoStore();
  const [familyName, setFamilyName] = useState('');
  const [touched,    setTouched]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [apiError,   setApiError]   = useState<string | null>(null);

  const trimmed   = familyName.trim();
  const nameError = touched && trimmed.length < 2
    ? 'Escolha um nome com pelo menos 2 letras'
    : null;
  const isValid   = trimmed.length >= 2;
  // Aha! moment — assim que digita algo bonito
  const showAha   = trimmed.length >= 3;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;

    const userId = store.profile?.id;
    if (!userId) {
      toast.error('Sessão expirada. Entre novamente.');
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const { data: family, error: famErr } = await supabase
        .from('families')
        .insert({ name: trimmed, owner_user_id: userId })
        .select()
        .single();

      if (famErr) throw famErr;

      await supabase
        .from('family_members')
        .insert({ family_id: family.id, user_id: userId, role: 'owner' });

      store.setCurrentFamily({ id: family.id, name: family.name });
      store.setAppState('onboarding_child');
    } catch (err: any) {
      setApiError(err?.message ?? 'Não foi possível criar a família. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100svh',
        background: T.white,
        display: 'flex', flexDirection: 'column',
        paddingTop: 'calc(env(safe-area-inset-top) + 20px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
      }}
    >

      {/* ── header: step dots ───────────────────────────────────────────────── */}
      <header style={{ paddingInline: 24, paddingBottom: 12 }}>
        <StepDots current={2} total={3} />
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
        <span
          aria-hidden="true"
          style={{ fontSize: '3.75rem', lineHeight: 1, userSelect: 'none' }}
        >
          🏡
        </span>
        <h1 style={{
          fontFamily: Font.h, fontWeight: 700,
          fontSize: 'clamp(1.75rem, 7vw, 2.2rem)',
          letterSpacing: '-0.025em', lineHeight: 1.15,
          color: T.stone900, margin: 0,
        }}>
          Vamos criar o lar do nosso bebê
        </h1>
        <p style={{
          fontFamily: Font.b, fontWeight: 400,
          fontSize: '0.975rem', lineHeight: 1.6,
          color: T.stone500, margin: 0,
        }}>
          Escolha um nome para a família. Pode ser o sobrenome, um apelido carinhoso
          — o que parecer mais com vocês.
        </p>
      </motion.section>

      {/* ── divisor ─────────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{ height: 1, background: T.stone100, marginInline: 24 }}
      />

      {/* ── form ────────────────────────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        paddingInline: 24, paddingTop: 28,
        maxWidth: 420, width: '100%', alignSelf: 'center',
        gap: 16,
      }}>
        <form onSubmit={handleCreate} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label
              htmlFor="family-name"
              style={{
                fontFamily: Font.b, fontWeight: 600, fontSize: '0.85rem',
                color: T.stone700, letterSpacing: '0.01em',
              }}
            >
              Nome da família
            </label>
            <div style={{
              height: 56, borderRadius: 16,
              background: T.stone50,
              border: `1.5px solid ${nameError ? '#dfb9b4' : touched && isValid ? T.sage300 : T.stone200}`,
              display: 'flex', alignItems: 'center',
              paddingInline: 18,
              transition: 'border-color 200ms',
            }}>
              <input
                id="family-name"
                type="text"
                placeholder="Família Silva, Casa dos Rocha…"
                value={familyName}
                autoFocus
                autoComplete="off"
                onChange={e => { setFamilyName(e.target.value); setTouched(false); setApiError(null); }}
                onBlur={() => setTouched(true)}
                disabled={loading}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontFamily: Font.b, fontSize: 15, color: T.stone900,
                }}
              />
            </div>

            {/* erros / hint */}
            <AnimatePresence>
              {nameError && (
                <motion.p
                  key="name-err"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    fontFamily: Font.b, fontSize: 13,
                    color: '#a74235', margin: 0, paddingLeft: 4,
                  }}
                >
                  {nameError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* aha! moment */}
          <AnimatePresence>
            {showAha && (
              <motion.div
                key="aha"
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
                role="status"
                aria-live="polite"
                style={{
                  borderRadius: 14,
                  padding: '12px 16px',
                  background: T.mauve50,
                  border: `1px solid ${T.mauve200}`,
                }}
              >
                <p style={{ fontFamily: Font.b, fontSize: 14, color: T.mauve700, margin: 0 }}>
                  🏡 Que nome lindo! O ninho da{' '}
                  <strong style={{ color: T.mauve700 }}>{trimmed}</strong>
                  {' '}vai ser incrível.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* api error */}
          <AnimatePresence>
            {apiError && (
              <motion.div
                key="api-err"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                role="alert"
                style={{
                  borderRadius: 14, padding: '12px 16px',
                  background: T.clay50, border: `1px solid ${T.clay200}`,
                }}
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
              background: isValid
                ? `linear-gradient(135deg, ${T.mauve500}, ${T.mauve700})`
                : T.stone100,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: Font.h, fontWeight: 700, fontSize: '1rem',
              color: isValid ? T.white : T.stone500,
              letterSpacing: '-0.01em',
              boxShadow: isValid ? `0 6px 20px ${T.mauve500}50` : 'none',
              transition: 'background 0.25s ease, box-shadow 0.25s ease, color 0.25s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              WebkitTapHighlightColor: 'transparent',
            } as React.CSSProperties}
          >
            {loading ? <Spinner /> : null}
            {loading ? 'Criando…' : 'Criar nossa família →'}
          </motion.button>
        </form>

        {/* reassurance */}
        <p style={{
          fontFamily: Font.b, fontSize: 13, color: T.stone300,
          textAlign: 'center', margin: 0,
        }}>
          🔒 Só você e os cuidadores que convidar terão acesso.
        </p>
      </main>
    </div>
  );
}
