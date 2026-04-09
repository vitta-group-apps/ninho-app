/**
 * BottleDetailScreen — READ-ONLY + INLINE EDIT detail view for a bottle/formula feed.
 *
 * Route: /bottle/detail/:logId
 *
 * Modelo novo:
 * - routine_logs = fonte da verdade
 * - payload estruturado em routine_logs.payload
 * - notes humano em routine_logs.notes
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';
import { getUserNotes, fmtTime } from '@/lib/routineUtils';
import {
  ScreenHeader,
  StickyFooterCTA,
  SectionLabel,
  ChipGroup,
  ReportToggle,
} from '@/components/ds';

// ── Types ───────────────────────────────────────────────────────────────────

type RoutineLog = Tables<'routine_logs'>;
type PayloadRecord = Record<string, unknown>;
type FeedType = 'bottle' | 'formula';

// ── Cores fixas ─────────────────────────────────────────────────────────────

const BOTTLE_COLOR = '#C8894A';
const BOTTLE_BG = '#FDF3E9';
const BOTTLE_BORDER = '#f0d5b0';
const BOTTLE_LIGHT = '#fde8d0';
const CARD_BG = '#ffffff';
const CARD_BORDER = '#E5E0D8';
const MUTED_BG = '#E8E8E2';
const PAGE_BG = '#F8F5F0';
const TXT = '#2C2C2C';
const TXT_MUTED = '#7A7A7A';

// ── Options ─────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: 'bottle', label: '🍼 Leite materno' },
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

const TYPE_LABEL: Record<string, string> = {
  bottle: 'Leite materno',
  formula: 'Fórmula',
};

const TEMP_LABEL: Record<string, string> = {
  cold: 'Fria',
  warm: 'Morna',
  hot: 'Quente',
};

const REACTION_LABEL: Record<string, string> = {
  mamou_bem: 'Aceitou bem',
  rejeitou: 'Recusou',
  pouquinho: 'Mamou pouco',
  arrotou: 'Arrotou',
  regurgitou: 'Regurgitou',
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function isRecord(value: unknown): value is PayloadRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
  }

  return [];
}

function cleanPayload(payload: PayloadRecord): PayloadRecord {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );
}

function readString(payload: PayloadRecord, snake: string, camel?: string): string | null {
  return asString(payload[snake]) ?? (camel ? asString(payload[camel]) : null);
}

function readNumber(payload: PayloadRecord, snake: string, camel?: string): number | null {
  return asNumber(payload[snake]) ?? (camel ? asNumber(payload[camel]) : null);
}

function readBoolean(payload: PayloadRecord, snake: string, camel?: string): boolean | null {
  return asBoolean(payload[snake]) ?? (camel ? asBoolean(payload[camel]) : null);
}

function getFeedTypeFromPayload(payload: PayloadRecord): FeedType {
  const mode = readString(payload, 'mode');
  const food = readString(payload, 'food');
  const feedingMethod =
    readString(payload, 'feeding_method') ??
    readString(payload, 'session_type');

  if (food === 'Fórmula' || food === 'formula' || feedingMethod === 'formula') {
    return 'formula';
  }

  if (mode === 'bottle' || feedingMethod === 'bottle') {
    return 'bottle';
  }

  return 'bottle';
}

function getAmountMlFromPayload(payload: PayloadRecord): number | null {
  return readNumber(payload, 'amount_ml', 'amountMl');
}

function getTemperatureFromPayload(payload: PayloadRecord): string {
  return readString(payload, 'temperature') ?? '';
}

function getReactionsFromPayload(payload: PayloadRecord): string[] {
  return asStringArray(payload.tags);
}

function getIncludeInReportFromPayload(payload: PayloadRecord): boolean {
  return readBoolean(payload, 'include_in_report', 'includeInReport') ?? false;
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;

  return (
    <div
      className="flex items-start justify-between gap-4 py-3 last:border-0"
      style={{ borderBottom: `1px solid ${CARD_BORDER}` }}
    >
      <p
        className="text-[13px] font-nunito flex-shrink-0"
        style={{ color: TXT_MUTED }}
      >
        {label}
      </p>
      <p
        className="text-[13px] font-semibold font-nunito text-right"
        style={{ color: TXT }}
      >
        {value}
      </p>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────

export default function BottleDetailScreen() {
  const navigate = useNavigate();
  const { logId } = useParams<{ logId: string }>();

  const [log, setLog] = useState<RoutineLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [feedType, setFeedType] = useState<FeedType>('bottle');
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [temperature, setTemperature] = useState('');
  const [reactions, setReactions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);

  const payload = useMemo<PayloadRecord>(() => {
    return isRecord(log?.payload) ? log.payload : {};
  }, [log?.payload]);

  useEffect(() => {
    if (!logId) return;

    (async () => {
      const { data, error } = await supabase
        .from('routine_logs')
        .select('*')
        .eq('id', logId)
        .eq('type', 'feed')
        .maybeSingle();

      if (!error && data) {
        const nextLog = data as RoutineLog;
        setLog(nextLog);
        loadFields(nextLog);
      }

      setLoading(false);
    })();
  }, [logId]);

  function loadFields(data: RoutineLog) {
    const nextPayload = isRecord(data.payload) ? data.payload : {};

    const inferredType = getFeedTypeFromPayload(nextPayload);
    setFeedType(inferredType);

    const ml = getAmountMlFromPayload(nextPayload);
    const mlString = ml != null ? String(ml) : '';

    if (AMOUNT_OPTIONS.some(option => option.value === mlString)) {
      setAmount(mlString);
      setCustomAmount('');
    } else {
      setAmount('');
      setCustomAmount(mlString);
    }

    setTemperature(getTemperatureFromPayload(nextPayload));
    setReactions(getReactionsFromPayload(nextPayload));
    setNotes(getUserNotes(data.notes) ?? '');
    setIncludeInReport(getIncludeInReportFromPayload(nextPayload));
  }

  async function reloadLog(currentLogId: string) {
    const { data, error } = await supabase
      .from('routine_logs')
      .select('*')
      .eq('id', currentLogId)
      .eq('type', 'feed')
      .maybeSingle();

    if (!error && data) {
      const nextLog = data as RoutineLog;
      setLog(nextLog);
      loadFields(nextLog);
    }
  }

  async function handleSave() {
    if (!log) return;

    setSaving(true);

    try {
      const resolvedAmount = amount || customAmount;
      const amountMl =
        resolvedAmount.trim() !== '' ? Number(resolvedAmount) : null;

      if (amountMl !== null && (!Number.isFinite(amountMl) || amountMl <= 0)) {
        throw new Error('Informe uma quantidade válida em ml.');
      }

      const nextPayload: PayloadRecord = cleanPayload({
        ...payload,
        mode: 'bottle',
        amount_ml: amountMl,
        food: feedType === 'formula' ? 'Fórmula' : 'Leite materno',
        tags: reactions.length > 0 ? reactions : [],
        include_in_report: includeInReport,
        temperature: temperature || undefined,
      });

      delete nextPayload.amountMl;
      delete nextPayload.includeInReport;
      delete nextPayload.feeding_method;
      delete nextPayload.session_type;

      const { error } = await supabase
        .from('routine_logs')
        .update({
          payload: nextPayload as unknown as import('@/integrations/supabase/types').Json,
          notes: notes.trim() || null,
        })
        .eq('id', log.id);

      if (error) throw error;

      toast({ title: '✓ Alterações salvas' });
      setIsEditing(false);
      await reloadLog(log.id);
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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: PAGE_BG }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: BOTTLE_COLOR }}
        />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: PAGE_BG }}>
        <ScreenHeader title="Mamadeira" onBack={() => navigate(-1)} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm font-nunito" style={{ color: TXT_MUTED }}>
            Registro não encontrado.
          </p>
        </div>
      </div>
    );
  }

  const feedTypeRead = getFeedTypeFromPayload(payload);
  const typeLabelRead = TYPE_LABEL[feedTypeRead] ?? 'Mamadeira';

  const amountMlValue = getAmountMlFromPayload(payload);
  const amountMl = amountMlValue != null ? `${amountMlValue}ml` : null;

  const tempRaw = getTemperatureFromPayload(payload);
  const tempLabelRead = tempRaw ? TEMP_LABEL[tempRaw] ?? tempRaw : null;

  const reactionLabelRead =
    getReactionsFromPayload(payload)
      .map(tag => REACTION_LABEL[tag] ?? tag)
      .join(', ') || null;

  const notesRead = getUserNotes(log.notes);
  const includeRead = getIncludeInReportFromPayload(payload);
  const screenTitle = feedTypeRead === 'formula' ? 'Fórmula' : 'Mamadeira';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: PAGE_BG }}>
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
          <div
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: BOTTLE_BG,
              border: `1.5px solid ${BOTTLE_BORDER}`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0"
                style={{ backgroundColor: BOTTLE_LIGHT }}
              >
                🍼
              </div>

              <div>
                <p
                  className="text-[14px] font-bold font-quicksand leading-tight"
                  style={{ color: TXT }}
                >
                  {typeLabelRead}
                </p>
                <p
                  className="text-[12px] font-semibold font-nunito mt-0.5"
                  style={{ color: TXT_MUTED }}
                >
                  {fmtTime(log.start_time)}
                  {amountMl ? ` · ${amountMl}` : ''}
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
                <p
                  className="text-[11px] mt-1 font-nunito"
                  style={{ color: TXT_MUTED }}
                >
                  volume oferecido
                </p>
              </div>
            )}
          </div>

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
                  style={{
                    backgroundColor: CARD_BG,
                    border: `1px solid ${CARD_BORDER}`,
                  }}
                >
                  <DetailRow label="Tipo" value={typeLabelRead} />
                  <DetailRow label="Temperatura" value={tempLabelRead} />
                  <DetailRow label="Como reagiu" value={reactionLabelRead} />
                  <DetailRow label="Observações" value={notesRead ?? null} />
                  {includeRead && <DetailRow label="Relatório médico" value="Incluído" />}
                </div>

                {!amountMl && !tempLabelRead && !reactionLabelRead && !notesRead && (
                  <p
                    className="text-center text-[13px] font-nunito py-2"
                    style={{ color: TXT_MUTED }}
                  >
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
                        prev.includes(v)
                          ? prev.filter(r => r !== v)
                          : [...prev, v]
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