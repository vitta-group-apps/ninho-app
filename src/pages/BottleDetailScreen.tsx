/**
 * BottleDetailScreen — READ-ONLY + INLINE EDIT detail view for a bottle/formula feed.
 *
 * Route: /bottle/detail/:logId
 *
 * UX Rule (global):
 *   - Opens in READ mode: displays data, NO editable inputs
 *   - "Editar" CTA → toggles to EDIT mode inline (same screen)
 *   - In edit mode: "Salvar alterações" + "Cancelar"
 *
 * DS: ScreenHeader · SectionLabel · ChipGroup · ReportToggle · StickyFooterCTA
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { parsePayload, makePayloadNotes, getUserNotes, fmtTime } from '@/lib/routineUtils';
import type { RoutineLog } from '@/lib/eventSystem';
import {
  ScreenHeader,
  StickyFooterCTA,
  SectionLabel,
  ChipGroup,
  ReportToggle,
} from '@/components/ds';

const BOTTLE_COLOR = 'hsl(var(--color-bottle))';

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

const TYPE_LABEL: Record<string, string> = {
  bottle: 'Leite materno', formula: 'Fórmula',
};
const TEMP_LABEL: Record<string, string> = {
  cold: 'Fria', warm: 'Morna', hot: 'Quente',
};
const REACTION_LABEL: Record<string, string> = {
  mamou_bem: 'Aceitou bem', rejeitou: 'Recusou', pouquinho: 'Mamou pouco',
  arrotou: 'Arrotou', regurgitou: 'Regurgitou',
};

// ─── Read-only row ─────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <p className="text-[13px] text-muted-foreground font-nunito flex-shrink-0">{label}</p>
      <p className="text-[13px] font-semibold font-nunito text-foreground text-right">{value}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BottleDetailScreen() {
  const navigate = useNavigate();
  const { logId } = useParams<{ logId: string }>();

  const [log, setLog] = useState<RoutineLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields
  const [feedType, setFeedType] = useState('bottle');
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [temperature, setTemperature] = useState('');
  const [reactions, setReactions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);

  useEffect(() => {
    if (!logId) return;
    (async () => {
      const { data } = await supabase
        .from('routine_logs')
        .select('*')
        .eq('id', logId)
        .maybeSingle();
      if (data) {
        setLog(data);
        loadFields(data);
      }
      setLoading(false);
    })();
  }, [logId]);

  function loadFields(data: RoutineLog) {
    const p = parsePayload(data.notes);
    const ft = String(p.feeding_method ?? p.session_type ?? 'bottle');
    setFeedType(ft);
    const ml = p.amount_ml ? String(p.amount_ml) : '';
    const presetOptions = AMOUNT_OPTIONS.map(o => o.value);
    if (presetOptions.includes(ml)) { setAmount(ml); setCustomAmount(''); }
    else { setAmount(''); setCustomAmount(ml); }
    setTemperature(String(p.temperature ?? ''));
    setReactions(String(p.tags ?? '').split(',').filter(Boolean));
    setNotes(getUserNotes(data.notes) ?? '');
    setIncludeInReport(Boolean(p.include_in_report));
  }

  async function handleSave() {
    if (!log) return;
    setSaving(true);
    try {
      const existing = parsePayload(log.notes);
      const resolvedAmount = amount || customAmount;

      const payload: Record<string, unknown> = {
        ...existing,
        session_type: feedType,
        feeding_method: feedType,
      };
      if (resolvedAmount)           payload.amount_ml         = Number(resolvedAmount); else delete payload.amount_ml;
      if (temperature)              payload.temperature       = temperature;            else delete payload.temperature;
      if (reactions.length > 0)     payload.tags              = reactions.join(',');    else delete payload.tags;
      if (includeInReport)          payload.include_in_report = true;                   else delete payload.include_in_report;
      delete payload._notes;

      const { error } = await supabase
        .from('routine_logs')
        .update({ notes: makePayloadNotes(payload, notes) })
        .eq('id', log.id);

      if (error) throw error;
      toast({ title: '✓ Alterações salvas' });
      setIsEditing(false);
      // Refresh
      const { data } = await supabase.from('routine_logs').select('*').eq('id', log.id).maybeSingle();
      if (data) { setLog(data); loadFields(data); }
    } catch (e: unknown) {
      toast({
        title: 'Erro ao salvar',
        description: e instanceof Error ? e.message : 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin border-primary" />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <ScreenHeader title="Mamadeira" onBack={() => navigate(-1)} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground font-nunito text-sm">Registro não encontrado.</p>
        </div>
      </div>
    );
  }

  const p = parsePayload(log.notes);
  const feedTypeRead = String(p.feeding_method ?? p.session_type ?? '');
  const typeLabelRead = TYPE_LABEL[feedTypeRead] ?? 'Mamadeira';
  const amountMl = p.amount_ml ? `${p.amount_ml}ml` : null;
  const tempLabelRead = TEMP_LABEL[String(p.temperature ?? '')] ?? null;
  const rawTagsRead = String(p.tags ?? '').split(',').filter(Boolean);
  const reactionLabelRead = rawTagsRead.map(t => REACTION_LABEL[t] ?? t).join(', ') || null;
  const notesRead = getUserNotes(log.notes);
  const includeInReportRead = Boolean(p.include_in_report);
  const screenTitle = feedTypeRead === 'formula' ? 'Fórmula' : 'Mamadeira';

  const resolvedAmount = amount || customAmount;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ScreenHeader
        title={screenTitle}
        onBack={() => {
          if (isEditing) {
            loadFields(log);
            setIsEditing(false);
          } else {
            navigate(-1);
          }
        }}
      />

      <div className="ds-form-body">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          {/* Summary card — always visible */}
          <div
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: `color-mix(in srgb, ${BOTTLE_COLOR} 8%, hsl(var(--card)))`,
              border: `1.5px solid color-mix(in srgb, ${BOTTLE_COLOR} 22%, transparent)`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0"
                style={{ backgroundColor: `color-mix(in srgb, ${BOTTLE_COLOR} 16%, transparent)` }}
              >
                🍼
              </div>
              <div>
                <p className="text-[14px] font-bold font-quicksand text-foreground leading-tight">
                  {typeLabelRead}
                </p>
                <p className="text-[12px] font-semibold font-nunito mt-0.5 text-muted-foreground">
                  {fmtTime(log.start_time)}
                  {amountMl && ` · ${amountMl}`}
                </p>
              </div>
            </div>

            {amountMl && (
              <div className="text-center mt-4">
                <p
                  className="text-[40px] font-bold tabular-nums font-quicksand leading-none"
                  style={{ color: BOTTLE_COLOR }}
                >
                  {amountMl}
                </p>
                <p className="text-[11px] mt-1 text-muted-foreground font-nunito">volume oferecido</p>
              </div>
            )}
          </div>

          {/* READ vs EDIT */}
          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div
                key="read"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div
                  className="rounded-2xl px-4 overflow-hidden"
                  style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                >
                  <DetailRow label="Tipo" value={typeLabelRead} />
                  <DetailRow label="Temperatura" value={tempLabelRead} />
                  <DetailRow label="Como reagiu" value={reactionLabelRead} />
                  <DetailRow label="Observações" value={notesRead} />
                  {includeInReportRead && <DetailRow label="Relatório médico" value="Incluído" />}
                </div>

                {!amountMl && !tempLabelRead && !reactionLabelRead && !notesRead && (
                  <p className="text-center text-[13px] text-muted-foreground font-nunito py-2">
                    Nenhuma informação adicional registrada.
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                <div>
                  <SectionLabel>Tipo</SectionLabel>
                  <ChipGroup
                    options={TYPE_OPTIONS}
                    value={feedType}
                    onToggle={v => setFeedType(v)}
                    accentColor={BOTTLE_COLOR}
                  />
                </div>

                <div>
                  <SectionLabel>Quantidade</SectionLabel>
                  <ChipGroup
                    options={AMOUNT_OPTIONS}
                    value={amount}
                    onToggle={v => { setAmount(prev => prev === v ? '' : v); setCustomAmount(''); }}
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

                <div>
                  <SectionLabel>Temperatura</SectionLabel>
                  <ChipGroup
                    options={TEMP_OPTIONS}
                    value={temperature}
                    onToggle={v => setTemperature(prev => prev === v ? '' : v)}
                    accentColor={BOTTLE_COLOR}
                  />
                </div>

                <div>
                  <SectionLabel>Como reagiu?</SectionLabel>
                  <ChipGroup
                    options={REACTION_OPTIONS}
                    values={reactions}
                    onToggle={v => setReactions(prev => prev.includes(v) ? prev.filter(r => r !== v) : [...prev, v])}
                    accentColor={BOTTLE_COLOR}
                    multiSelect
                  />
                </div>

                <div className="h-px bg-border" />

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
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {!isEditing ? (
        <StickyFooterCTA
          primaryLabel="Editar"
          onPrimary={() => setIsEditing(true)}
          primaryColor={BOTTLE_COLOR}
        />
      ) : (
        <StickyFooterCTA
          primaryLabel={saving ? 'Salvando...' : 'Salvar alterações'}
          onPrimary={handleSave}
          primaryLoading={saving}
          primaryColor={BOTTLE_COLOR}
          secondaryLabel="Cancelar"
          onSecondary={() => {
            loadFields(log);
            setIsEditing(false);
          }}
        />
      )}
    </div>
  );
}
