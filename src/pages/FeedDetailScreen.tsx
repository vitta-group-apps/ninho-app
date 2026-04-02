/**
 * FeedDetailScreen — READ-ONLY detail view for a breastfeeding session.
 *
 * Route: /feed/detail/:logId
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
import { getUserNotes, fmtDurationShort, fmtTime } from '@/lib/routineUtils';
import {
  asObject,
  asStringArray,
  readBoolean,
  type PayloadRecord,
} from '@/lib/eventPayload';
import type { Json } from '@/integrations/supabase/types';
import type { RoutineLog } from '@/lib/eventSystem';
import {
  ScreenHeader, StickyFooterCTA, SectionLabel, ChipGroup, ReportToggle,
} from '@/components/ds';

// ── Cores fixas ──
const FEED_COLOR   = '#789687';
const FEED_BG      = '#ebf0ed';
const FEED_BORDER  = '#ccd9d3';
const FEED_LIGHT   = '#f0f5f2';
const CARD_BG      = '#ffffff';
const CARD_BORDER  = '#E5E0D8';
const MUTED_BG     = '#E8E8E2';
const TXT          = '#2C2C2C';
const TXT_MUTED    = '#7A7A7A';
const MAUVE        = '#806e84';

const QUICK_TAGS = [
  { value: 'mamou_bem',     label: '😊 Mamou bem' },
  { value: 'inquieto',      label: '😟 Inquieto' },
  { value: 'dormiu',        label: '😴 Dormiu durante' },
  { value: 'pega_boa',      label: '👍 Pega boa' },
  { value: 'rejeitou_lado', label: '↩️ Rejeitou lado' },
];

const TAG_LABEL: Record<string, string> = {
  mamou_bem: 'Mamou bem', inquieto: 'Inquieto', dormiu: 'Dormiu durante',
  pega_boa: 'Pega boa', rejeitou_lado: 'Rejeitou lado',
};

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-3 last:border-0"
      style={{ borderBottom: `1px solid ${CARD_BORDER}` }}>
      <p className="text-[13px] font-nunito flex-shrink-0" style={{ color: TXT_MUTED }}>{label}</p>
      <p className="text-[13px] font-semibold font-nunito text-right" style={{ color: TXT }}>{value}</p>
    </div>
  );
}

export default function FeedDetailScreen() {
  const navigate = useNavigate();
  const { logId } = useParams<{ logId: string }>();

  const [log, setLog]         = useState<RoutineLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [tags, setTags]                     = useState<string[]>([]);
  const [notes, setNotes]                   = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);

  useEffect(() => {
    if (!logId) return;
    (async () => {
      const { data } = await supabase
        .from('routine_logs').select('*').eq('id', logId).maybeSingle();
      if (data) {
        setLog(data);
        const p = asObject(data.payload);
        setTags(asStringArray(p.tags));
        setNotes(getUserNotes(data.notes) ?? '');
        setIncludeInReport(readBoolean(p, 'include_in_report', 'includeInReport') ?? false);
      }
      setLoading(false);
    })();
  }, [logId]);

  async function handleSave() {
    if (!log) return;
    setSaving(true);
    try {
      const existing = asObject(log.payload);
      const payload: Record<string, unknown> = { ...existing };
      if (tags.length > 0) payload.tags = tags.join(','); else delete payload.tags;
      if (includeInReport) payload.include_in_report = true; else delete payload.include_in_report;

      const { error } = await supabase
        .from('routine_logs').update({
          payload: payload as unknown as Json,
          notes: notes.trim() || null,
        }).eq('id', log.id);
      if (error) throw error;
      toast({ title: '✓ Alterações salvas' });
      setIsEditing(false);
      const { data } = await supabase.from('routine_logs').select('*').eq('id', log.id).maybeSingle();
      if (data) setLog(data);
    } catch (e: unknown) {
      toast({ title: 'Erro ao salvar', description: e instanceof Error ? e.message : 'Tente novamente', variant: 'destructive' });
    } finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F5F0' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: FEED_COLOR }} />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F5F0' }}>
        <ScreenHeader title="Amamentação" onBack={() => navigate(-1)} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm font-nunito" style={{ color: TXT_MUTED }}>Registro não encontrado.</p>
        </div>
      </div>
    );
  }

  const p         = asObject(log.payload);
  const totalSec  = Number(p.total_seconds ?? p.totalSeconds ?? 0);
  const leftSec   = Number(p.left_seconds ?? p.leftSeconds ?? 0);
  const rightSec  = Number(p.right_seconds ?? p.rightSeconds ?? 0);
  const switches  = Number(p.switches ?? 0);
  const endTime   = log.end_time ? fmtTime(log.end_time) : null;
  const tagLabels = tags.map(t => TAG_LABEL[t] ?? t).join(', ');

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F5F0' }}>
      <ScreenHeader
        title="Amamentação"
        onBack={() => { if (isEditing) { setIsEditing(false); } else { navigate(-1); } }}
      />

      <div className="ds-form-body">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }} className="space-y-5">

          {/* Summary card */}
          <div className="p-4 rounded-2xl"
            style={{ backgroundColor: FEED_BG, border: `1.5px solid ${FEED_BORDER}` }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0"
                style={{ backgroundColor: FEED_LIGHT }}>
                🤱
              </div>
              <div>
                <p className="text-[14px] font-bold font-quicksand leading-tight" style={{ color: TXT }}>
                  Amamentação
                </p>
                <p className="text-[12px] font-semibold font-nunito mt-0.5" style={{ color: TXT_MUTED }}>
                  {fmtTime(log.start_time)}{endTime ? ` – ${endTime}` : ''}
                </p>
              </div>
            </div>

            {totalSec > 0 && (
              <div className="text-center mb-2">
                <p className="text-[36px] font-bold tabular-nums font-quicksand leading-none"
                  style={{ color: FEED_COLOR }}>
                  {fmtDurationShort(totalSec)}
                </p>
                <p className="text-[11px] mt-1 font-nunito" style={{ color: TXT_MUTED }}>duração total</p>
              </div>
            )}

            {(leftSec > 0 || rightSec > 0) && (
              <div className="flex gap-2 mt-3">
                {[
                  { label: 'Esquerdo', value: fmtDurationShort(leftSec), color: FEED_COLOR },
                  { label: 'Trocas',   value: String(switches),          color: TXT },
                  { label: 'Direito',  value: fmtDurationShort(rightSec), color: MAUVE },
                ].map(s => (
                  <div key={s.label} className="flex-1 rounded-xl p-2.5 text-center"
                    style={{ backgroundColor: MUTED_BG }}>
                    <p className="text-[9px] font-bold uppercase tracking-wide font-nunito"
                      style={{ color: TXT_MUTED }}>
                      {s.label}
                    </p>
                    <p className="text-[16px] font-bold font-quicksand mt-0.5" style={{ color: s.color }}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div key="read" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <div className="rounded-2xl px-4 overflow-hidden"
                  style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                  <DetailRow label="Como foi"       value={tagLabels || null} />
                  <DetailRow label="Observações"    value={notes || null} />
                  <DetailRow label="Relatório médico" value={includeInReport ? 'Incluído' : null} />
                </div>
                {!tagLabels && !notes && !includeInReport && (
                  <p className="text-center text-[13px] font-nunito py-4" style={{ color: TXT_MUTED }}>
                    Nenhuma informação adicional registrada.
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div key="edit" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="space-y-6">
                <div>
                  <SectionLabel>Como foi a mamada?</SectionLabel>
                  <ChipGroup
                    options={QUICK_TAGS}
                    values={tags}
                    onToggle={id => setTags(p => p.includes(id) ? p.filter(t => t !== id) : [...p, id])}
                    accentColor={FEED_COLOR}
                    multiSelect
                  />
                </div>
                <div className="h-px" style={{ backgroundColor: CARD_BORDER }} />
                <div>
                  <SectionLabel>Observações</SectionLabel>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Como foi a mamada? Alguma observação..."
                    className="ds-textarea" rows={3} />
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
          primaryColor={FEED_COLOR}
        />
      ) : (
        <StickyFooterCTA
          primaryLabel={saving ? 'Salvando...' : 'Salvar alterações'}
          onPrimary={handleSave}
          primaryLoading={saving}
          primaryColor={FEED_COLOR}
          secondaryLabel="Cancelar"
          onSecondary={() => {
            if (log) {
              const pp = asObject(log.payload);
              const rawTags = pp.tags;
              setTags(Array.isArray(rawTags) ? rawTags.filter((t): t is string => typeof t === 'string') : String(rawTags ?? '').split(',').filter(Boolean));
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