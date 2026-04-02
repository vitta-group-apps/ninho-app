/**
 * SleepDetailScreen — READ-ONLY + INLINE EDIT detail view for a completed sleep session.
 *
 * Modelo novo:
 *   - routine_logs = fonte da verdade
 *   - payload = json estruturado
 *   - notes = texto humano
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
  isRecord,
  asString,
  asBoolean,
  cleanPayload,
  type PayloadRecord,
} from '@/lib/eventPayload';
import {
  ScreenHeader,
  StickyFooterCTA,
  SectionLabel,
  ChipGroup,
  ReportToggle,
} from '@/components/ds';

// ── Types ───────────────────────────────────────────────────────────────────

type RoutineLog = Tables<'routine_logs'>;

// ── Cores fixas ─────────────────────────────────────────────────────────────

const SLEEP_COLOR = '#806e84';
const SLEEP_BG = '#f4f0f3';
const SLEEP_BORDER = '#e3d9e2';
const SLEEP_LIGHT = '#ede8ef';
const CARD_BG = '#ffffff';
const CARD_BORDER = '#E5E0D8';
const MUTED_BG = '#E8E8E2';
const TXT = '#2C2C2C';
const TXT_MUTED = '#7A7A7A';

// ── Options (espelha SleepScreen) ───────────────────────────────────────────

const SLEEP_LOCATION_OPTIONS = [
  { value: 'berco', label: '🛏 Berço' },
  { value: 'colo', label: '🤱 Colo' },
  { value: 'carrinho', label: '🛒 Carrinho' },
  { value: 'cama', label: '🛌 Cama' },
  { value: 'outro', label: '📦 Outro' },
];

const SLEEP_HOW_OPTIONS = [
  { value: 'sozinho', label: 'Sozinho' },
  { value: 'mamando', label: 'Mamando' },
  { value: 'colo', label: 'No colo' },
  { value: 'embalo', label: 'No embalo' },
  { value: 'outro', label: 'Outro' },
];

const AWAKENINGS_OPTIONS = [
  { value: '0', label: 'Nenhuma' },
  { value: '1', label: '1 vez' },
  { value: '2', label: '2 vezes' },
  { value: '3+', label: '3 ou mais' },
];

const SLEEP_TYPE_OPTIONS = [
  { value: 'noturno', label: '🌙 Noturno' },
  { value: 'soneca', label: '☀️ Soneca' },
];

const SLEEP_POSITION_OPTIONS = [
  { value: 'costas', label: '↑ De costas' },
  { value: 'lado', label: '↔ De lado' },
  { value: 'barriga', label: '↓ De barriga' },
];

const SLEEP_QUALITY_OPTIONS = [
  { value: 'tranquilo', label: '😌 Tranquilo' },
  { value: 'agitado', label: '😤 Agitado' },
  { value: 'com_choro', label: '😢 Com choro' },
];

// ── Labels para leitura ─────────────────────────────────────────────────────

const LOCATION_LABEL: Record<string, string> = {
  berco: 'Berço',
  colo: 'Colo',
  carrinho: 'Carrinho',
  cama: 'Cama',
  outro: 'Outro',
};

const HOW_LABEL: Record<string, string> = {
  sozinho: 'Sozinho',
  mamando: 'Mamando',
  colo: 'No colo',
  embalo: 'No embalo',
  outro: 'Outro',
};

const AWAKENINGS_LABEL: Record<string, string> = {
  '0': 'Nenhuma vez',
  '1': '1 vez',
  '2': '2 vezes',
  '3+': '3 ou mais',
};

const SLEEP_TYPE_LABEL: Record<string, string> = {
  noturno: '🌙 Noturno',
  soneca: '☀️ Soneca',
};

const SLEEP_POSITION_LABEL: Record<string, string> = {
  costas: 'De costas',
  lado: 'De lado',
  barriga: 'De barriga',
};

const SLEEP_QUALITY_LABEL: Record<string, string> = {
  tranquilo: '😌 Tranquilo',
  agitado: '😤 Agitado',
  com_choro: '😢 Com choro',
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmtRangeDuration(startIso: string, endIso: string): string | null {
  const startMs = new Date(startIso).getTime();
  const endMs = new Date(endIso).getTime();

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return null;
  }

  const totalMin = Math.floor((endMs - startMs) / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;

  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;

  return (
    <div
      className="flex items-start justify-between gap-4 py-3 last:border-0"
      style={{ borderBottom: `1px solid ${CARD_BORDER}` }}
    >
      <p className="text-[13px] font-nunito flex-shrink-0" style={{ color: TXT_MUTED }}>
        {label}
      </p>
      <p className="text-[13px] font-semibold font-nunito text-right" style={{ color: TXT }}>
        {value}
      </p>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────

export default function SleepDetailScreen() {
  const navigate = useNavigate();
  const { logId } = useParams<{ logId: string }>();

  const [log, setLog] = useState<RoutineLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Campos editáveis
  const [location, setLocation] = useState('');
  const [howFellAsleep, setHowFellAsleep] = useState('');
  const [awakenings, setAwakenings] = useState('');
  const [sleepType, setSleepType] = useState('');
  const [sleepPosition, setSleepPosition] = useState('');
  const [sleepQuality, setSleepQuality] = useState('');
  const [usedPacifier, setUsedPacifier] = useState(false);
  const [notes, setNotes] = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);

  const payload = useMemo<PayloadRecord>(() => {
    return isRecord(log?.payload) ? log.payload : {};
  }, [log?.payload]);

  useEffect(() => {
    if (!logId) return;

    (async () => {
      const { data } = await supabase
        .from('routine_logs')
        .select('*')
        .eq('id', logId)
        .maybeSingle();

      if (data) {
        const nextLog = data as RoutineLog;
        setLog(nextLog);
        loadFields(nextLog);
      }

      setLoading(false);
    })();
  }, [logId]);

  function loadFields(data: RoutineLog) {
    const p = isRecord(data.payload) ? data.payload : {};

    setLocation(asString(p.location) ?? '');
    setHowFellAsleep(asString(p.how_fell_asleep) ?? '');
    setAwakenings(asString(p.awakenings) ?? '');
    setSleepType(asString(p.sleep_type) ?? '');
    setSleepPosition(asString(p.sleep_position) ?? '');
    setSleepQuality(asString(p.sleep_quality) ?? '');
    setUsedPacifier(asBoolean(p.used_pacifier) ?? false);
    setNotes(getUserNotes(data.notes) ?? '');
    setIncludeInReport(asBoolean(p.include_in_report) ?? false);
  }

  async function reloadLog() {
    if (!log?.id) return;

    const { data } = await supabase
      .from('routine_logs')
      .select('*')
      .eq('id', log.id)
      .maybeSingle();

    if (data) {
      const nextLog = data as RoutineLog;
      setLog(nextLog);
      loadFields(nextLog);
    }
  }

  async function handleSave() {
    if (!log) return;

    setSaving(true);

    try {
      const nextPayload: PayloadRecord = {
        ...payload,
        location: location || undefined,
        how_fell_asleep: howFellAsleep || undefined,
        awakenings: awakenings || undefined,
        sleep_type: sleepType || undefined,
        sleep_position: sleepPosition || undefined,
        sleep_quality: sleepQuality || undefined,
        used_pacifier: usedPacifier ? true : undefined,
        include_in_report: includeInReport ? true : undefined,
      };

      const cleanedPayload = Object.fromEntries(
        Object.entries(cleanPayload(nextPayload)).filter(
          ([, value]) => value !== null && value !== ''
        )
      );

      const { error } = await supabase
        .from('routine_logs')
        .update({
          notes: notes.trim() || null,
          payload: cleanedPayload as unknown as import('@/integrations/supabase/types').Json,
        })
        .eq('id', log.id);

      if (error) throw error;

      toast({ title: '✓ Alterações salvas' });
      setIsEditing(false);
      await reloadLog();
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F5F0' }}>
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: SLEEP_COLOR }}
        />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F5F0' }}>
        <ScreenHeader title="Sono" onBack={() => navigate(-1)} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm font-nunito" style={{ color: TXT_MUTED }}>
            Registro não encontrado.
          </p>
        </div>
      </div>
    );
  }

  const isOngoing = !log.end_time;
  const duration = log.end_time ? fmtRangeDuration(log.start_time, log.end_time) : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F5F0' }}>
      <ScreenHeader
        title="Sono"
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
          {/* Summary card */}
          <div
            className="p-4 rounded-2xl"
            style={{ backgroundColor: SLEEP_BG, border: `1.5px solid ${SLEEP_BORDER}` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0"
                style={{ backgroundColor: SLEEP_LIGHT }}
              >
                😴
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold font-quicksand leading-tight" style={{ color: TXT }}>
                  {isOngoing ? 'Sono em andamento' : 'Sono'}
                  {sleepType ? ` · ${SLEEP_TYPE_LABEL[sleepType] ?? ''}` : ''}
                </p>
                <p className="text-[12px] font-semibold font-nunito mt-0.5" style={{ color: SLEEP_COLOR }}>
                  {fmtTime(log.start_time)}
                  {log.end_time && ` – ${fmtTime(log.end_time)}`}
                  {duration && ` · ${duration}`}
                </p>
              </div>
              {isOngoing && (
                <div
                  className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
                  style={{ backgroundColor: SLEEP_COLOR }}
                />
              )}
            </div>
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
                  style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
                >
                  <DetailRow label="Tipo" value={SLEEP_TYPE_LABEL[sleepType] ?? null} />
                  <DetailRow label="Onde dormiu" value={LOCATION_LABEL[location] ?? null} />
                  <DetailRow label="Como adormeceu" value={HOW_LABEL[howFellAsleep] ?? null} />
                  <DetailRow label="Posição" value={SLEEP_POSITION_LABEL[sleepPosition] ?? null} />
                  <DetailRow label="Como foi" value={SLEEP_QUALITY_LABEL[sleepQuality] ?? null} />
                  <DetailRow label="Acordou durante" value={AWAKENINGS_LABEL[awakenings] ?? null} />
                  <DetailRow label="Chupeta" value={usedPacifier ? 'Sim' : null} />
                  {notes && <DetailRow label="Observações" value={notes} />}
                  {includeInReport && <DetailRow label="Relatório médico" value="Incluído" />}
                </div>

                {!sleepType &&
                  !location &&
                  !howFellAsleep &&
                  !sleepPosition &&
                  !sleepQuality &&
                  !awakenings &&
                  !usedPacifier &&
                  !notes && (
                    <p className="text-center text-[13px] font-nunito py-4" style={{ color: TXT_MUTED }}>
                      Nenhuma informação adicional registrada.
                    </p>
                  )}

                {sleepPosition && sleepPosition !== 'costas' && (
                  <div
                    className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl"
                    style={{ backgroundColor: '#FDF3E9', border: '1px solid #f0d5b0' }}
                  >
                    <span className="text-[12px] flex-shrink-0">⚠️</span>
                    <p className="text-[11px] font-nunito leading-snug" style={{ color: '#7a5030' }}>
                      A AAP recomenda que bebês durmam sempre de costas até 1 ano para reduzir o risco de morte súbita.
                    </p>
                  </div>
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
                  <SectionLabel>Tipo de sono</SectionLabel>
                  <ChipGroup
                    options={SLEEP_TYPE_OPTIONS}
                    value={sleepType}
                    onToggle={(v) => setSleepType((p) => (p === v ? '' : v))}
                    accentColor={SLEEP_COLOR}
                  />
                </div>

                <div>
                  <SectionLabel>Onde dormiu?</SectionLabel>
                  <ChipGroup
                    options={SLEEP_LOCATION_OPTIONS}
                    value={location}
                    onToggle={(v) => setLocation((p) => (p === v ? '' : v))}
                    accentColor={SLEEP_COLOR}
                  />
                </div>

                <div>
                  <SectionLabel>Como adormeceu?</SectionLabel>
                  <ChipGroup
                    options={SLEEP_HOW_OPTIONS}
                    value={howFellAsleep}
                    onToggle={(v) => setHowFellAsleep((p) => (p === v ? '' : v))}
                    accentColor={SLEEP_COLOR}
                  />
                </div>

                <div>
                  <SectionLabel>Posição de sono</SectionLabel>
                  <ChipGroup
                    options={SLEEP_POSITION_OPTIONS}
                    value={sleepPosition}
                    onToggle={(v) => setSleepPosition((p) => (p === v ? '' : v))}
                    accentColor={SLEEP_COLOR}
                  />
                  {sleepPosition && sleepPosition !== 'costas' && (
                    <div
                      className="mt-2 flex items-start gap-2 px-3 py-2.5 rounded-xl"
                      style={{ backgroundColor: '#FDF3E9', border: '1px solid #f0d5b0' }}
                    >
                      <span className="text-[12px] flex-shrink-0">⚠️</span>
                      <p className="text-[11px] font-nunito leading-snug" style={{ color: '#7a5030' }}>
                        A AAP recomenda que bebês durmam sempre de costas até 1 ano.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <SectionLabel>Como foi o sono?</SectionLabel>
                  <ChipGroup
                    options={SLEEP_QUALITY_OPTIONS}
                    value={sleepQuality}
                    onToggle={(v) => setSleepQuality((p) => (p === v ? '' : v))}
                    accentColor={SLEEP_COLOR}
                  />
                </div>

                <div>
                  <SectionLabel>Acordou durante o sono?</SectionLabel>
                  <ChipGroup
                    options={AWAKENINGS_OPTIONS}
                    value={awakenings}
                    onToggle={(v) => setAwakenings((p) => (p === v ? '' : v))}
                    accentColor={SLEEP_COLOR}
                  />
                </div>

                <div className="flex items-center justify-between px-1">
                  <div>
                    <p className="text-[13px] font-bold font-quicksand" style={{ color: TXT }}>
                      Usou chupeta
                    </p>
                    <p className="text-[11px] font-nunito mt-0.5" style={{ color: TXT_MUTED }}>
                      A AAP recomenda chupeta durante o sono
                    </p>
                  </div>
                  <button
                    onClick={() => setUsedPacifier((v) => !v)}
                    className="w-12 h-6 rounded-full transition-all flex-shrink-0"
                    style={{
                      backgroundColor: usedPacifier ? SLEEP_COLOR : MUTED_BG,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full bg-white transition-all mx-0.5"
                      style={{ transform: usedPacifier ? 'translateX(24px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>

                <div className="h-px" style={{ backgroundColor: CARD_BORDER }} />

                <div>
                  <SectionLabel>Observações</SectionLabel>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Dormiu tranquilo, acordou uma vez..."
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
          primaryColor={SLEEP_COLOR}
        />
      ) : (
        <StickyFooterCTA
          primaryLabel={saving ? 'Salvando...' : 'Salvar alterações'}
          onPrimary={handleSave}
          primaryLoading={saving}
          primaryColor={SLEEP_COLOR}
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