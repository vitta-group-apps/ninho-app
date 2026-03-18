/**
 * BottleScreen — Full-screen bottle / formula registration flow.
 *
 * DS: ScreenHeader · SectionLabel · ChipGroup · ReportToggle · StickyFooterCTA
 * Route: /bottle
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

const BOTTLE_COLOR = 'hsl(var(--color-feed))';

type FeedType = 'bottle' | 'formula';

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

  const ctaLabel = saving
    ? 'Salvando...'
    : `Registrar ${feedType === 'formula' ? 'fórmula' : 'mamadeira'}${resolvedAmount ? ` · ${resolvedAmount}ml` : ''}`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* DS Header */}
      <ScreenHeader
        title={feedType === 'formula' ? 'Registrar fórmula' : 'Registrar mamadeira'}
        childName={activeChild?.name}
      />

      {/* Scrollable form body */}
      <div className="ds-form-body">
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >

          {/* ── Type selection ── */}
          <div>
            <SectionLabel>Tipo de alimentação</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {([
                { type: 'bottle'  as FeedType, emoji: '🍼', label: 'Leite materno', desc: 'Leite retirado' },
                { type: 'formula' as FeedType, emoji: '🥛', label: 'Fórmula',       desc: 'Leite artificial' },
              ]).map(opt => {
                const active = feedType === opt.type;
                return (
                  <button
                    key={opt.type}
                    onClick={() => setFeedType(opt.type)}
                    className="flex flex-col items-center gap-2 py-5 rounded-2xl transition-all active:scale-95"
                    style={{
                      backgroundColor: active
                        ? `color-mix(in srgb, ${BOTTLE_COLOR} 10%, hsl(var(--card)))`
                        : 'hsl(var(--card))',
                      border: `2px solid ${active ? BOTTLE_COLOR : 'hsl(var(--border))'}`,
                      boxShadow: active
                        ? `0 2px 8px color-mix(in srgb, ${BOTTLE_COLOR} 18%, transparent)`
                        : 'none',
                    }}
                  >
                    <span className="text-[28px]">{opt.emoji}</span>
                    <p
                      className="text-[12px] font-bold font-nunito leading-tight text-center"
                      style={{ color: active ? BOTTLE_COLOR : 'hsl(var(--foreground))' }}
                    >
                      {opt.label}
                    </p>
                    <p className="text-[10px] font-nunito text-muted-foreground font-normal">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
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
            <div className="mt-3">
              <input
                type="number"
                inputMode="numeric"
                placeholder="Outro valor (ml)"
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setAmount(''); }}
                className="w-full h-11 px-4 rounded-2xl text-[13px] border bg-card text-foreground font-nunito outline-none focus:ring-2 focus:ring-offset-0"
                style={{ borderColor: 'hsl(var(--border))', '--tw-ring-color': BOTTLE_COLOR } as React.CSSProperties}
              />
            </div>
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

          {/* Divider */}
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

          {/* ── Medical report ── */}
          <ReportToggle
            checked={includeInReport}
            onCheckedChange={setIncludeInReport}
          />

        </motion.div>
      </div>

      {/* DS Sticky CTA */}
      <StickyFooterCTA
        primaryLabel={ctaLabel}
        onPrimary={handleSave}
        primaryLoading={saving}
        primaryColor={BOTTLE_COLOR}
      />
    </div>
  );
}
