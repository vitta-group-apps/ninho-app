/**
 * DiaperDetailScreen — READ-ONLY detail view for a diaper event.
 *
 * Route: /diaper/detail/:logId
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
import { parsePayload, makePayloadNotes, getUserNotes, fmtTime } from '@/lib/routineUtils';
import type { RoutineLog } from '@/lib/eventSystem';
import {
  DIAPER_KIND_LABEL, DIAPER_QUANTITY_LABEL, DIAPER_PEE_COLOR_LABEL,
  DIAPER_POOP_COLOR_LABEL, DIAPER_TEXTURE_LABEL,
} from '@/lib/eventSystem';
import {
  ScreenHeader, StickyFooterCTA, SectionLabel, ChipGroup, ReportToggle,
} from '@/components/ds';

// ── Cores fixas ──
const DIAPER_COLOR  = '#C8894A';
const DIAPER_BG     = '#FDF3E9';
const DIAPER_BORDER = '#f0d5b0';
const CARD_BG       = '#ffffff';
const CARD_BORDER   = '#E5E0D8';
const MUTED_BG      = '#E8E8E2';
const TXT           = '#2C2C2C';
const TXT_MUTED     = '#7A7A7A';

type DiaperKind = 'pee' | 'poop' | 'both';

const KIND_OPTIONS: { kind: DiaperKind; emoji: string; label: string }[] = [
  { kind: 'pee',  emoji: '💛', label: 'Xixi' },
  { kind: 'poop', emoji: '💩', label: 'Cocô' },
  { kind: 'both', emoji: '🔄', label: 'Xixi + Cocô' },
];

const QUANTITY_OPTIONS   = Object.entries(DIAPER_QUANTITY_LABEL).map(([v, l]) => ({ value: v, label: l }));
const PEE_COLOR_OPTIONS  = Object.entries(DIAPER_PEE_COLOR_LABEL).map(([v, l]) => ({ value: v, label: l }));
const POOP_COLOR_OPTIONS = Object.entries(DIAPER_POOP_COLOR_LABEL).map(([v, l]) => ({ value: v, label: l }));
const TEXTURE_OPTIONS    = Object.entries(DIAPER_TEXTURE_LABEL).map(([v, l]) => ({ value: v, label: l }));

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

export default function DiaperDetailScreen() {
  const navigate = useNavigate();
  const { logId } = useParams<{ logId: string }>();

  const [log, setLog]         = useState<RoutineLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [kind, setKind]               = useState<DiaperKind | null>(null);
  const [quantity, setQuantity]       = useState('');
  const [peeColor, setPeeColor]       = useState('');
  const [poopColor, setPoopColor]     = useState('');
  const [texture, setTexture]         = useState('');
  const [notes, setNotes]             = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);

  useEffect(() => {
    if (!logId) return;
    (async () => {
      const { data } = await supabase.from('routine_logs').select('*').eq('id', logId).maybeSingle();
      if (data) {
        setLog(data);
        const p = parsePayload(data.notes);
        const k = String(p.kind ?? p.diaper_type ?? '') as DiaperKind;
        if (['pee', 'poop', 'both'].includes(k)) setKind(k);
        setQuantity(String(p.quantity ?? ''));
        setPeeColor(String(p.pee_color ?? ''));
        setPoopColor(String(p.poop_color ?? ''));
        setTexture(String(p.poop_texture ?? ''));
        setNotes(getUserNotes(data.notes) ?? '');
        setIncludeInReport(Boolean(p.include_in_report));
      }
      setLoading(false);
    })();
  }, [logId]);

  function resetFields(logData: RoutineLog) {
    const p = parsePayload(logData.notes);
    const k = String(p.kind ?? p.diaper_type ?? '') as DiaperKind;
    if (['pee', 'poop', 'both'].includes(k)) setKind(k); else setKind(null);
    setQuantity(String(p.quantity ?? ''));
    setPeeColor(String(p.pee_color ?? ''));
    setPoopColor(String(p.poop_color ?? ''));
    setTexture(String(p.poop_texture ?? ''));
    setNotes(getUserNotes(logData.notes) ?? '');
    setIncludeInReport(Boolean(p.include_in_report));
  }

  async function handleSave() {
    if (!log || !kind) { toast({ title: 'Selecione o tipo de fralda', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const existing = parsePayload(log.notes);
      const payload: Record<string, unknown> = { ...existing, kind };
      if (quantity)              payload.quantity          = quantity;   else delete payload.quantity;
      if (showPee && peeColor)   payload.pee_color         = peeColor;   else delete payload.pee_color;
      if (showPoop && poopColor) payload.poop_color        = poopColor;  else delete payload.poop_color;
      if (showPoop && texture)   payload.poop_texture      = texture;    else delete payload.poop_texture;
      if (includeInReport)       payload.include_in_report = true;       else delete payload.include_in_report;
      delete payload._notes;

      const { error } = await supabase.from('routine_logs')
        .update({ notes: makePayloadNotes(payload, notes) }).eq('id', log.id);
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
          style={{ borderColor: DIAPER_COLOR }} />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F5F0' }}>
        <ScreenHeader title="Fralda" onBack={() => navigate(-1)} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm font-nunito" style={{ color: TXT_MUTED }}>Registro não encontrado.</p>
        </div>
      </div>
    );
  }

  const p            = parsePayload(log.notes);
  const kindKey      = String(p.kind ?? p.diaper_type ?? '');
  const kindLabel    = DIAPER_KIND_LABEL[kindKey] ?? 'Fralda';
  const quantityLabel  = DIAPER_QUANTITY_LABEL[String(p.quantity ?? '')] ?? null;
  const peeColorLabel  = DIAPER_PEE_COLOR_LABEL[String(p.pee_color ?? '')] ?? null;
  const poopColorLabel = DIAPER_POOP_COLOR_LABEL[String(p.poop_color ?? '')] ?? null;
  const textureLabel   = DIAPER_TEXTURE_LABEL[String(p.poop_texture ?? '')] ?? null;
  const readNotes      = getUserNotes(log.notes);
  const readInclude    = Boolean(p.include_in_report);
  const kindEmoji      = kindKey === 'pee' ? '💛' : kindKey === 'poop' ? '💩' : kindKey === 'both' ? '🔄' : '🧷';
  const readShowPee    = kindKey === 'pee'  || kindKey === 'both';
  const readShowPoop   = kindKey === 'poop' || kindKey === 'both';
  const showPee        = kind === 'pee'  || kind === 'both';
  const showPoop       = kind === 'poop' || kind === 'both';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F5F0' }}>
      <ScreenHeader
        title="Fralda"
        onBack={() => { if (isEditing) { resetFields(log); setIsEditing(false); } else { navigate(-1); } }}
      />

      <div className="ds-form-body">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }} className="space-y-5">

          {/* Summary card */}
          <div className="p-4 rounded-2xl"
            style={{ backgroundColor: DIAPER_BG, border: `1.5px solid ${DIAPER_BORDER}` }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0"
                style={{ backgroundColor: '#fde8d0' }}>
                {kindEmoji}
              </div>
              <div>
                <p className="text-[14px] font-bold font-quicksand leading-tight" style={{ color: TXT }}>
                  {kindLabel}
                </p>
                <p className="text-[12px] font-semibold font-nunito mt-0.5" style={{ color: TXT_MUTED }}>
                  {fmtTime(log.start_time)}{quantityLabel ? ` · ${quantityLabel}` : ''}
                </p>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div key="read" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <div className="rounded-2xl px-4 overflow-hidden"
                  style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                  <DetailRow label="Tipo"         value={kindLabel} />
                  <DetailRow label="Quantidade"   value={quantityLabel} />
                  {readShowPee  && <DetailRow label="Cor do xixi"   value={peeColorLabel} />}
                  {readShowPoop && <DetailRow label="Cor do cocô"   value={poopColorLabel} />}
                  {readShowPoop && <DetailRow label="Consistência"  value={textureLabel} />}
                  <DetailRow label="Observações"  value={readNotes ?? null} />
                  {readInclude  && <DetailRow label="Relatório médico" value="Incluído" />}
                </div>
                {!quantityLabel && !peeColorLabel && !poopColorLabel && !textureLabel && !readNotes && (
                  <p className="text-center text-[13px] font-nunito py-4" style={{ color: TXT_MUTED }}>
                    Nenhuma informação adicional registrada.
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div key="edit" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="space-y-6">

                {/* Kind selector */}
                <div>
                  <SectionLabel>O que tinha na fralda?</SectionLabel>
                  <div className="flex gap-3">
                    {KIND_OPTIONS.map(opt => {
                      const isActive = kind === opt.kind;
                      return (
                        <button key={opt.kind} onClick={() => setKind(opt.kind)}
                          className="flex-1 flex flex-col items-center gap-2 py-4 px-2 rounded-2xl font-bold transition-all active:scale-95 font-nunito"
                          style={{
                            backgroundColor: isActive ? DIAPER_BG : CARD_BG,
                            border: `2px solid ${isActive ? DIAPER_COLOR : CARD_BORDER}`,
                            boxShadow: isActive ? '0 2px 8px rgba(200,137,74,0.18)' : 'none',
                            cursor: 'pointer',
                          }}>
                          <span className="text-[24px]">{opt.emoji}</span>
                          <p className="text-[12px] font-bold leading-tight text-center"
                            style={{ color: isActive ? DIAPER_COLOR : TXT }}>
                            {opt.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="h-px" style={{ backgroundColor: CARD_BORDER }} />

                <div>
                  <SectionLabel>Quantidade</SectionLabel>
                  <ChipGroup options={QUANTITY_OPTIONS} value={quantity}
                    onToggle={v => setQuantity(prev => prev === v ? '' : v)} accentColor={DIAPER_COLOR} />
                </div>

                {showPee && (
                  <div>
                    <SectionLabel>Cor do xixi</SectionLabel>
                    <ChipGroup options={PEE_COLOR_OPTIONS} value={peeColor}
                      onToggle={v => setPeeColor(prev => prev === v ? '' : v)} accentColor={DIAPER_COLOR} />
                  </div>
                )}

                {showPoop && (
                  <div className="space-y-4">
                    <div>
                      <SectionLabel>Cor do cocô</SectionLabel>
                      <ChipGroup options={POOP_COLOR_OPTIONS} value={poopColor}
                        onToggle={v => setPoopColor(prev => prev === v ? '' : v)} accentColor={DIAPER_COLOR} />
                    </div>
                    <div>
                      <SectionLabel>Consistência</SectionLabel>
                      <ChipGroup options={TEXTURE_OPTIONS} value={texture}
                        onToggle={v => setTexture(prev => prev === v ? '' : v)} accentColor={DIAPER_COLOR} />
                    </div>
                  </div>
                )}

                <div className="h-px" style={{ backgroundColor: CARD_BORDER }} />

                <div>
                  <SectionLabel>Observações</SectionLabel>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Alguma observação sobre esta fralda..."
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
          primaryColor={DIAPER_COLOR}
        />
      ) : (
        <StickyFooterCTA
          primaryLabel={saving ? 'Salvando...' : 'Salvar alterações'}
          onPrimary={handleSave}
          primaryLoading={saving}
          primaryDisabled={!kind}
          primaryColor={DIAPER_COLOR}
          secondaryLabel="Cancelar"
          onSecondary={() => { resetFields(log); setIsEditing(false); }}
        />
      )}
    </div>
  );
}
