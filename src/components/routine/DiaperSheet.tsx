/**
 * DiaperSheet — Refined diaper logging with smart progressive disclosure.
 *
 * Data model:
 *   payload.kind: pee | poop | both (required)
 *   payload.quantity: small | medium | large (optional)
 *   payload.pee_color: clear | pale_yellow | dark_yellow | other (optional, shown for pee/both)
 *   payload.poop_color: yellow | green | brown | dark | red | black | white | other (optional, shown for poop/both)
 *   payload.poop_texture: liquid | pasty | soft | firm | mucus_like | other (optional, shown for poop/both)
 *   notes: free text (optional)
 *   payload.include_in_report: boolean (optional, only inside expanded layer)
 *
 * Flow:
 *   Step 1 → one-tap kind selection → saves immediately (quick log)
 *   Step 2 → optional enrichment via "+ Adicionar informação"
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { toast } from '@/hooks/use-toast';
import {
  DIAPER_KIND_LABEL,
  DIAPER_QUANTITY_LABEL,
  DIAPER_POOP_COLOR_LABEL,
  DIAPER_PEE_COLOR_LABEL,
  DIAPER_TEXTURE_LABEL,
} from '@/lib/eventSystem';

type DiaperKind = 'pee' | 'poop' | 'both';

const KIND_OPTIONS: { kind: DiaperKind; emoji: string; label: string }[] = [
  { kind: 'pee', emoji: '💛', label: 'Xixi' },
  { kind: 'poop', emoji: '💩', label: 'Cocô' },
  { kind: 'both', emoji: '🔄', label: 'Ambos' },
];

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

const ORANGE = 'hsl(32,80%,57%)';
const font = 'Nunito, sans-serif';

function ChipRow({
  options,
  value,
  onToggle,
  wrap = false,
}: {
  options: { value: string; label: string }[];
  value: string;
  onToggle: (v: string) => void;
  wrap?: boolean;
}) {
  return (
    <div className={`flex gap-2 ${wrap ? 'flex-wrap' : 'overflow-x-auto pb-1'}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onToggle(opt.value)}
          className="py-2 px-3 rounded-2xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap flex-shrink-0"
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

interface DiaperSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function DiaperSheet({ open, onClose, onSaved }: DiaperSheetProps) {
  const { user } = useAuth();
  const { activeChildId } = useActiveChild();

  const [selectedKind, setSelectedKind] = useState<DiaperKind | null>(null);
  const [saving, setSaving] = useState(false);

  const [enrichOpen, setEnrichOpen] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [peeColor, setPeeColor] = useState('');
  const [poopColor, setPoopColor] = useState('');
  const [texture, setTexture] = useState('');
  const [notes, setNotes] = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedKind(null);
      setEnrichOpen(false);
      setQuantity('');
      setPeeColor('');
      setPoopColor('');
      setTexture('');
      setNotes('');
      setIncludeInReport(false);
    }
  }, [open]);

  const showPeeFields = selectedKind === 'pee' || selectedKind === 'both';
  const showPoopFields = selectedKind === 'poop' || selectedKind === 'both';

  function resetEnrich() {
    setQuantity('');
    setPeeColor('');
    setPoopColor('');
    setTexture('');
    setNotes('');
    setIncludeInReport(false);
    setEnrichOpen(false);
  }

  async function doSave(kind: DiaperKind, withEnrich: boolean) {
    const childId = activeChildId;
    if (!user || !childId) return;

    setSaving(true);

    try {
      const payload: Record<string, unknown> = { kind };

      if (withEnrich) {
        if (quantity) payload.quantity = quantity;
        if (peeColor && showPeeFields) payload.pee_color = peeColor;
        if (poopColor && showPoopFields) payload.poop_color = poopColor;
        if (texture && showPoopFields) payload.poop_texture = texture;
        if (includeInReport) payload.include_in_report = true;
      }

      const { error } = await supabase.from('routine_logs').insert([{
        child_id: childId,
        author_id: user.id,
        type: 'diaper' as const,
        start_time: new Date().toISOString(),
        payload: payload as unknown as import('@/integrations/supabase/types').Json,
        notes: withEnrich ? notes.trim() || null : null,
      }]);

      if (error) throw error;

      toast({ title: `🧷 Troca registrada — ${DIAPER_KIND_LABEL[kind] ?? kind}` });
      onSaved();
      onClose();
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

  async function handleQuickTap(kind: DiaperKind) {
    if (enrichOpen) {
      setSelectedKind(kind);
      return;
    }

    setSelectedKind(kind);
    await doSave(kind, false);
  }

  async function handleEnrichedSave() {
    if (!selectedKind) return;
    await doSave(selectedKind, true);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-3xl pb-safe"
        style={{ backgroundColor: 'hsl(var(--card))' }}
      >
        <div className="px-1 pt-2 pb-6 space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="text-center">
            <p
              className="text-xl font-bold"
              style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}
            >
              🧷 Registrar troca
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}
            >
              {enrichOpen
                ? 'Selecione o tipo e adicione detalhes'
                : 'Toque para registrar rapidamente'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {KIND_OPTIONS.map((opt) => {
              const isActive = selectedKind === opt.kind && enrichOpen;
              const isSaving = saving && selectedKind === opt.kind && !enrichOpen;

              return (
                <button
                  key={opt.kind}
                  onClick={() => handleQuickTap(opt.kind)}
                  disabled={saving}
                  className="flex flex-col items-center gap-2 py-6 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-60"
                  style={{
                    backgroundColor: isActive ? ORANGE : `${ORANGE}18`,
                    border: `2px solid ${isActive ? ORANGE : `${ORANGE}30`}`,
                    color: isActive ? 'white' : 'hsl(var(--ninho-brown))',
                    fontFamily: font,
                  }}
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <span className="text-sm font-bold">{isSaving ? '...' : opt.label}</span>
                </button>
              );
            })}
          </div>

          {!enrichOpen ? (
            <button
              onClick={() => setEnrichOpen(true)}
              className="w-full py-2.5 text-sm font-semibold text-center rounded-2xl transition-all active:scale-95"
              style={{
                backgroundColor: 'hsl(var(--muted))',
                color: 'hsl(var(--muted-foreground))',
                fontFamily: font,
              }}
            >
              + Adicionar informação
            </button>
          ) : (
            <AnimatePresence>
              <motion.div
                key="enrich"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="space-y-5 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <p
                    className="text-xs font-bold uppercase tracking-wide"
                    style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}
                  >
                    Informações adicionais
                  </p>
                  <button
                    onClick={resetEnrich}
                    className="text-xs font-semibold"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    Cancelar
                  </button>
                </div>

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
                    onToggle={(v) => setQuantity((p) => (p === v ? '' : v))}
                  />
                </div>

                {showPeeFields && (
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
                      onToggle={(v) => setPeeColor((p) => (p === v ? '' : v))}
                    />
                  </div>
                )}

                {showPoopFields && (
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
                      onToggle={(v) => setPoopColor((p) => (p === v ? '' : v))}
                      wrap
                    />
                  </div>
                )}

                {showPoopFields && (
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
                      onToggle={(v) => setTexture((p) => (p === v ? '' : v))}
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
                    onChange={(e) => setNotes(e.target.value)}
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
                      style={{ color: 'hsl(var(--ninho-brown))', fontFamily: font }}
                    >
                      Incluir no relatório médico
                    </p>
                    <p
                      className="text-[11px]"
                      style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}
                    >
                      Marca para inclusão futura
                    </p>
                  </div>
                  <Switch checked={includeInReport} onCheckedChange={setIncludeInReport} />
                </div>

                {selectedKind ? (
                  <button
                    onClick={handleEnrichedSave}
                    disabled={saving}
                    className="w-full py-4 rounded-2xl text-sm font-bold transition-all active:scale-95 disabled:opacity-60"
                    style={{
                      background: `linear-gradient(135deg, ${ORANGE}, hsl(var(--ninho-mauve)))`,
                      color: 'white',
                      fontFamily: font,
                    }}
                  >
                    {saving
                      ? 'Salvando...'
                      : `✓ Registrar — ${KIND_OPTIONS.find((o) => o.kind === selectedKind)?.label}`}
                  </button>
                ) : (
                  <p
                    className="text-xs text-center"
                    style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}
                  >
                    Selecione o tipo acima para salvar
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}