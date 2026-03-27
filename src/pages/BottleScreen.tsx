/**
 * BottleScreen — Full-screen bottle / formula registration flow.
 *
 * DS: ScreenHeader · SectionLabel · ChipGroup · ReportToggle · StickyFooterCTA
 * Route: /bottle
 *
 * Contrato novo:
 * - payload estruturado em routine_logs.payload
 * - notes humano em routine_logs.notes
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { toast } from '@/hooks/use-toast';
import {
  ScreenHeader,
  StickyFooterCTA,
  SectionLabel,
  ChipGroup,
  ReportToggle,
} from '@/components/ds';

// ── Cores fixas ──
const BOTTLE_COLOR = '#C8894A';
const MUTED_BG = '#E8E8E2';
const PAGE_BG = '#F8F5F0';
const TXT = '#2C2C2C';
const TXT_MUTED = '#7A7A7A';
const CARD_BORDER = '#E5E0D8';

type FeedType = 'bottle' | 'formula';

const TYPE_OPTIONS = [
  { value: 'bottle', label: '🍼 Leite materno ordenhado' },
  { value: 'formula', label: '🥛 Fórmula' },
];

const AMOUNT_OPTIONS = [
  { value: '30', label: '30ml' },
  { value: '60', label: '60ml' },
  { value: '90', label: '90ml' },
  { value: '120', label: '120ml' },
  { value: '150', label: '150ml' },
  { value: '180', label: '180ml' },
  { value: '210', label: '210ml' },
  { value: '240', label: '240ml' },
];

const TEMP_OPTIONS = [
  { value: 'cold', label: '🧊 Fria' },
  { value: 'warm', label: '☁️ Morna' },
  { value: 'hot', label: '🌡️ Quente' },
];

const REACTION_OPTIONS = [
  { value: 'mamou_bem', label: '😊 Aceitou bem' },
  { value: 'rejeitou', label: '😤 Recusou' },
  { value: 'pouquinho', label: '🥺 Mamou pouco' },
  { value: 'arrotou', label: '👍 Arrotou' },
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

  const [feedDate, setFeedDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );

  const [feedTime, setFeedTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
  });

  const resolvedAmount = amount || customAmount;

  async function handleSave() {
    if (!user || !activeChildId) return;

    setSaving(true);

    try {
      const feedDateTime = new Date(`${feedDate}T${feedTime}:00`);

      if (Number.isNaN(feedDateTime.getTime())) {
        throw new Error('Data ou horário inválido.');
      }

      const amountMl =
        resolvedAmount.trim() !== '' ? Number(resolvedAmount) : null;

      if (amountMl !== null && (!Number.isFinite(amountMl) || amountMl <= 0)) {
        throw new Error('Informe uma quantidade válida em ml.');
      }

      const payload = {
        mode: 'bottle' as const,
        amountMl,
        food: feedType === 'formula' ? 'Fórmula' : 'Leite materno ordenhado',
        temperature: temperature || null,
        tags: reactions.length > 0 ? reactions : null,
        includeInReport: includeInReport || null,
      };

      const { error } = await supabase.from('routine_logs').insert({
        child_id: activeChildId,
        author_id: user.id,
        type: 'feed',
        start_time: feedDateTime.toISOString(),
        payload,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      toast({
        title:
          feedType === 'formula'
            ? '🥛 Fórmula registrada'
            : '🍼 Mamadeira registrada',
      });

      navigate(-1);
    } catch (e: unknown) {
      toast({
        title: 'Erro ao salvar',
        description:
          e instanceof Error ? e.message : 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  const typeLabel = feedType === 'formula' ? 'fórmula' : 'mamadeira';
  const amountLabel = resolvedAmount ? ` · ${resolvedAmount}ml` : '';
  const ctaLabel = saving ? 'Salvando...' : `Registrar ${typeLabel}${amountLabel}`;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: PAGE_BG }}>
      <ScreenHeader
        title={feedType === 'formula' ? 'Registrar fórmula' : 'Registrar mamadeira'}
        childName={activeChild?.name}
      />

      <div className="ds-form-body">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <div>
            <SectionLabel>Tipo</SectionLabel>
            <ChipGroup
              options={TYPE_OPTIONS}
              value={feedType}
              onToggle={v => setFeedType(v as FeedType)}
              accentColor={BOTTLE_COLOR}
            />
          </div>

          <div>
            <SectionLabel>Quantidade</SectionLabel>
            <ChipGroup
              options={AMOUNT_OPTIONS}
              value={amount}
              onToggle={v => {
                setAmount(prev => (prev === v ? '' : v));
                setCustomAmount('');
              }}
              accentColor={BOTTLE_COLOR}
            />

            <input
              type="number"
              inputMode="numeric"
              placeholder="Outro valor em ml"
              value={customAmount}
              onChange={e => {
                setCustomAmount(e.target.value);
                setAmount('');
              }}
              className="mt-3 w-full h-11 px-4 rounded-2xl text-[13px] font-nunito outline-none"
              style={{
                backgroundColor: MUTED_BG,
                border: `1.5px solid ${customAmount ? BOTTLE_COLOR : CARD_BORDER}`,
                color: TXT,
              }}
            />
          </div>

          <div>
            <SectionLabel>Quando foi</SectionLabel>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.06em] font-nunito mb-2"
                  style={{ color: TXT_MUTED }}
                >
                  Data
                </p>
                <input
                  type="date"
                  value={feedDate}
                  onChange={e => setFeedDate(e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl text-[13px] font-nunito outline-none"
                  style={{
                    backgroundColor: MUTED_BG,
                    border: `1.5px solid ${CARD_BORDER}`,
                    color: TXT,
                  }}
                />
              </div>

              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.06em] font-nunito mb-2"
                  style={{ color: TXT_MUTED }}
                >
                  Horário
                </p>
                <input
                  type="time"
                  value={feedTime}
                  onChange={e => setFeedTime(e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl text-[13px] font-nunito outline-none"
                  style={{
                    backgroundColor: MUTED_BG,
                    border: `1.5px solid ${CARD_BORDER}`,
                    color: TXT,
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <SectionLabel>Temperatura</SectionLabel>
            <ChipGroup
              options={TEMP_OPTIONS}
              value={temperature}
              onToggle={v => setTemperature(prev => (prev === v ? '' : v))}
              accentColor={BOTTLE_COLOR}
            />
          </div>

          <div>
            <SectionLabel>Como reagiu?</SectionLabel>
            <ChipGroup
              options={REACTION_OPTIONS}
              values={reactions}
              onToggle={v =>
                setReactions(prev =>
                  prev.includes(v) ? prev.filter(r => r !== v) : [...prev, v]
                )
              }
              accentColor={BOTTLE_COLOR}
              multiSelect
            />
          </div>

          <div className="h-px" style={{ backgroundColor: CARD_BORDER }} />

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

          <ReportToggle
            checked={includeInReport}
            onCheckedChange={setIncludeInReport}
          />
        </motion.div>
      </div>

      <StickyFooterCTA
        primaryLabel={ctaLabel}
        onPrimary={handleSave}
        primaryLoading={saving}
        primaryColor={BOTTLE_COLOR}
        primaryDisabled={!feedDate || !feedTime}
      />
    </div>
  );
}
