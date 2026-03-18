/**
 * BottleScreen — Full-screen bottle / formula registration flow.
 *
 * Route: /bottle
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { toast } from '@/hooks/use-toast';
import { makePayloadNotes } from '@/lib/routineUtils';

const SAGE  = 'hsl(152,15%,55%)';
const font  = 'Nunito, sans-serif';

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
  { value: 'cold',  label: 'Fria' },
  { value: 'warm',  label: 'Morna' },
  { value: 'hot',   label: 'Quente' },
];

const REACTION_OPTIONS = [
  { value: 'mamou_bem',    label: '😊 Aceitou bem' },
  { value: 'rejeitou',     label: '😤 Recusou' },
  { value: 'pouquinho',    label: '🥺 Mamou pouco' },
  { value: 'arrotou',      label: '👍 Arrotou' },
  { value: 'regurgitou',   label: '😬 Regurgitou' },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wider mb-2"
      style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
      {children}
    </p>
  );
}

function ChipRow({
  options, value, onToggle,
}: {
  options: { value: string; label: string }[];
  value: string;
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button key={opt.value}
            onClick={() => onToggle(opt.value)}
            className="py-2.5 px-4 rounded-2xl text-sm font-semibold transition-all active:scale-95"
            style={{
              backgroundColor: active ? SAGE : 'hsl(var(--card))',
              color: active ? 'white' : 'hsl(var(--ninho-brown))',
              border: `1.5px solid ${active ? SAGE : 'hsl(var(--border))'}`,
              fontFamily: font,
            }}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function MultiChipRow({
  options, values, onToggle,
}: {
  options: { value: string; label: string }[];
  values: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = values.includes(opt.value);
        return (
          <button key={opt.value}
            onClick={() => onToggle(opt.value)}
            className="py-2.5 px-4 rounded-2xl text-sm font-semibold transition-all active:scale-95"
            style={{
              backgroundColor: active ? SAGE : 'hsl(var(--card))',
              color: active ? 'white' : 'hsl(var(--ninho-brown))',
              border: `1.5px solid ${active ? SAGE : 'hsl(var(--border))'}`,
              fontFamily: font,
            }}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

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
      if (resolvedAmount) payload.amount_ml = Number(resolvedAmount);
      if (temperature) payload.temperature = temperature;
      if (reactions.length > 0) payload.tags = reactions.join(',');
      if (includeInReport) payload.include_in_report = true;

      const { error } = await supabase.from('routine_logs').insert({
        child_id: activeChildId,
        author_id: user.id,
        type: 'feed',
        start_time: new Date().toISOString(),
        notes: makePayloadNotes(payload, notes),
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

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-5 flex items-center gap-3"
        style={{
          paddingTop: 'max(52px, env(safe-area-inset-top))',
          paddingBottom: '16px',
          backgroundColor: 'hsl(var(--card))',
          borderBottom: '1px solid hsl(var(--border))',
        }}>
        <button onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90"
          style={{ backgroundColor: 'hsl(var(--muted))' }}>
          <ArrowLeftIcon className="w-5 h-5" style={{ color: 'hsl(var(--ninho-brown))' }} />
        </button>
        <div>
          <p className="text-lg font-bold leading-tight"
            style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
            {feedType === 'formula' ? 'Registrar fórmula' : 'Registrar mamadeira'}
          </p>
          {activeChild && (
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
              {activeChild.name}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6"
        style={{ paddingBottom: 'max(96px, calc(env(safe-area-inset-bottom) + 96px))' }}>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }} className="space-y-6">

          {/* Type selection */}
          <div>
            <SectionLabel>Tipo de alimentação</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {([
                { type: 'bottle' as FeedType,  emoji: '🍼', label: 'Leite materno',  desc: 'Leite retirado' },
                { type: 'formula' as FeedType, emoji: '🥛', label: 'Fórmula',        desc: 'Leite artificial' },
              ]).map(opt => {
                const active = feedType === opt.type;
                return (
                  <button key={opt.type} onClick={() => setFeedType(opt.type)}
                    className="flex flex-col items-center gap-2 py-5 rounded-2xl font-bold transition-all active:scale-95"
                    style={{
                      backgroundColor: active ? `${SAGE}18` : 'hsl(var(--card))',
                      border: `2px solid ${active ? SAGE : 'hsl(var(--border))'}`,
                      color: active ? SAGE : 'hsl(var(--ninho-brown))',
                    }}>
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-xs font-bold" style={{ fontFamily: font }}>{opt.label}</span>
                    <span className="text-[10px] font-normal" style={{ color: active ? SAGE : 'hsl(var(--muted-foreground))', fontFamily: font }}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount */}
          <div>
            <SectionLabel>Quantidade</SectionLabel>
            <ChipRow
              options={AMOUNT_OPTIONS}
              value={amount}
              onToggle={v => { setAmount(p => p === v ? '' : v); setCustomAmount(''); }}
            />
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                placeholder="Outro (ml)"
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setAmount(''); }}
                className="flex-1 h-11 px-4 rounded-2xl text-sm border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--ninho-brown))',
                  fontFamily: font,
                }}
              />
              {customAmount && (
                <span className="text-sm font-semibold" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>ml</span>
              )}
            </div>
          </div>

          {/* Temperature */}
          <div>
            <SectionLabel>Temperatura</SectionLabel>
            <ChipRow options={TEMP_OPTIONS} value={temperature}
              onToggle={v => setTemperature(p => p === v ? '' : v)} />
          </div>

          {/* Reaction */}
          <div>
            <SectionLabel>Como reagiu?</SectionLabel>
            <MultiChipRow
              options={REACTION_OPTIONS}
              values={reactions}
              onToggle={v => setReactions(p => p.includes(v) ? p.filter(r => r !== v) : [...p, v])}
            />
          </div>

          {/* Observations */}
          <div>
            <SectionLabel>Observações</SectionLabel>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Alguma observação sobre esta alimentação..."
              className="rounded-2xl border-border resize-none"
              rows={3}
              style={{ fontFamily: font, minHeight: '80px' }}
            />
          </div>

          {/* Medical report toggle */}
          <div className="flex items-center justify-between px-4 py-4 rounded-2xl"
            style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <div>
              <p className="text-sm font-semibold leading-tight"
                style={{ color: 'hsl(var(--ninho-brown))', fontFamily: font }}>
                Incluir no relatório médico
              </p>
              <p className="text-xs mt-0.5"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
                Aparecerá no próximo relatório gerado
              </p>
            </div>
            <Switch checked={includeInReport} onCheckedChange={setIncludeInReport} />
          </div>
        </motion.div>
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center"
        style={{
          padding: '16px 20px',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          backgroundColor: 'hsl(var(--card))',
          borderTop: '1px solid hsl(var(--border))',
        }}>
        <div className="w-full max-w-md">
          <button onClick={handleSave} disabled={saving}
            className="w-full py-4 rounded-2xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${SAGE}, hsl(var(--ninho-mauve)))`,
              color: 'white', fontFamily: font,
            }}>
            {saving ? 'Salvando...' : `Registrar ${feedType === 'formula' ? 'fórmula' : 'mamadeira'}${resolvedAmount ? ` · ${resolvedAmount}ml` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
