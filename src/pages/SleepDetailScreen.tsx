/**
 * SleepDetailScreen — READ-ONLY detail view for a completed sleep session.
 *
 * Route: /sleep/detail/:logId
 *
 * UX Rule (global):
 *   - Opens in READ mode: displays data, NO editable inputs
 *   - "Editar" CTA → toggles to EDIT mode in same screen
 *   - In edit mode: "Salvar alterações" is the only primary CTA
 *
 * DS: ScreenHeader · SectionLabel · ChipGroup · ReportToggle · StickyFooterCTA
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { parsePayload, makePayloadNotes, getUserNotes, fmtRangeDuration, fmtTime } from '@/lib/routineUtils';
import type { RoutineLog } from '@/lib/eventSystem';
import {
  ScreenHeader,
  StickyFooterCTA,
  SectionLabel,
  ChipGroup,
  ReportToggle,
} from '@/components/ds';

const SLEEP_COLOR = 'hsl(var(--color-sleep))';

const SLEEP_LOCATION_OPTIONS = [
  { value: 'berco',    label: '🛏 Berço' },
  { value: 'colo',     label: '🤱 Colo' },
  { value: 'carrinho', label: '🛒 Carrinho' },
  { value: 'cama',     label: '🛌 Cama' },
  { value: 'outro',    label: '📦 Outro' },
];

const SLEEP_HOW_OPTIONS = [
  { value: 'sozinho', label: 'Sozinho' },
  { value: 'mamando', label: 'Mamando' },
  { value: 'colo',    label: 'No colo' },
  { value: 'embalo',  label: 'No embalo' },
  { value: 'outro',   label: 'Outro' },
];

const AWAKENINGS_OPTIONS = [
  { value: '0',  label: 'Nenhuma vez' },
  { value: '1',  label: '1 vez' },
  { value: '2',  label: '2 vezes' },
  { value: '3+', label: '3 ou mais' },
];

const LOCATION_LABEL: Record<string, string> = {
  berco: 'Berço', colo: 'Colo', carrinho: 'Carrinho', cama: 'Cama', outro: 'Outro',
};
const HOW_LABEL: Record<string, string> = {
  sozinho: 'Sozinho', mamando: 'Mamando', colo: 'No colo', embalo: 'No embalo', outro: 'Outro',
};
const AWAKENINGS_LABEL: Record<string, string> = {
  '0': 'Nenhuma vez', '1': '1 vez', '2': '2 vezes', '3+': '3 ou mais',
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

export default function SleepDetailScreen() {
  const navigate = useNavigate();
  const { logId } = useParams<{ logId: string }>();

  const [log, setLog] = useState<RoutineLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields
  const [location, setLocation] = useState('');
  const [howFellAsleep, setHowFellAsleep] = useState('');
  const [awakenings, setAwakenings] = useState('');
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
        const p = parsePayload(data.notes);
        setLocation(String(p.location ?? ''));
        setHowFellAsleep(String(p.how_fell_asleep ?? ''));
        setAwakenings(String(p.awakenings ?? ''));
        setNotes(getUserNotes(data.notes) ?? '');
        setIncludeInReport(Boolean(p.include_in_report));
      }
      setLoading(false);
    })();
  }, [logId]);

  async function handleSave() {
    if (!log) return;
    setSaving(true);
    try {
      const existing = parsePayload(log.notes);
      const payload: Record<string, unknown> = { ...existing };

      if (location)        payload.location         = location;       else delete payload.location;
      if (howFellAsleep)   payload.how_fell_asleep   = howFellAsleep;  else delete payload.how_fell_asleep;
      if (awakenings)      payload.awakenings         = awakenings;    else delete payload.awakenings;
      if (includeInReport) payload.include_in_report  = true;          else delete payload.include_in_report;
      delete payload._notes;

      const { error } = await supabase
        .from('routine_logs')
        .update({ notes: makePayloadNotes(payload, notes) })
        .eq('id', log.id);

      if (error) throw error;
      toast({ title: '✓ Alterações salvas' });
      setIsEditing(false);
      // Refresh log
      const { data } = await supabase.from('routine_logs').select('*').eq('id', log.id).maybeSingle();
      if (data) setLog(data);
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
        <ScreenHeader title="Sono" onBack={() => navigate(-1)} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground font-nunito text-sm">Registro não encontrado.</p>
        </div>
      </div>
    );
  }

  const isOngoing = !log.end_time;
  const duration = log.end_time ? fmtRangeDuration(log.start_time, log.end_time) : null;
  const p = parsePayload(log.notes);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ScreenHeader
        title="Sono"
        onBack={() => {
          if (isEditing) {
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
          {/* ── Summary card — always visible ────────────────────────────── */}
          <div
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: `color-mix(in srgb, ${SLEEP_COLOR} 9%, hsl(var(--card)))`,
              border: `1.5px solid color-mix(in srgb, ${SLEEP_COLOR} 22%, transparent)`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0"
                style={{ backgroundColor: `color-mix(in srgb, ${SLEEP_COLOR} 18%, transparent)` }}
              >
                😴
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold font-quicksand text-foreground leading-tight">
                  {isOngoing ? 'Sono em andamento' : 'Sono'}
                </p>
                <p className="text-[12px] font-semibold font-nunito mt-0.5" style={{ color: SLEEP_COLOR }}>
                  {fmtTime(log.start_time)}
                  {log.end_time && ` – ${fmtTime(log.end_time)}`}
                  {duration && ` · ${duration}`}
                </p>
              </div>
              {isOngoing && (
                <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: SLEEP_COLOR }} />
              )}
            </div>
          </div>

          {/* ── READ MODE ─────────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div
                key="read"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* Detail rows */}
                <div
                  className="rounded-2xl px-4 overflow-hidden"
                  style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                >
                  <DetailRow label="Onde dormiu" value={LOCATION_LABEL[location] ?? null} />
                  <DetailRow label="Como adormeceu" value={HOW_LABEL[howFellAsleep] ?? null} />
                  <DetailRow label="Acordou durante" value={AWAKENINGS_LABEL[awakenings] ?? null} />
                  {notes && <DetailRow label="Observações" value={notes} />}
                  {includeInReport && <DetailRow label="Relatório médico" value="Incluído" />}
                </div>

                {/* If no data filled in yet */}
                {!location && !howFellAsleep && !awakenings && !notes && (
                  <p className="text-center text-[13px] text-muted-foreground font-nunito py-4">
                    Nenhuma informação adicional registrada.
                  </p>
                )}
              </motion.div>
            ) : (
              /* ── EDIT MODE ──────────────────────────────────────────────── */
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                <div>
                  <SectionLabel>Onde dormiu?</SectionLabel>
                  <ChipGroup
                    options={SLEEP_LOCATION_OPTIONS}
                    value={location}
                    onToggle={v => setLocation(prev => prev === v ? '' : v)}
                    accentColor={SLEEP_COLOR}
                  />
                </div>

                <div>
                  <SectionLabel>Como adormeceu?</SectionLabel>
                  <ChipGroup
                    options={SLEEP_HOW_OPTIONS}
                    value={howFellAsleep}
                    onToggle={v => setHowFellAsleep(prev => prev === v ? '' : v)}
                    accentColor={SLEEP_COLOR}
                  />
                </div>

                <div>
                  <SectionLabel>Acordou durante o sono?</SectionLabel>
                  <ChipGroup
                    options={AWAKENINGS_OPTIONS}
                    value={awakenings}
                    onToggle={v => setAwakenings(prev => prev === v ? '' : v)}
                    accentColor={SLEEP_COLOR}
                  />
                </div>

                <div className="h-px" style={{ backgroundColor: 'hsl(var(--border))' }} />

                <div>
                  <SectionLabel>Observações</SectionLabel>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
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

      {/* CTA: READ → "Editar" | EDIT → "Salvar alterações" */}
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
            // Reset to last saved state
            if (log) {
              const pp = parsePayload(log.notes);
              setLocation(String(pp.location ?? ''));
              setHowFellAsleep(String(pp.how_fell_asleep ?? ''));
              setAwakenings(String(pp.awakenings ?? ''));
              setNotes(getUserNotes(log.notes) ?? '');
              setIncludeInReport(Boolean(pp.include_in_report));
            }
            setIsEditing(false);
          }}
        />
      )}
    </div>
  );
}
