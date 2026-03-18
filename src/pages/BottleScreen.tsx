/**
 * BottleScreen — Full-screen bottle / formula registration flow.
 *
 * DS: ScreenHeader · SectionLabel · ChipGroup · ReportToggle · StickyFooterCTA
 * Route: /bottle
 *
 * Hardening v3:
 * - Type selector is compact chips, not tall cards (less visual weight)
 * - CTA label follows verb+context pattern: "Registrar mamadeira"
 * - Section grouping is breathable and scannable
 * - Microcopy is caregiver-friendly
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { toast } from '@/hooks/use-toast';
import { makePayloadNotes } from '@/lib/routineUtils';
import {
  ScreenHeader,
  StickyFooterCTA,
  SectionLabel,
  ChipGroup,
  ReportToggle,
} from '@/components/ds';

const BOTTLE_COLOR = 'hsl(var(--color-bottle))';

type FeedType = 'bottle' | 'formula';

const TYPE_OPTIONS = [
  { value: 'bottle',  label: '🍼 Leite materno' },
  { value: 'formula', label: '🥛 Fórmula' },
];

const AMOUNT_OPTIONS = [
  { value: '30',  label: '30ml' },
  { value: '60',  label: '60ml' },
  { value: '90',  label: '90ml' },
  { value: '120', label: '120ml' },
  { value: '150', label: '150ml' },
  { value: '180', label: '180ml' },
  { value: '210', label: '210ml' },
  { value: '240', label: '240ml' },
];

const TEMP_OPTIONS = [
  { value: 'cold',  label: '🧊 Fria' },
  { value: 'warm',  label: '☁️ Morna' },
  { value: 'hot',   label: '🌡️ Quente' },
];

const REACTION_OPTIONS = [
  { value: 'mamou_bem',  label: '😊 Aceitou bem' },
  { value: 'rejeitou',   label: '😤 Recusou' },
  { value: 'pouquinho',  label: '🥺 Mamou pouco' },
  { value: 'arrotou',    label: '👍 Arrotou' },
  { value: 'regurgitou', label: '😬 Regurgitou' },
];

export default function BottleScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeChildId, activeChild } = useActiveChild();

  const [feedType, setFeedType] = useState<FeedType>('bottle');
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [temperature, setTemperature] = useState('');
  const [reactions, setReactions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);
  const [saving, setSaving] = useState(false);

  const resolvedAmount = amount || customAmount;

  async function handleSave() {
    if (!user || !activeChildId) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        session_type: feedType,
        feeding_method: feedType,
      };
      if (resolvedAmount)        payload.amount_ml         = Number(resolvedAmount);
      if (temperature)           payload.temperature       = temperature;
      if (reactions.length > 0)  payload.tags              = reactions.join(',');
      if (includeInReport)       payload.include_in_report = true;

      const { error } = await supabase.from('routine_logs').insert({
        child_id:   activeChildId,
        author_id:  user.id,
        type:       'feed',
        start_time: new Date().toISOString(),
        notes:      makePayloadNotes(payload, notes),
      });
      if (error) throw error;
      toast({ title: feedType === 'formula' ? '🍼 Fórmula registrada' : '🍼 Mamadeira registrada' });
      navigate(-1);
    } catch (e: unknown) {
      toast({ title: 'Erro ao salvar', description: e instanceof Error ? e.message : 'Tente novamente', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  const typeLabel = feedType === 'formula' ? 'fórmula' : 'mamadeira';
  const amountLabel = resolvedAmount ? ` · ${resolvedAmount}ml` : '';
  const ctaLabel = saving ? 'Salvando...' : `Registrar ${typeLabel}${amountLabel}`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ScreenHeader
        title={feedType === 'formula' ? 'Registrar fórmula' : 'Registrar mamadeira'}
        childName={activeChild?.name}
      />

      <div className="ds-form-body">
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >

          {/* ── Type ── */}
          <div>
            <SectionLabel>Tipo</SectionLabel>
            <ChipGroup
              options={TYPE_OPTIONS}
              value={feedType}
              onToggle={v => setFeedType(v as FeedType)}
              accentColor={BOTTLE_COLOR}
            />
          </div>

          {/* ── Amount ── */}
          <div>
            <SectionLabel>Quantidade</SectionLabel>
            <ChipGroup
              options={AMOUNT_OPTIONS}
              value={amount}
              onToggle={v => { setAmount(p => p === v ? '' : v); setCustomAmount(''); }}
              accentColor={BOTTLE_COLOR}
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="Outro valor em ml"
              value={customAmount}
              onChange={e => { setCustomAmount(e.target.value); setAmount(''); }}
              className="mt-3 w-full h-11 px-4 rounded-2xl text-[13px] border bg-card text-foreground font-nunito outline-none focus:ring-2 focus:ring-offset-0"
              style={{ borderColor: 'hsl(var(--border))', '--tw-ring-color': BOTTLE_COLOR } as React.CSSProperties}
            />
          </div>

          {/* ── Temperature ── */}
          <div>
            <SectionLabel>Temperatura</SectionLabel>
            <ChipGroup
              options={TEMP_OPTIONS}
              value={temperature}
              onToggle={v => setTemperature(p => p === v ? '' : v)}
              accentColor={BOTTLE_COLOR}
            />
          </div>

          {/* ── Reaction ── */}
          <div>
            <SectionLabel>Como reagiu?</SectionLabel>
            <ChipGroup
              options={REACTION_OPTIONS}
              values={reactions}
              onToggle={v => setReactions(p => p.includes(v) ? p.filter(r => r !== v) : [...p, v])}
              accentColor={BOTTLE_COLOR}
              multiSelect
            />
          </div>

          <div className="h-px bg-border" />

          {/* ── Observations ── */}
          <div>
            <SectionLabel>Observações</SectionLabel>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Alguma observação sobre esta alimentação..."
              className="ds-textarea"
              rows={3}
            />
          </div>

          <ReportToggle checked={includeInReport} onCheckedChange={setIncludeInReport} />

        </motion.div>
      </div>

      <StickyFooterCTA
        primaryLabel={ctaLabel}
        onPrimary={handleSave}
        primaryLoading={saving}
        primaryColor={BOTTLE_COLOR}
      />
    </div>
  );
}
