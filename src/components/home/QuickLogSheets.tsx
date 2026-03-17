import { useState, useEffect, useRef } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { toast } from '@/hooks/use-toast';

// ─── Shared helpers ────────────────────────────────────────────────────────

function makePayloadNotes(payload: Record<string, unknown>, userNotes?: string): string {
  const obj: Record<string, unknown> = { ...payload };
  if (userNotes?.trim()) obj._notes = userNotes.trim();
  return '__payload:' + JSON.stringify(obj);
}

function fmtDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

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
// Mode A: Rápido — logs instantly with current time
// Mode B: Cronômetro — left/right breast timer with start/pause/finish

interface FeedSheetProps { open: boolean; onClose: () => void; onSaved: () => void; }

type FeedMode = 'quick' | 'timer';
type TimerState = 'idle' | 'running' | 'paused';
type BreastSide = 'left' | 'right';

export function FeedSheet({ open, onClose, onSaved }: FeedSheetProps) {
  const { user } = useAuth();
  const { activeChildId } = useActiveChild();
  const [childId, setChildId] = useState(activeChildId ?? '');
  const [mode, setMode] = useState<FeedMode>('quick');
  const [method, setMethod] = useState<'breast' | 'bottle' | 'formula'>('breast');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Timer state
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [side, setSide] = useState<BreastSide>('left');
  const [elapsed, setElapsed] = useState(0);
  const [startTs, setStartTs] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function resetForm() {
    setChildId(activeChildId ?? '');
    setMode('quick');
    setMethod('breast');
    setNotes('');
    setTimerState('idle');
    setSide('left');
    setElapsed(0);
    setStartTs(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  useEffect(() => {
    if (open) setChildId(activeChildId ?? '');
  }, [open, activeChildId]);

  // Timer tick
  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerState]);

  function handleStartTimer(selectedSide: BreastSide) {
    setSide(selectedSide);
    setTimerState('running');
    setStartTs(new Date());
    setElapsed(0);
  }

  function handlePause() {
    setTimerState(s => s === 'running' ? 'paused' : 'running');
  }

  async function save(payload: Record<string, unknown>, logStart: Date, logEnd?: Date) {
    if (!user || !childId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('routine_logs').insert({
        child_id: childId,
        author_id: user.id,
        type: 'feed',
        start_time: logStart.toISOString(),
        end_time: logEnd?.toISOString() ?? null,
        notes: makePayloadNotes(payload, notes),
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

  async function handleQuickSave() {
    await save({ feeding_method: method, mode: 'quick' }, new Date());
  }

  async function handleFinishTimer() {
    const end = new Date();
    await save({ feeding_method: 'breast', mode: 'timer', side, duration_seconds: elapsed }, startTs ?? new Date(), end);
  }

  const sageColor = 'hsl(var(--ninho-sage))';

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) { onClose(); resetForm(); } }}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-safe" style={{ backgroundColor: 'hsl(var(--card))' }}>
        <SheetHeader className="mb-4">
          <SheetTitle style={{ fontFamily: 'Quicksand, sans-serif', color: 'hsl(var(--ninho-brown))' }}>
            🍼 Registrar mamada
          </SheetTitle>
        </SheetHeader>

        <ChildSelect value={childId} onChange={setChildId} />

        {/* Mode selector */}
        <div className="flex gap-2 mt-4 mb-5">
          {(['quick', 'timer'] as FeedMode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setTimerState('idle'); setElapsed(0); }}
              className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all"
              style={{
                backgroundColor: mode === m ? sageColor : 'hsl(var(--muted))',
                color: mode === m ? 'white' : 'hsl(var(--ninho-brown))',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              {m === 'quick' ? '⚡ Registrar rápido' : '⏱ Usar cronômetro'}
            </button>
          ))}
        </div>

        {mode === 'quick' ? (
          <div className="space-y-4">
            {/* Method */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Tipo</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: 'breast', l: '🤱 Seio' },
                  { v: 'bottle', l: '🍼 Mamadeira' },
                  { v: 'formula', l: '🥛 Fórmula' },
                ] as { v: typeof method; l: string }[]).map(opt => (
                  <button
                    key={opt.v}
                    onClick={() => setMethod(opt.v)}
                    className="py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95"
                    style={{
                      backgroundColor: method === opt.v ? sageColor : 'hsl(var(--muted))',
                      color: method === opt.v ? 'white' : 'hsl(var(--ninho-brown))',
                      fontFamily: 'Nunito, sans-serif',
                    }}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

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
              onClick={handleQuickSave}
              disabled={saving || !childId}
              className="w-full rounded-2xl h-12 font-bold"
              style={{ backgroundColor: sageColor, color: 'white' }}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        ) : (
          /* Timer mode */
          <div className="space-y-4">
            {timerState === 'idle' ? (
              <div>
                <p className="text-xs font-semibold text-center mb-3" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                  Escolha o lado para começar
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(['left', 'right'] as BreastSide[]).map(s => (
                    <button
                      key={s}
                      onClick={() => handleStartTimer(s)}
                      className="py-5 rounded-2xl text-sm font-bold transition-all active:scale-95 flex flex-col items-center gap-1"
                      style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
                    >
                      <span className="text-2xl">{s === 'left' ? '⬅️' : '➡️'}</span>
                      <span>{s === 'left' ? 'Esquerdo' : 'Direito'}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="text-center">
                  <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                    {side === 'left' ? '⬅️ Lado esquerdo' : '➡️ Lado direito'}
                  </p>
                  <p
                    className="text-5xl font-bold tabular-nums"
                    style={{ color: sageColor, fontFamily: 'Quicksand, sans-serif' }}
                  >
                    {fmtDuration(elapsed)}
                  </p>
                  {timerState === 'paused' && (
                    <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Pausado</p>
                  )}
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={handlePause}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95"
                    style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
                  >
                    {timerState === 'running' ? '⏸ Pausar' : '▶️ Continuar'}
                  </button>
                  <button
                    onClick={handleFinishTimer}
                    disabled={saving || elapsed === 0}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: sageColor, color: 'white', fontFamily: 'Nunito, sans-serif' }}
                  >
                    {saving ? '...' : '✅ Finalizar'}
                  </button>
                </div>
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
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── SLEEP SHEET ───────────────────────────────────────────────────────────
// First tap = start, second tap = end (persisted in localStorage per child)

interface SleepSheetProps { open: boolean; onClose: () => void; onSaved: () => void; }

const SLEEP_KEY = 'ninho_sleep_start';

export function SleepSheet({ open, onClose, onSaved }: SleepSheetProps) {
  const { user } = useAuth();
  const { activeChildId } = useActiveChild();
  const [childId, setChildId] = useState(activeChildId ?? '');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Check if there's an ongoing sleep for this child
  const storageKey = `${SLEEP_KEY}_${childId}`;
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
      const tick = () => {
        const diff = Math.floor((Date.now() - new Date(ongoingStart).getTime()) / 1000);
        setElapsed(diff);
      };
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
        notes: notes.trim() ? makePayloadNotes({}, notes) : null,
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

        <ChildSelect value={childId} onChange={v => {
          setChildId(v);
          const stored = localStorage.getItem(`${SLEEP_KEY}_${v}`);
          setOngoingStart(stored);
        }} />

        <div className="mt-4 flex flex-col items-center gap-4">
          {ongoingStart ? (
            <>
              <div
                className="w-28 h-28 rounded-full flex flex-col items-center justify-center"
                style={{ backgroundColor: `${mauveColor}18`, border: `2px solid ${mauveColor}40` }}
              >
                <span className="text-2xl">😴</span>
                <p className="text-lg font-bold tabular-nums mt-1" style={{ color: mauveColor, fontFamily: 'Quicksand, sans-serif' }}>
                  {fmtDuration(elapsed)}
                </p>
              </div>
              <p className="text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                Sono em andamento desde {new Date(ongoingStart).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <div className="w-full space-y-3">
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
                  onClick={handleEndSleep}
                  disabled={saving}
                  className="w-full rounded-2xl h-12 font-bold"
                  style={{ backgroundColor: mauveColor, color: 'white' }}
                >
                  {saving ? 'Salvando...' : '⏹ Encerrar sono'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${mauveColor}15`, border: `2px dashed ${mauveColor}40` }}
              >
                <span className="text-4xl">😴</span>
              </div>
              <p className="text-sm text-center" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                Toque em iniciar para começar a cronometrar o sono
              </p>
              <Button
                onClick={handleStartSleep}
                disabled={!childId}
                className="w-full rounded-2xl h-12 font-bold"
                style={{ backgroundColor: mauveColor, color: 'white' }}
              >
                ▶ Iniciar sono
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── DIAPER SHEET ──────────────────────────────────────────────────────────
// Tap one of 3 options → instant save, no confirm needed

interface DiaperSheetProps { open: boolean; onClose: () => void; onSaved: () => void; }

export function DiaperSheet({ open, onClose, onSaved }: DiaperSheetProps) {
  const { user } = useAuth();
  const { activeChildId } = useActiveChild();
  const [childId, setChildId] = useState(activeChildId ?? '');
  const [saving, setSaving] = useState<string | null>(null); // stores which type is saving

  useEffect(() => {
    if (open) setChildId(activeChildId ?? '');
  }, [open, activeChildId]);

  async function handleSave(diaperType: 'pee' | 'poop' | 'both') {
    if (!user || !childId) return;
    setSaving(diaperType);
    try {
      const { error } = await supabase.from('routine_logs').insert({
        child_id: childId,
        author_id: user.id,
        type: 'diaper',
        start_time: new Date().toISOString(),
        notes: makePayloadNotes({ diaper_type: diaperType }),
      });
      if (error) throw error;
      const labels = { pee: 'Xixi 💛', poop: 'Cocô 💩', both: 'Xixi e Cocô 🔄' };
      toast({ title: `Troca registrada — ${labels[diaperType]}` });
      onSaved();
      onClose();
    } catch (e: unknown) {
      toast({ title: 'Erro ao salvar', description: e instanceof Error ? e.message : 'Tente novamente', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  }

  const orangeColor = '#E8A045';

  const options = [
    { type: 'pee' as const, emoji: '💛', label: 'Xixi' },
    { type: 'poop' as const, emoji: '💩', label: 'Cocô' },
    { type: 'both' as const, emoji: '🔄', label: 'Ambos' },
  ];

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-safe" style={{ backgroundColor: 'hsl(var(--card))' }}>
        <SheetHeader className="mb-5">
          <SheetTitle style={{ fontFamily: 'Quicksand, sans-serif', color: 'hsl(var(--ninho-brown))' }}>
            🧷 Registrar troca
          </SheetTitle>
        </SheetHeader>

        <ChildSelect value={childId} onChange={setChildId} />

        <div className="mt-4 grid grid-cols-3 gap-3">
          {options.map(opt => (
            <button
              key={opt.type}
              onClick={() => handleSave(opt.type)}
              disabled={saving !== null || !childId}
              className="flex flex-col items-center gap-2 py-6 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-60"
              style={{
                backgroundColor: saving === opt.type ? orangeColor : 'hsl(var(--muted))',
                color: saving === opt.type ? 'white' : 'hsl(var(--ninho-brown))',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              <span className="text-3xl">{opt.emoji}</span>
              <span className="text-sm">{saving === opt.type ? '...' : opt.label}</span>
            </button>
          ))}
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
          Toque em uma opção para registrar instantaneamente
        </p>
      </SheetContent>
    </Sheet>
  );
}
