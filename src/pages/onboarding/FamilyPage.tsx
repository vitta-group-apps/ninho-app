/**
 * NINHO — FamilyPage (Onboarding Passo 1)
 * Cria a família após o primeiro login.
 * Insere em `families` + `family_members`.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast }     from 'sonner';
import { Text }      from '@/design-system/components/ui/Text';
import { Button }    from '@/design-system/components/ui/Button';
import { TextInput } from '@/design-system/components/ui/TextInput';
import { supabase }  from '@/lib/supabase';
import { useNinhoStore } from '@/store/useNinhoStore';

export default function FamilyPage() {
  const store = useNinhoStore();
  const [familyName, setFamilyName] = useState('');
  const [loading,    setLoading]    = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = familyName.trim();
    if (!name) return;

    setLoading(true);
    try {
      const userId = store.profile?.id;
      if (!userId) throw new Error('Utilizador não encontrado.');

      // 1. Cria família
      const { data: family, error: famErr } = await supabase
        .from('families')
        .insert({ name, owner_user_id: userId })
        .select()
        .single();

      if (famErr) throw famErr;

      // 2. Adiciona owner como membro
      await supabase
        .from('family_members')
        .insert({ family_id: family.id, user_id: userId, role: 'owner' });

      store.setCurrentFamily({ id: family.id, name: family.name });
      store.setAppState('onboarding_child');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao criar família.');
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
          <span className="text-5xl leading-none select-none" aria-hidden="true">🪺</span>
          <div className="text-center">
            <Text variant="h2" className="font-heading">O teu ninho</Text>
            <Text variant="body-md-regular" color="secondary">Como se chama a tua família?</Text>
          </div>
        </div>

        {/* form card */}
        <div className="bg-ds-pure-white rounded-[var(--radius-xl)] shadow-ds-md px-6 py-8">
          <form onSubmit={handleCreate} className="flex flex-col gap-[var(--gap-md)]">
            <TextInput
              label="Nome da família"
              placeholder="Ex: Família Silva"
              value={familyName}
              onChange={e => setFamilyName(e.target.value)}
              size="md"
              fullWidth
              autoFocus
            />
            <Button
              type="submit"
              label="Criar família"
              variant="primary"
              size="md"
              fullWidth
              loading={loading}
              disabled={loading || familyName.trim().length < 2}
            />
          </form>
        </div>

        <div className="mt-4 flex items-center justify-center">
          <Text variant="caption-regular" color="secondary" className="opacity-60">Passo 1 de 2</Text>
        </div>
      </motion.div>
    </div>
  );
}
