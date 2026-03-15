import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserGroupIcon } from '@heroicons/react/24/outline';

export default function FamilyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [familyName, setFamilyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError('');
    setLoading(true);

    try {
      // 1 — Create the family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({ name: familyName.trim(), owner_id: user.id })
        .select('id')
        .single();

      if (familyError) throw familyError;

      // 2 — Add owner as admin membership
      const { error: memberError } = await supabase
        .from('memberships')
        .insert({ family_id: family.id, user_id: user.id, role: 'admin' });

      if (memberError) throw memberError;

      // 3 — Store family_id in sessionStorage for the next onboarding step
      sessionStorage.setItem('onboarding_family_id', family.id);
      navigate('/onboarding/child');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar família');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col px-5 py-8"
      style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}
    >
      {/* Step indicator */}
      <div className="flex gap-1.5 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className="h-1 rounded-full flex-1 transition-all"
            style={{
              backgroundColor: s === 1 ? 'hsl(var(--ninho-sage))' : 'hsl(var(--border))',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col"
      >
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
          style={{ backgroundColor: 'hsl(var(--accent))' }}
        >
          <UserGroupIcon className="w-7 h-7" style={{ color: 'hsl(var(--ninho-sage))' }} />
        </div>

        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: 'Quicksand, sans-serif', color: 'hsl(var(--ninho-brown))' }}
        >
          Criar sua família
        </h1>
        <p
          className="text-sm mb-8"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
        >
          Dê um nome ao seu grupo familiar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
          <div className="space-y-1.5">
            <Label
              className="text-xs font-semibold"
              style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
            >
              Nome da família
            </Label>
            <Input
              type="text"
              value={familyName}
              onChange={e => setFamilyName(e.target.value)}
              placeholder="Família Silva"
              required
              className="h-12 rounded-2xl border-border"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            />
          </div>

          {error && (
            <p className="text-xs text-destructive font-medium" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {error}
            </p>
          )}

          <div className="flex-1" />

          <Button
            type="submit"
            disabled={loading || !familyName.trim()}
            className="w-full rounded-2xl text-sm font-bold"
            style={{
              height: '52px',
              backgroundColor: 'hsl(var(--ninho-sage))',
              color: 'white',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            {loading ? 'Criando...' : 'Continuar'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
