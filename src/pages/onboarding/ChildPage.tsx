/**
 * NINHO — ChildPage (Onboarding Passo 2 de 2)
 * Agentes: ZEUS (Pure White) · LUMEN (copy PT-BR afetivo) · MINERVA (só o essencial)
 *          ATLAS: birth_date é o ponto de partida dos insights de crescimento
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast }     from 'sonner';
import { Text }      from '@/design-system/components/ui/Text';
import { Button }    from '@/design-system/components/ui/Button';
import { TextInput } from '@/design-system/components/ui/TextInput';
import { supabase }  from '@/lib/supabase';
import { useNinhoStore } from '@/store/useNinhoStore';
import { cn } from '@/design-system/lib/utils';

// ─── progress dots ────────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div
      className="flex items-center gap-[var(--gap-xs)]"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Passo ${current} de ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={[
            'rounded-full transition-all duration-300',
            i + 1 === current
              ? 'w-[var(--gap-lg)] h-[var(--gap-xs)] bg-ds-accent-tint'
              : i + 1 < current
              ? 'w-[var(--gap-xs)] h-[var(--gap-xs)] bg-ds-accent-fg'
              : 'w-[var(--gap-xs)] h-[var(--gap-xs)] bg-ds-neutral-border',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

// ─── sex pill selector ────────────────────────────────────────────────────────

type Sex = 'male' | 'female' | 'other';

const SEX_OPTIONS: { value: Sex; emoji: string; label: string }[] = [
  { value: 'male',   emoji: '👦', label: 'Menino' },
  { value: 'female', emoji: '👧', label: 'Menina' },
  { value: 'other',  emoji: '🧒', label: 'Outro'  },
];

function SexPicker({ value, onChange }: { value?: Sex; onChange: (v: Sex) => void }) {
  return (
    <div className="flex flex-col gap-[var(--gap-xs)]">
      <Text variant="caption-medium" color="secondary" as="label">
        Sexo{' '}
        <Text variant="caption-regular" color="secondary" as="span">(opcional)</Text>
      </Text>
      <div className="flex gap-[var(--gap-sm)]">
        {SEX_OPTIONS.map(o => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex-1 flex flex-col items-center gap-[var(--gap-xxs)]',
              'py-[var(--padding-sm)] rounded-[var(--radius-sm)] border',
              'font-body text-text-sm font-medium',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-ds-accent-tint focus-visible:ring-offset-1',
              value === o.value
                ? 'bg-ds-accent-subtle-2 border-ds-accent-tint text-ds-accent-fg'
                : 'bg-ds-neutral-subtle border-ds-neutral-border text-ds-neutral-fg-strong',
            )}
          >
            <span className="text-xl leading-none" aria-hidden="true">{o.emoji}</span>
            <span>{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

// ─── aha! moment banner ───────────────────────────────────────────────────────

function AhaMoment({ name }: { name: string }) {
  const firstName = name.trim().split(' ')[0];
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-[var(--radius-lg)] px-[var(--padding-md)] py-[var(--padding-sm)] bg-ds-accent-subtle"
      role="status"
      aria-live="polite"
    >
      <Text variant="body-md-regular" as="p">
        ✨ Que nome lindo! Vamos organizar o mundo para{' '}
        <span className="font-semibold text-ds-accent-fg">{firstName}</span>.
      </Text>
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

  const trimmedName  = name.trim();
  const showAha      = trimmedName.length >= 2;

  const nameError = touched && trimmedName.length < 1
    ? 'O nome é necessário para personalizar a experiência'
    : null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (name.trim().length < 1) return;

    const familyId = store.currentFamily?.id;
    if (!familyId) {
      toast.error('Família não encontrada. Reinicie o processo.');
      return;
    }

    setLoading(true);
    try {
      const { data: child, error: sbErr } = await supabase
        .from('children')
        .insert({
          family_id:      familyId,
          preferred_name: name.trim(),
          birth_date:     birthDate || null,
          sex_at_birth:   sex ?? 'other',
        })
        .select()
        .single();

      if (sbErr) throw sbErr;

      store.setChildren([child as any]);
      store.setCurrentChild(child as any);
      store.setAppState('dashboard');
    } catch (err: any) {
      toast.error(err?.message ?? 'Não foi possível registrar o bebê. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-ds-pure-white flex flex-col"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}
    >

      {/* ── header: só os dots ────────────────────────────────────────────── */}
      <header className="flex items-center px-[var(--padding-lg)] pb-[var(--padding-md)]">
        <StepDots current={3} total={3} />
      </header>

      {/* ── hero ──────────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-col gap-[var(--gap-md)] px-[var(--padding-lg)] pb-[var(--padding-xl)]"
      >
        {/* emoji âncora */}
        <span
          className="leading-none select-none"
          aria-hidden="true"
          style={{ fontSize: '4rem', lineHeight: 1 }}
        >
          {isPregnancy ? '🤰' : '🍼'}
        </span>

        <div className="flex flex-col gap-[var(--gap-sm)]">
          <Text variant="h1" className="font-heading tracking-tight">
            {isPregnancy ? 'Qual é o nome escolhido?' : 'Como se chama seu bebê?'}
          </Text>
          <Text variant="body-md-regular" color="secondary">
            {isPregnancy
              ? 'Pode ser o nome que vocês já escolheram — ou um apelido carinhoso por enquanto.'
              : 'Só precisamos do nome e a data de nascimento — o resto você preenche depois, no seu tempo.'}
          </Text>
        </div>
      </motion.section>

      {/* ── divisor ───────────────────────────────────────────────────────── */}
      <div className="h-px bg-ds-neutral-border mx-[var(--padding-lg)]" aria-hidden="true" />

      {/* ── form ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col px-[var(--padding-lg)] py-[var(--padding-xl)] max-w-sm w-full mx-auto gap-[var(--gap-md)]">
        <form onSubmit={handleCreate} noValidate className="flex flex-col gap-[var(--gap-md)]">

          <TextInput
            label={isPregnancy ? 'Nome escolhido' : 'Nome do bebê'}
            placeholder="Mateus, Lara, Sofia..."
            value={name}
            onChange={e => { setName(e.target.value); setTouched(false); }}
            onBlur={() => setTouched(true)}
            error={nameError ?? undefined}
            size="md"
            fullWidth
            autoFocus
          />

          {/* Aha! Moment — Lumen: "Que nome lindo! Vamos organizar o mundo para [Nome]" */}
          <AnimatePresence>
            {showAha && <AhaMoment name={name} />}
          </AnimatePresence>

          <TextInput
            label={isPregnancy ? 'Previsão de nascimento' : 'Data de nascimento'}
            type="date"
            value={birthDate}
            onChange={e => setBirthDate(e.target.value)}
            size="md"
            fullWidth
            hint={isPregnancy
              ? 'Usamos isso para acompanhar o desenvolvimento pré-natal.'
              : 'Usamos isso para os insights de crescimento.'}
          />

          <SexPicker value={sex} onChange={setSex} />

          <Button
            type="submit"
            label="Entrar no ninho 🪺"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading}
          />
        </form>

        <Text variant="caption-regular" color="secondary" className="text-center">
          {isPregnancy
            ? '🌱 Vamos preparar tudo para a chegada.'
            : '✨ Em segundos, o painel de cuidados estará pronto.'}
        </Text>
      </main>
    </div>
  );
}
