/**
 * SleepDetailScreen — Full-screen read/edit view for a completed sleep session.
 *
 * Route: /sleep/detail/:logId
 * Anatomy: ScreenHeader → summary card → editable fields → StickyFooterCTA
 * 
 * Edit rule: inline editing, no modals. Explicit "Salvar alterações" CTA.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
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

export default function SleepDetailScreen() {
  const navigate = useNavigate();
  const { logId } = useParams<{ logId: string }>();

  const [log, setLog] = useState<RoutineLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

      if (location)        payload.location         = location;          else delete payload.location;
      if (howFellAsleep)   payload.how_fell_asleep   = howFellAsleep;    else delete payload.how_fell_asleep;
      if (awakenings)      payload.awakenings         = awakenings;      else delete payload.awakenings;
      if (includeInReport) payload.include_in_report  = true;            else delete payload.include_in_report;
      delete payload._notes;

      const { error } = await supabase
        .from('routine_logs')
        .update({ notes: makePayloadNotes(payload, notes) })
        .eq('id', log.id);

      if (error) throw error;
      toast({ title: '✓ Alterações salvas' });
      navigate(-1);
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ScreenHeader title="Sono" onBack={() => navigate(-1)} />

      <div className="ds-form-body">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Summary card */}
          <div
            className="flex items-center gap-4 p-4 rounded-2xl"
            style={{
              backgroundColor: `color-mix(in srgb, ${SLEEP_COLOR} 9%, hsl(var(--card)))`,
              border: `1.5px solid color-mix(in srgb, ${SLEEP_COLOR} 22%, transparent)`,
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0"
              style={{ backgroundColor: `color-mix(in srgb, ${SLEEP_COLOR} 18%, transparent)` }}
            >
              😴
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold font-quicksand text-foreground leading-tight">
                {isOngoing ? 'Sono em andamento' : 'Sono'}
              </p>
              <p className="text-[13px] font-semibold font-nunito mt-0.5" style={{ color: SLEEP_COLOR }}>
                {fmtTime(log.start_time)}
                {log.end_time && ` – ${fmtTime(log.end_time)}`}
                {duration && ` · ${duration}`}
              </p>
            </div>
            {isOngoing && (
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: SLEEP_COLOR }} />
            )}
          </div>

          {/* Location */}
          <div>
            <SectionLabel>Onde dormiu?</SectionLabel>
            <ChipGroup
              options={SLEEP_LOCATION_OPTIONS}
              value={location}
              onToggle={v => setLocation(p => p === v ? '' : v)}
              accentColor={SLEEP_COLOR}
            />
          </div>

          {/* How fell asleep */}
          <div>
            <SectionLabel>Como adormeceu?</SectionLabel>
            <ChipGroup
              options={SLEEP_HOW_OPTIONS}
              value={howFellAsleep}
              onToggle={v => setHowFellAsleep(p => p === v ? '' : v)}
              accentColor={SLEEP_COLOR}
            />
          </div>

          {/* Awakenings */}
          <div>
            <SectionLabel>Acordou durante o sono?</SectionLabel>
            <ChipGroup
              options={AWAKENINGS_OPTIONS}
              value={awakenings}
              onToggle={v => setAwakenings(p => p === v ? '' : v)}
              accentColor={SLEEP_COLOR}
            />
          </div>

          <div className="h-px" style={{ backgroundColor: 'hsl(var(--border))' }} />

          {/* Notes */}
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
      </div>

      <StickyFooterCTA
        primaryLabel={saving ? 'Salvando...' : 'Salvar alterações'}
        onPrimary={handleSave}
        primaryLoading={saving}
        primaryColor={SLEEP_COLOR}
      />
    </div>
  );
}
