import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FaceSmileIcon } from '@heroicons/react/24/outline';

export default function ChildPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [childName, setChildName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const familyId = sessionStorage.getItem('onboarding_family_id');
    if (!familyId) {
      setError('Família não encontrada. Volte e crie sua família primeiro.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { error: childError } = await supabase
        .from('children')
        .insert({
          family_id: familyId,
          name: childName.trim(),
          birth_date: birthDate,
        });

      if (childError) throw childError;

      // Store child name for the complete screen
      sessionStorage.setItem('onboarding_child_name', childName.trim());
      navigate('/onboarding/complete');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar criança');
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
              backgroundColor: s <= 2 ? 'hsl(var(--ninho-sage))' : 'hsl(var(--border))',
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
          <FaceSmileIcon className="w-7 h-7" style={{ color: 'hsl(var(--ninho-sage))' }} />
        </div>

        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: 'Quicksand, sans-serif', color: 'hsl(var(--ninho-brown))' }}
        >
          Adicionar criança
        </h1>
        <p
          className="text-sm mb-8"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
        >
          Quem é o primeiro membro pequeno da família?
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
          <div className="space-y-1.5">
            <Label
              className="text-xs font-semibold"
              style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
            >
              Nome da criança
            </Label>
            <Input
              type="text"
              value={childName}
              onChange={e => setChildName(e.target.value)}
              placeholder="Lucas"
              required
              className="h-12 rounded-2xl border-border"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            />
          </div>

          <div className="space-y-1.5">
            <Label
              className="text-xs font-semibold"
              style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
            >
              Data de nascimento
            </Label>
            <Input
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]}
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
            disabled={loading || !childName.trim() || !birthDate}
            className="w-full rounded-2xl text-sm font-bold"
            style={{
              height: '52px',
              backgroundColor: 'hsl(var(--ninho-sage))',
              color: 'white',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            {loading ? 'Salvando...' : 'Continuar'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
