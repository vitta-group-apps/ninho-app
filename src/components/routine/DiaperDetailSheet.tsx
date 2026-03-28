 /**
 * DiaperDetailSheet — View and edit a saved diaper event.
 *
 * Contrato novo:
 *  - payload estruturado
 *  - notes humano
 *  - startTime / endTime
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getUserNotes, fmtTime } from '@/lib/eventSystem';
import type { RoutineRecord } from '@/lib/contracts/routine';
import {
  DIAPER_KIND_LABEL,
  DIAPER_QUANTITY_LABEL,
  DIAPER_PEE_COLOR_LABEL,
  DIAPER_POOP_COLOR_LABEL,
  DIAPER_TEXTURE_LABEL,
  isDiaperSignificant,
} from '@/lib/eventSystem';

// ─── Constants ───────────────────────────────────────────────────────────────

const ORANGE = 'hsl(32,80%,57%)';
const font = 'Nunito, sans-serif';

const QUANTITY_OPTIONS = Object.entries(DIAPER_QUANTITY_LABEL).map(([v, l]) => ({
  value: v,
  label: l,
}));
const PEE_COLOR_OPTIONS = Object.entries(DIAPER_PEE_COLOR_LABEL).map(([v, l]) => ({
  value: v,
  label: l,
}));
const POOP_COLOR_OPTIONS = Object.entries(DIAPER_POOP_COLOR_LABEL).map(([v, l]) => ({
  value: v,
  label: l,
}));
const TEXTURE_OPTIONS = Object.entries(DIAPER_TEXTURE_LABEL).map(([v, l]) => ({
  value: v,
  label: l,
}));

type DiaperDetailLog = RoutineRecord<'diaper'>;

// ─── Sub-components ──────────────────────────────────────────────────────────

function ChipRow({
  options,
  value,
  onToggle,
  disabled = false,
  wrap = false,
}: {
  options: { value: string; label: string }[];
  value: string;
  onToggle: (v: string) => void;
  disabled?: boolean;
  wrap?: boolean;
}) {
  return (
    <div className={`flex gap-2 ${wrap ? 'flex-wrap' : 'overflow-x-auto pb-1'}`}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => !disabled && onToggle(opt.value)}
          disabled={disabled}
          className="py-2 px-3 rounded-2xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap flex-shrink-0 disabled:opacity-60"
          style={{
            backgroundColor: value === opt.value ? ORANGE : 'hsl(var(--muted))',
            color: value === opt.value ? 'white' : 'hsl(var(--ninho-brown))',
            fontFamily: font,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between py-2.5 border-b last:border-0"
      style={{ borderColor: 'hsl(var(--border))' }}
    >
      <span
        className="text-xs font-semibold"
        style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}
      >
        {label}
      </span>
      <span
        className="text-sm font-bold"
        style={{ color: 'hsl(var(--ninho-brown))', fontFamily: font }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface DiaperDetailSheetProps {
  log: DiaperDetailLog | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

// ─── Main component ──────────────────────────────────────────────────────────

export function DiaperDetailSheet({
  log,
  open,
  onClose,
  onUpdated,
}: DiaperDetailSheetProps) {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [quantity, setQuantity] = useState('');
  const [peeColor, setPeeColor] = useState('');
  const [poopColor, setPoopColor] = useState('');
  const [texture, setTexture] = useState('');
  const [notes, setNotes] = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);

  useEffect(() => {
    if (open && log) {
      setEditMode(false);

      const payload = log.payload ?? {};
      setQuantity(typeof payload.quantity === 'string' ? payload.quantity : '');
      setPeeColor(typeof payload.peeColor === 'string' ? payload.peeColor : '');
      setPoopColor(typeof payload.poopColor === 'string' ? payload.poopColor : '');
      setTexture(typeof payload.poopTexture === 'string' ? payload.poopTexture : '');
      setNotes(getUserNotes(log.notes) ?? '');
      setIncludeInReport(
        typeof payload.includeInReport === 'boolean' ? payload.includeInReport : false
      );
    }
  }, [open, log]);

  if (!log) return null;

  const payload = log.payload ?? {};
  const kind =
    payload.pee === true && payload.poop === true
      ? 'both'
      : payload.poop === true
      ? 'poop'
      : 'pee';

  const showPee = kind === 'pee' || kind === 'both';
  const showPoop = kind === 'poop' || kind === 'both';

  const kindLabel = DIAPER_KIND_LABEL[kind] ?? 'Fralda';
  const isSignificant = isDiaperSignificant({
    kind,
    pee_color: typeof payload.pee_color === 'string' ? payload.pee_color : (typeof payload.peeColor === 'string' ? payload.peeColor : null),
    poop_color: typeof payload.poop_color === 'string' ? payload.poop_color : (typeof payload.poopColor === 'string' ? payload.poopColor : null),
    poop_texture: typeof payload.poop_texture === 'string' ? payload.poop_texture : (typeof payload.poopTexture === 'string' ? payload.poopTexture : null),
    quantity: typeof payload.quantity === 'string' ? payload.quantity : null,
  });

  async function handleSave() {
    setSaving(true);

    try {
      const updatedPayload: Record<string, unknown> = {
        ...payload,
        quantity: quantity || null,
        peeColor: showPee ? peeColor || null : null,
        poopColor: showPoop ? poopColor || null : null,
        poopTexture: showPoop ? texture || null : null,
        includeInReport,
      };

      const { error } = await supabase
        .from('routine_logs')
        .update({
          notes: notes.trim() || null,
          payload: updatedPayload,
        })
        .eq('id', log.id);

      if (error) throw error;

      toast({ title: '✓ Alterações salvas' });
      setEditMode(false);
      onUpdated();
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

  const userNote = getUserNotes(log.notes);

  return (
    <Sheet
      open={open}
      onOpenChange={v => {
        if (!v) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-3xl pb-safe"
        style={{ backgroundColor: 'hsl(var(--card))' }}
      >
        <VisuallyHidden>
          <SheetTitle>Detalhes da fralda</SheetTitle>
        </VisuallyHidden>

        <div className="px-1 pt-2 pb-6 max-h-[85vh] overflow-y-auto space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
                style={{ backgroundColor: 'hsl(32,80%,57%,0.12)' }}
              >
                🧷
              </div>

              <div>
                <p
                  className="text-base font-bold leading-tight"
                  style={{
                    color: 'hsl(var(--ninho-brown))',
                    fontFamily: 'Quicksand, sans-serif',
                  }}
                >
                  Fralda
                </p>
                <p
                  className="text-xs font-semibold"
                  style={{ color: ORANGE, fontFamily: font }}
                >
                  {kindLabel} · {fmtTime(log.startTime)}
                </p>
              </div>
            </div>

            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95"
                style={{
                  backgroundColor: 'hsl(var(--muted))',
                  color: 'hsl(var(--ninho-brown))',
                  fontFamily: font,
                }}
              >
                ✏️ Editar
              </button>
            )}
          </div>

          {isSignificant && !editMode && (
            <div
              className="px-4 py-3 rounded-2xl"
              style={{ backgroundColor: 'hsl(var(--muted))' }}
            >
              <p
                className="text-xs font-semibold"
                style={{
                  color: 'hsl(var(--muted-foreground))',
                  fontFamily: font,
                }}
              >
                ℹ️ Esta troca tem informações que podem ser úteis em uma consulta
                médica.
              </p>
            </div>
          )}

          {!editMode && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0">
              {typeof payload.quantity === 'string' && payload.quantity && (
                <DetailRow
                  label="Quantidade"
                  value={DIAPER_QUANTITY_LABEL[payload.quantity] ?? payload.quantity}
                />
              )}

              {typeof payload.peeColor === 'string' && payload.peeColor && (
                <DetailRow
                  label="Cor do xixi"
                  value={DIAPER_PEE_COLOR_LABEL[payload.peeColor] ?? payload.peeColor}
                />
              )}

              {typeof payload.poopColor === 'string' && payload.poopColor && (
                <DetailRow
                  label="Cor do cocô"
                  value={
                    DIAPER_POOP_COLOR_LABEL[payload.poopColor] ?? payload.poopColor
                  }
                />
              )}

              {typeof payload.poopTexture === 'string' && payload.poopTexture && (
                <DetailRow
                  label="Consistência"
                  value={
                    DIAPER_TEXTURE_LABEL[payload.poopTexture] ?? payload.poopTexture
                  }
                />
              )}

              {payload.includeInReport === true && (
                <DetailRow label="Relatório médico" value="Incluído ✓" />
              )}

              {userNote && (
                <div className="pt-3">
                  <p
                    className="text-xs font-semibold mb-1.5"
                    style={{
                      color: 'hsl(var(--muted-foreground))',
                      fontFamily: font,
                    }}
                  >
                    Observações
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: 'hsl(var(--ninho-brown))', fontFamily: font }}
                  >
                    {userNote}
                  </p>
                </div>
              )}

              {!payload.quantity &&
                !payload.peeColor &&
                !payload.poopColor &&
                !payload.poopTexture &&
                !userNote &&
                !payload.includeInReport && (
                  <div className="py-4 text-center">
                    <p
                      className="text-xs"
                      style={{
                        color: 'hsl(var(--muted-foreground))',
                        fontFamily: font,
                      }}
                    >
                      Sem detalhes adicionados. Toque em Editar para enriquecer este
                      registro.
                    </p>
                  </div>
                )}
            </motion.div>
          )}

          {editMode && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="space-y-2">
                <Label
                  className="text-xs font-semibold"
                  style={{ color: 'hsl(var(--ninho-brown))' }}
                >
                  Quantidade
                </Label>
                <ChipRow
                  options={QUANTITY_OPTIONS}
                  value={quantity}
                  onToggle={v => setQuantity(prev => (prev === v ? '' : v))}
                />
              </div>

              {showPee && (
                <div className="space-y-2">
                  <Label
                    className="text-xs font-semibold"
                    style={{ color: 'hsl(var(--ninho-brown))' }}
                  >
                    Cor do xixi
                  </Label>
                  <ChipRow
                    options={PEE_COLOR_OPTIONS}
                    value={peeColor}
                    onToggle={v => setPeeColor(prev => (prev === v ? '' : v))}
                  />
                </div>
              )}

              {showPoop && (
                <div className="space-y-2">
                  <Label
                    className="text-xs font-semibold"
                    style={{ color: 'hsl(var(--ninho-brown))' }}
                  >
                    Cor do cocô
                  </Label>
                  <ChipRow
                    options={POOP_COLOR_OPTIONS}
                    value={poopColor}
                    onToggle={v => setPoopColor(prev => (prev === v ? '' : v))}
                    wrap
                  />
                </div>
              )}

              {showPoop && (
                <div className="space-y-2">
                  <Label
                    className="text-xs font-semibold"
                    style={{ color: 'hsl(var(--ninho-brown))' }}
                  >
                    Consistência
                  </Label>
                  <ChipRow
                    options={TEXTURE_OPTIONS}
                    value={texture}
                    onToggle={v => setTexture(prev => (prev === v ? '' : v))}
                    wrap
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label
                  className="text-xs font-semibold"
                  style={{ color: 'hsl(var(--ninho-brown))' }}
                >
                  Observações (opcional)
                </Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Alguma observação..."
                  className="rounded-2xl border-border resize-none"
                  rows={2}
                />
              </div>

              <div
                className="flex items-center justify-between px-4 py-3 rounded-2xl"
                style={{ backgroundColor: 'hsl(var(--muted))' }}
              >
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: 'hsl(var(--ninho-brown))',
                      fontFamily: font,
                    }}
                  >
                    Incluir no relatório médico
                  </p>
                  <p
                    className="text-[11px]"
                    style={{
                      color: 'hsl(var(--muted-foreground))',
                      fontFamily: font,
                    }}
                  >
                    Marca para inclusão futura
                  </p>
                </div>
                <Switch
                  checked={includeInReport}
                  onCheckedChange={setIncludeInReport}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEditMode(false)}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold"
                  style={{
                    backgroundColor: 'hsl(var(--muted))',
                    color: 'hsl(var(--ninho-brown))',
                    fontFamily: font,
                  }}
                >
                  Cancelar
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold disabled:opacity-60 transition-all active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${ORANGE}, hsl(var(--ninho-mauve)))`,
                    color: 'white',
                    fontFamily: font,
                  }}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}