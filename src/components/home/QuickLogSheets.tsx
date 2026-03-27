import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { toast } from '@/hooks/use-toast';
import { fmtTimer } from '@/lib/routineUtils';

export { FeedSheet } from '@/components/routine/FeedSheet';
export { DiaperSheet } from '@/components/routine/DiaperSheet';

function ChildSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { children } = useActiveChild();
  if (children.length <= 1) return null;
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Criança</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 rounded-2xl border-border"><SelectValue /></SelectTrigger>
        <SelectContent>
          {children.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── SLEEP SHEET ───────────────────────────────────────────────────────────
const SLEEP_KEY = 'ninho_sleep_start';

interface SleepSheetProps { open: boolean; onClose: () => void; onSaved: () => void; }

export function SleepSheet({ open, onClose, onSaved }: SleepSheetProps) {
  const { user } = useAuth();
  const { activeChildId } = useActiveChild();
  const [childId, setChildId] = useState(activeChildId ?? '');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [ongoingStart, setOngoingStart] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (open) {
      const cid = activeChildId ?? '';
      setChildId(cid);
      const stored = localStorage.getItem(`${SLEEP_KEY}_${cid}`);
      setOngoingStart(stored);
      setNotes('');
    }
  }, [open, activeChildId]);

  useEffect(() => {
    if (ongoingStart) {
      const tick = () => setElapsed(Math.floor((Date.now() - new Date(ongoingStart).getTime()) / 1000));
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [ongoingStart]);

  function handleStartSleep() {
    const now = new Date().toISOString();
    localStorage.setItem(`${SLEEP_KEY}_${childId}`, now);
    setOngoingStart(now);
    toast({ title: 'Sono iniciado! 😴' });
    onClose();
  }

  async function handleEndSleep() {
    if (!user || !childId || !ongoingStart) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('routine_logs').insert({
        child_id: childId,
        author_id: user.id,
        type: 'sleep',
        start_time: new Date(ongoingStart).toISOString(),
        end_time: new Date().toISOString(),
        payload: null,
        notes: notes.trim() || null,
      });
      if (error) throw error;
      localStorage.removeItem(`${SLEEP_KEY}_${childId}`);
      setOngoingStart(null);
      toast({ title: 'Sono registrado! 😴' });
      onSaved();
      onClose();
      setNotes('');
    } catch (e: unknown) {
      toast({ title: 'Erro ao salvar', description: e instanceof Error ? e.message : 'Tente novamente', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  const mauveColor = 'hsl(var(--ninho-mauve))';

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-safe" style={{ backgroundColor: 'hsl(var(--card))' }}>
        <SheetHeader className="mb-5">
          <SheetTitle style={{ fontFamily: 'Quicksand, sans-serif', color: 'hsl(var(--ninho-brown))' }}>
            😴 Registrar sono
          </SheetTitle>
        </SheetHeader>
        <ChildSelect value={childId} onChange={v => { setChildId(v); setOngoingStart(localStorage.getItem(`${SLEEP_KEY}_${v}`)); }} />
        <div className="mt-4 flex flex-col items-center gap-4">
          {ongoingStart ? (
            <>
              <div className="w-28 h-28 rounded-full flex flex-col items-center justify-center"
                style={{ backgroundColor: `${mauveColor}18`, border: `2px solid ${mauveColor}40` }}>
                <span className="text-2xl">😴</span>
                <p className="text-lg font-bold tabular-nums mt-1" style={{ color: mauveColor, fontFamily: 'Quicksand, sans-serif' }}>
                  {fmtTimer(elapsed)}
                </p>
              </div>
              <p className="text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                Sono iniciado às {new Date(ongoingStart).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <div className="w-full space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Observações (opcional)</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Dormiu tranquilo..." className="rounded-2xl border-border resize-none" rows={2} />
                </div>
                <Button onClick={handleEndSleep} disabled={saving} className="w-full rounded-2xl h-12 font-bold" style={{ backgroundColor: mauveColor, color: 'white' }}>
                  {saving ? 'Salvando...' : '⏹ Encerrar sono'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${mauveColor}15`, border: `2px dashed ${mauveColor}40` }}>
                <span className="text-4xl">😴</span>
              </div>
              <p className="text-sm text-center" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                Toque em iniciar para cronometrar o sono
              </p>
              <Button onClick={handleStartSleep} disabled={!childId} className="w-full rounded-2xl h-12 font-bold" style={{ backgroundColor: mauveColor, color: 'white' }}>
                ▶ Iniciar sono
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// DiaperSheet is now in src/components/routine/DiaperSheet.tsx
