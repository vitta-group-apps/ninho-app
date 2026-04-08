/**
 * NINHO — ChildPage (Onboarding Passo 2)
 * Regista a primeira criança da família.
 * Insere em `children`.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast }     from 'sonner';
import { Text }      from '@/design-system/components/ui/Text';
import { Button }    from '@/design-system/components/ui/Button';
import { TextInput } from '@/design-system/components/ui/TextInput';
import { supabase }  from '@/lib/supabase';
import { useNinhoStore } from '@/store/useNinhoStore';
import { cn } from '@/design-system/lib/utils';

// ─── pill selector (sexo) ────────────────────────────────────────────────────

type Sex = 'male' | 'female' | 'other';

const SEX_OPTIONS: { value: Sex; label: string; emoji: string }[] = [
  { value: 'male',   label: 'Menino', emoji: '👦' },
  { value: 'female', label: 'Menina', emoji: '👧' },
  { value: 'other',  label: 'Outro',  emoji: '🧒' },
];

export default function ChildPage() {
  const store = useNinhoStore();
  const [name,      setName]      = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex,       setSex]       = useState<Sex | undefined>();
  const [loading,   setLoading]   = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const preferred_name = name.trim();
    if (!preferred_name) return;

    const familyId = store.currentFamily?.id;
    if (!familyId) { toast.error('Família não encontrada.'); return; }

    setLoading(true);
    try {
      const { data: child, error: sbErr } = await supabase
        .from('children')
        .insert({
          family_id:      familyId,
          preferred_name,
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
      toast.error(err?.message ?? 'Erro ao registar criança.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm"
      >
        {/* brand */}
        <div className="flex flex-col items-center gap-[var(--gap-sm)] mb-10">
          <span className="text-5xl leading-none select-none" aria-hidden="true">🍼</span>
          <div className="text-center">
            <Text variant="h2" className="font-heading">O teu bebé</Text>
            <Text variant="body-md-regular" color="secondary">Apresenta-nos o novo membro da família!</Text>
          </div>
        </div>

        {/* form card */}
        <div className="bg-ds-pure-white rounded-[var(--radius-xl)] shadow-ds-md px-6 py-8">
          <form onSubmit={handleCreate} className="flex flex-col gap-[var(--gap-md)]">

            <TextInput
              label="Nome preferido"
              placeholder="Ex: Mateus, Lara, Bebé…"
              value={name}
              onChange={e => setName(e.target.value)}
              size="md"
              fullWidth
              autoFocus
            />

            <TextInput
              label="Data de nascimento"
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              size="md"
              fullWidth
              hint="Opcional — podes adicionar mais tarde"
            />

            {/* sexo pill group */}
            <div className="flex flex-col gap-[var(--gap-xs)]">
              <Text variant="caption-medium" color="secondary" as="span">Sexo</Text>
              <div className="flex gap-[var(--gap-sm)]">
                {SEX_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setSex(o.value)}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-1 py-[var(--padding-sm)]',
                      'rounded-[var(--radius-sm)] border font-body text-text-sm font-medium',
                      'transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent-tint',
                      sex === o.value
                        ? 'bg-ds-accent-subtle-2 border-ds-accent-tint text-ds-accent-fg'
                        : 'bg-ds-neutral-subtle border-ds-neutral-border text-ds-neutral-fg-strong',
                    )}
                  >
                    <span className="text-xl">{o.emoji}</span>
                    <span>{o.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              label="Começar a usar o Ninho"
              variant="primary"
              size="md"
              fullWidth
              loading={loading}
              disabled={loading || name.trim().length < 1}
            />
          </form>
        </div>

        <div className="mt-4 flex items-center justify-center">
          <Text variant="caption-regular" color="secondary" className="opacity-60">Passo 2 de 2</Text>
        </div>
      </motion.div>
    </div>
  );
}
