import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { toast } from '@/hooks/use-toast';

// ─── Shared child selector inside log sheets ───────────────────────────────
function ChildSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { children } = useActiveChild();
  if (children.length <= 1) return null;
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Criança</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 rounded-2xl border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {children.map(c => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── FEEDING SHEET ─────────────────────────────────────────────────────────
interface FeedSheetProps { open: boolean; onClose: () => void; onSaved: () => void; }

export function FeedSheet({ open, onClose, onSaved }: FeedSheetProps) {
  const { user } = useAuth();
  const { activeChildId } = useActiveChild();
  const [childId, setChildId] = useState(activeChildId ?? '');
  const [method, setMethod] = useState('breast');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync with active child when sheet opens
  function resetForm() {
    setChildId(activeChildId ?? '');
    setMethod('breast');
    setAmount('');
    setNotes('');
  }

  async function handleSave() {
    if (!user || !childId) return;
    setSaving(true);
    try {
      const payload: Record<string, string | number> = { feeding_method: method };
      if (amount) payload.amount_ml = Number(amount);
      if (notes.trim()) payload._notes = notes.trim();
      const notesField = '__payload:' + JSON.stringify(payload);

      const { error } = await supabase.from('routine_logs').insert({
        child_id: childId,
        author_id: user.id,
        type: 'feed',
        start_time: new Date().toISOString(),
        notes: notesField,
      });
      if (error) throw error;
      toast({ title: 'Mamada registrada! 🍼' });
      onSaved();
      onClose();
      resetForm();
    } catch (e: unknown) {
      toast({ title: 'Erro ao salvar', description: e instanceof Error ? e.message : 'Tente novamente', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) { onClose(); resetForm(); } }}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-safe space-y-4" style={{ backgroundColor: 'hsl(var(--card))' }}>
        <SheetHeader>
          <SheetTitle style={{ fontFamily: 'Quicksand, sans-serif', color: 'hsl(var(--ninho-brown))' }}>
            🍼 Registrar mamada
          </SheetTitle>
        </SheetHeader>

        <ChildSelect value={childId} onChange={setChildId} />

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Tipo</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="h-11 rounded-2xl border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="breast">Seio</SelectItem>
              <SelectItem value="bottle">Mamadeira</SelectItem>
              <SelectItem value="formula">Fórmula</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(method === 'bottle' || method === 'formula') && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Quantidade (ml)</Label>
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="120"
              min="0"
              className="h-11 rounded-2xl border-border"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Observações (opcional)</Label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Mamou bem..."
            className="rounded-2xl border-border resize-none"
            rows={2}
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || !childId}
          className="w-full rounded-2xl h-12 font-bold"
          style={{ backgroundColor: 'hsl(var(--ninho-sage))', color: 'white' }}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </SheetContent>
    </Sheet>
  );
}

// ─── SLEEP SHEET ───────────────────────────────────────────────────────────
interface SleepSheetProps { open: boolean; onClose: () => void; onSaved: () => void; }

export function SleepSheet({ open, onClose, onSaved }: SleepSheetProps) {
  const { user } = useAuth();
  const { activeChildId } = useActiveChild();
  const [childId, setChildId] = useState(activeChildId ?? '');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setChildId(activeChildId ?? '');
    // Default start to now
    const now = new Date();
    now.setSeconds(0, 0);
    setStartTime(now.toISOString().slice(0, 16));
    setEndTime('');
    setNotes('');
  }

  async function handleSave() {
    if (!user || !childId || !startTime) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (notes.trim()) payload._notes = notes.trim();
      const notesField = Object.keys(payload).length > 0 ? '__payload:' + JSON.stringify(payload) : null;

      const { error } = await supabase.from('routine_logs').insert({
        child_id: childId,
        author_id: user.id,
        type: 'sleep',
        start_time: new Date(startTime).toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : null,
        notes: notesField,
      });
      if (error) throw error;
      toast({ title: 'Sono registrado! 😴' });
      onSaved();
      onClose();
      resetForm();
    } catch (e: unknown) {
      toast({ title: 'Erro ao salvar', description: e instanceof Error ? e.message : 'Tente novamente', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) { onClose(); resetForm(); } }}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-safe space-y-4" style={{ backgroundColor: 'hsl(var(--card))' }}>
        <SheetHeader>
          <SheetTitle style={{ fontFamily: 'Quicksand, sans-serif', color: 'hsl(var(--ninho-brown))' }}>
            😴 Registrar sono
          </SheetTitle>
        </SheetHeader>

        <ChildSelect value={childId} onChange={setChildId} />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Início</Label>
            <Input
              type="datetime-local"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              required
              className="h-11 rounded-2xl border-border text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Fim (opcional)</Label>
            <Input
              type="datetime-local"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="h-11 rounded-2xl border-border text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Observações (opcional)</Label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Dormiu tranquilo..."
            className="rounded-2xl border-border resize-none"
            rows={2}
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || !childId || !startTime}
          className="w-full rounded-2xl h-12 font-bold"
          style={{ backgroundColor: 'hsl(var(--ninho-sage))', color: 'white' }}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </SheetContent>
    </Sheet>
  );
}

// ─── DIAPER SHEET ──────────────────────────────────────────────────────────
interface DiaperSheetProps { open: boolean; onClose: () => void; onSaved: () => void; }

export function DiaperSheet({ open, onClose, onSaved }: DiaperSheetProps) {
  const { user } = useAuth();
  const { activeChildId } = useActiveChild();
  const [childId, setChildId] = useState(activeChildId ?? '');
  const [diaperType, setDiaperType] = useState('pee');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setChildId(activeChildId ?? '');
    setDiaperType('pee');
    setNotes('');
  }

  async function handleSave() {
    if (!user || !childId) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = { diaper_type: diaperType };
      if (notes.trim()) payload._notes = notes.trim();
      const notesField = '__payload:' + JSON.stringify(payload);

      const { error } = await supabase.from('routine_logs').insert({
        child_id: childId,
        author_id: user.id,
        type: 'diaper',
        start_time: new Date().toISOString(),
        notes: notesField,
      });
      if (error) throw error;
      toast({ title: 'Troca registrada! 🧷' });
      onSaved();
      onClose();
      resetForm();
    } catch (e: unknown) {
      toast({ title: 'Erro ao salvar', description: e instanceof Error ? e.message : 'Tente novamente', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) { onClose(); resetForm(); } }}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-safe space-y-4" style={{ backgroundColor: 'hsl(var(--card))' }}>
        <SheetHeader>
          <SheetTitle style={{ fontFamily: 'Quicksand, sans-serif', color: 'hsl(var(--ninho-brown))' }}>
            🧷 Registrar troca
          </SheetTitle>
        </SheetHeader>

        <ChildSelect value={childId} onChange={setChildId} />

        <div className="space-y-2">
          <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Tipo</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'pee', label: '💛 Xixi' },
              { value: 'poop', label: '💩 Cocô' },
              { value: 'both', label: '🔄 Ambos' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setDiaperType(opt.value)}
                className="py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-95"
                style={{
                  backgroundColor: diaperType === opt.value ? 'hsl(var(--ninho-sage))' : 'hsl(var(--muted))',
                  color: diaperType === opt.value ? 'white' : 'hsl(var(--ninho-brown))',
                  fontFamily: 'Nunito, sans-serif',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Observações (opcional)</Label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Algo incomum..."
            className="rounded-2xl border-border resize-none"
            rows={2}
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || !childId}
          className="w-full rounded-2xl h-12 font-bold"
          style={{ backgroundColor: 'hsl(var(--ninho-sage))', color: 'white' }}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
