/**
 * NINHO — FamilyPage (Onboarding Passo 1 de 2)
 * Agentes: ZEUS (Pure White) · LUMEN (copy acolhedor) · MINERVA (zero atrito)
 *          LEX (RLS: family criada com owner_user_id do utilizador autenticado)
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast }     from 'sonner';
import { Text }      from '@/design-system/components/ui/Text';
import { Button }    from '@/design-system/components/ui/Button';
import { TextInput } from '@/design-system/components/ui/TextInput';
import { supabase }  from '@/lib/supabase';
import { useNinhoStore } from '@/store/useNinhoStore';

// ─── progress dots (MINERVA: orientação visual sem texto denso) ───────────────

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

// ─── page ─────────────────────────────────────────────────────────────────────

export default function FamilyPage() {
  const store = useNinhoStore();
  const [familyName, setFamilyName] = useState('');
  const [touched,    setTouched]    = useState(false);
  const [loading,    setLoading]    = useState(false);

  const nameError = touched && familyName.trim().length < 2
    ? 'Escolhe um nome com pelo menos 2 letras'
    : null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (familyName.trim().length < 2) return;

    setLoading(true);
    try {
      const userId = store.profile?.id;
      if (!userId) throw new Error('Sessão expirada. Entra novamente.');

      // LEX: owner_user_id garante que o RLS associa a família ao utilizador certo
      const { data: family, error: famErr } = await supabase
        .from('families')
        .insert({ name: familyName.trim(), owner_user_id: userId })
        .select()
        .single();

      if (famErr) throw famErr;

      // Adiciona owner como membro com papel de administrador
      await supabase
        .from('family_members')
        .insert({ family_id: family.id, user_id: userId, role: 'owner' });

      store.setCurrentFamily({ id: family.id, name: family.name });
      store.setAppState('onboarding_child');
    } catch (err: any) {
      toast.error(err?.message ?? 'Não foi possível criar a família. Tenta de novo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ds-pure-white flex flex-col">

      {/* ── header com progress ───────────────────────────────────────── */}
      <header className="flex items-center justify-between px-[var(--padding-lg)] pt-[var(--padding-xl)] pb-[var(--padding-md)]">
        <StepDots current={1} total={2} />
        <Text variant="caption-regular" color="secondary" as="span">Passo 1 de 2</Text>
      </header>

      {/* ── hero ──────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col gap-[var(--gap-sm)] px-[var(--padding-lg)] pb-[var(--padding-xl)]"
      >
        <span className="text-5xl leading-none select-none" aria-hidden="true">🏡</span>
        <div className="flex flex-col gap-[var(--gap-xs)]">
          <Text variant="h2" className="font-heading">O vosso espaço</Text>
          <Text variant="body-md-regular" color="secondary">
            Deem um nome ao vosso lar digital.{' '}
            Pode ser o apelido da família, um apelido carinhoso — o que fizer sentido para vocês.
          </Text>
        </div>
      </motion.section>

      {/* ── divisor ───────────────────────────────────────────────────── */}
      <div className="h-px bg-ds-neutral-border mx-[var(--padding-lg)]" aria-hidden="true" />

      {/* ── form ──────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col px-[var(--padding-lg)] py-[var(--padding-xl)] max-w-sm w-full mx-auto gap-[var(--gap-md)]">
        <form onSubmit={handleCreate} noValidate className="flex flex-col gap-[var(--gap-md)]">
          <TextInput
            label="Nome da família"
            placeholder="Ex: Família Silva · Clã dos Fonseca · Casa Mágica…"
            value={familyName}
            onChange={e => { setFamilyName(e.target.value); setTouched(false); }}
            onBlur={() => setTouched(true)}
            error={nameError ?? undefined}
            size="md"
            fullWidth
            autoFocus
            hint="Podem mudar isto mais tarde nas definições."
          />

          <Button
            type="submit"
            label="Criar o nosso lar"
            variant="primary"
            size="md"
            fullWidth
            loading={loading}
            disabled={loading}
          />
        </form>

        {/* MINERVA: reassurance copy para reduzir ansiedade de decisão */}
        <Text variant="caption-regular" color="secondary" className="text-center">
          🔒 Só vocês e os cuidadores que convidarem terão acesso.
        </Text>
      </main>
    </div>
  );
}
