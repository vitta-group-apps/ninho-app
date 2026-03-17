/**
 * DiaperSheet — Fast diaper logging with progressive disclosure.
 *
 * Step 1 (always visible): one-tap kind selection — Xixi / Cocô / Ambos
 * Step 2 (progressive): optional enrichment — quantity, color, texture, notes, report toggle
 *
 * Saving with no enrichment is always one tap away.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { toast } from '@/hooks/use-toast';
import { makePayloadNotes } from '@/lib/routineUtils';
import { DIAPER_KIND_LABEL, DIAPER_QUANTITY_LABEL, DIAPER_COLOR_LABEL, DIAPER_TEXTURE_LABEL } from '@/lib/eventSystem';

type DiaperKind = 'pee' | 'poop' | 'both';

const KIND_OPTIONS: { kind: DiaperKind; emoji: string; label: string }[] = [
  { kind: 'pee', emoji: '💛', label: 'Xixi' },
  { kind: 'poop', emoji: '💩', label: 'Cocô' },
  { kind: 'both', emoji: '🔄', label: 'Ambos' },
];

const QUANTITY_OPTIONS = [
  { value: 'little', label: DIAPER_QUANTITY_LABEL.little },
  { value: 'medium', label: DIAPER_QUANTITY_LABEL.medium },
  { value: 'large', label: DIAPER_QUANTITY_LABEL.large },
];

const COLOR_OPTIONS = [
  { value: 'yellow', label: DIAPER_COLOR_LABEL.yellow },
  { value: 'green', label: DIAPER_COLOR_LABEL.green },
  { value: 'brown', label: DIAPER_COLOR_LABEL.brown },
  { value: 'dark', label: DIAPER_COLOR_LABEL.dark },
  { value: 'other', label: DIAPER_COLOR_LABEL.other },
];

const TEXTURE_OPTIONS = [
  { value: 'liquid', label: DIAPER_TEXTURE_LABEL.liquid },
  { value: 'pasty', label: DIAPER_TEXTURE_LABEL.pasty },
  { value: 'firm', label: DIAPER_TEXTURE_LABEL.firm },
];

const ORANGE = 'hsl(32,80%,57%)';

interface DiaperSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function DiaperSheet({ open, onClose, onSaved }: DiaperSheetProps) {
  const { user } = useAuth();
  const { activeChildId } = useActiveChild();
  const [childId, setChildId] = useState(activeChildId ?? '');

  // Step 1 — quick selection
  const [selectedKind, setSelectedKind] = useState<DiaperKind | null>(null);
  const [saving, setSaving] = useState(false);

  // Step 2 — optional enrichment
  const [enrichOpen, setEnrichOpen] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [color, setColor] = useState('');
  const [texture, setTexture] = useState('');
  const [notes, setNotes] = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);

  useEffect(() => {
    if (open) {
      setChildId(activeChildId ?? '');
      setSelectedKind(null);
      setEnrichOpen(false);
      setQuantity('');
      setColor('');
      setTexture('');
      setNotes('');
      setIncludeInReport(false);
    }
  }, [open, activeChildId]);

  function resetEnrich() {
    setQuantity(''); setColor(''); setTexture(''); setNotes(''); setIncludeInReport(false);
    setEnrichOpen(false);
  }

  async function handleSave(kind: DiaperKind, withEnrich = false) {
    if (!user || !childId) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { kind };
      if (withEnrich) {
        if (quantity) payload.quantity = quantity;
        if (color) payload.color = color;
        if (texture) payload.texture = texture;
        if (includeInReport) payload.include_in_report = true;
      }
      const { error } = await supabase.from('routine_logs').insert({
        child_id: childId,
        author_id: user.id,
        type: 'diaper',
        start_time: new Date().toISOString(),
        notes: makePayloadNotes(payload, withEnrich ? notes : ''),
      });
      if (error) throw error;
      toast({ title: `🧷 Troca registrada — ${DIAPER_KIND_LABEL[kind] ?? kind}` });
      onSaved();
      onClose();
    } catch (e: unknown) {
      toast({ title: 'Erro ao salvar', description: e instanceof Error ? e.message : 'Tente novamente', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  // Quick save: tap kind → save immediately (no enrichment)
  async function handleQuickTap(kind: DiaperKind) {
    setSelectedKind(kind);
    await handleSave(kind, false);
  }

  // Save with enrichment data
  async function handleEnrichedSave() {
    if (!selectedKind) return;
    await handleSave(selectedKind, true);
  }

  const showPoopFields = selectedKind === 'poop' || selectedKind === 'both';

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl pb-safe"
        style={{ backgroundColor: 'hsl(var(--card))' }}
      >
        <div className="px-1 pt-2 space-y-4">

          {/* Header */}
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
              🧷 Registrar troca
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
              Toque para registrar rapidamente
            </p>
          </div>

          {/* Step 1 — Quick kind selection */}
          <div className="grid grid-cols-3 gap-3">
            {KIND_OPTIONS.map(opt => (
              <button
                key={opt.kind}
                onClick={() => enrichOpen ? setSelectedKind(opt.kind) : handleQuickTap(opt.kind)}
                disabled={saving}
                className="flex flex-col items-center gap-2 py-6 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-60"
                style={{
                  backgroundColor: selectedKind === opt.kind && enrichOpen
                    ? ORANGE
                    : `${ORANGE}18`,
                  border: `2px solid ${selectedKind === opt.kind && enrichOpen ? ORANGE : `${ORANGE}30`}`,
                  color: selectedKind === opt.kind && enrichOpen ? 'white' : 'hsl(var(--ninho-brown))',
                  fontFamily: 'Nunito, sans-serif',
                }}
              >
                <span className="text-3xl">{opt.emoji}</span>
                <span className="text-sm font-bold">{saving && selectedKind === opt.kind && !enrichOpen ? '...' : opt.label}</span>
              </button>
            ))}
          </div>

          {/* Toggle enrichment */}
          {!enrichOpen ? (
            <button
              onClick={() => setEnrichOpen(true)}
              className="w-full py-2.5 text-sm font-semibold text-center rounded-2xl transition-all active:scale-95"
              style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
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
                transition={{ duration: 0.2 }}
                className="space-y-4 overflow-hidden"
              >
                {/* Kind selection header */}
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                    Informações adicionais
                  </p>
                  <button onClick={resetEnrich} className="text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Cancelar
                  </button>
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Quantidade</Label>
                  <div className="flex gap-2">
                    {QUANTITY_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setQuantity(v => v === opt.value ? '' : opt.value)}
                        className="flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95"
                        style={{
                          backgroundColor: quantity === opt.value ? ORANGE : 'hsl(var(--muted))',
                          color: quantity === opt.value ? 'white' : 'hsl(var(--ninho-brown))',
                          fontFamily: 'Nunito, sans-serif',
                        }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color (always for both, poop-specific for context) */}
                {showPoopFields && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Cor</Label>
                      <Select value={color} onValueChange={setColor}>
                        <SelectTrigger className="h-11 rounded-2xl border-border">
                          <SelectValue placeholder="Selecionar cor (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {COLOR_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Consistência</Label>
                      <div className="flex gap-2">
                        {TEXTURE_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={() => setTexture(v => v === opt.value ? '' : opt.value)}
                            className="flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95"
                            style={{
                              backgroundColor: texture === opt.value ? ORANGE : 'hsl(var(--muted))',
                              color: texture === opt.value ? 'white' : 'hsl(var(--ninho-brown))',
                              fontFamily: 'Nunito, sans-serif',
                            }}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Observações (opcional)</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Alguma observação..." className="rounded-2xl border-border resize-none" rows={2} />
                </div>

                {/* Report toggle */}
                <div className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}>
                      Incluir no relatório médico
                    </p>
                    <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                      Marca para inclusão futura
                    </p>
                  </div>
                  <Switch checked={includeInReport} onCheckedChange={setIncludeInReport} />
                </div>

                {/* Save enriched */}
                {selectedKind && (
                  <button
                    onClick={handleEnrichedSave}
                    disabled={saving}
                    className="w-full py-4 rounded-2xl text-sm font-bold transition-all active:scale-95 disabled:opacity-60"
                    style={{ background: `linear-gradient(135deg, ${ORANGE}, hsl(var(--ninho-mauve)))`, color: 'white', fontFamily: 'Nunito, sans-serif' }}
                  >
                    {saving ? 'Salvando...' : `✓ Registrar — ${KIND_OPTIONS.find(o => o.kind === selectedKind)?.label}`}
                  </button>
                )}
                {!selectedKind && (
                  <p className="text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
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
