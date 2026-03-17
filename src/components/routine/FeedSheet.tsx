/**
 * FeedSheet — Full breastfeeding session experience + bottle/formula fallback.
 *
 * Phases:
 *   'suggest'  → Smart side recommendation + manual entry link
 *   'session'  → Live timer with side switching
 *   'summary'  → Review & save
 *   'manual'   → Manual entry form
 *   'bottle'   → Quick bottle/formula log
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
import {
  parsePayload,
  makePayloadNotes,
  fmtTimer,
  fmtDurationShort,
  fmtTimeSince,
} from '@/lib/routineUtils';

// ─── Types ─────────────────────────────────────────────────────────────────

type Side = 'L' | 'R';
type FeedPhase = 'suggest' | 'session' | 'summary' | 'manual' | 'bottle';

interface Segment {
  side: Side;
  startEpoch: number;
  endEpoch: number | null;
}

interface PersistedSession {
  childId: string;
  sessionStartEpoch: number;
  segments: Segment[];
  activeSide: Side;
}

const SESSION_KEY = 'ninho_feed_session';

function saveSessionToStorage(data: PersistedSession) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch { /* noop */ }
}
function clearSessionStorage() {
  localStorage.removeItem(SESSION_KEY);
}
function loadSessionFromStorage(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ─── Child selector (shared) ──────────────────────────────────────────────

function ChildSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { children } = useActiveChild();
  if (children.length <= 1) return null;
  return (
    <div className="space-y-1.5 mb-4">
      <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>
        Criança
      </Label>
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

// ─── Side card (used in suggest + session) ────────────────────────────────

function SideCard({
  side,
  active,
  seconds,
  onClick,
  selectable,
}: {
  side: Side;
  active: boolean;
  seconds?: number;
  onClick?: () => void;
  selectable?: boolean;
}) {
  const sage = 'hsl(var(--ninho-sage))';

  return (
    <button
      onClick={onClick}
      disabled={!selectable && !onClick}
      className={`flex-1 rounded-3xl p-4 text-center transition-all ${
        selectable ? 'active:scale-95' : ''
      } ${active ? 'scale-[1.02]' : 'opacity-50'}`}
      style={{
        backgroundColor: active ? 'hsl(var(--ninho-sage) / 0.12)' : 'hsl(var(--muted))',
        border: active ? `2px solid hsl(var(--ninho-sage) / 0.3)` : '2px solid transparent',
      }}
    >
      <div
        className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-lg font-bold"
        style={{
          backgroundColor: active ? 'hsl(var(--ninho-sage) / 0.2)' : 'hsl(var(--muted))',
          color: sage,
        }}
      >
        {side === 'L' ? '←' : '→'}
      </div>
      <p
        className="text-xs mt-2 font-bold"
        style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
      >
        {side === 'L' ? 'Esquerdo' : 'Direito'}
      </p>
      {seconds !== undefined && (
        <p
          className="text-xl font-bold tabular-nums mt-1"
          style={{ color: sage, fontFamily: 'Quicksand, sans-serif' }}
        >
          {fmtTimer(seconds)}
        </p>
      )}
      {active && seconds !== undefined && (
        <div
          className="w-2 h-2 rounded-full mx-auto mt-2 animate-pulse"
          style={{ backgroundColor: sage }}
        />
      )}
    </button>
  );
}

// ─── Main FeedSheet ───────────────────────────────────────────────────────

interface FeedSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function FeedSheet({ open, onClose, onSaved }: FeedSheetProps) {
  const { user } = useAuth();
  const { activeChildId, activeChild } = useActiveChild();
  const [childId, setChildId] = useState(activeChildId ?? '');

  const [phase, setPhase] = useState<FeedPhase>('suggest');
  const [selectedSide, setSelectedSide] = useState<Side>('L');
  const [suggestedSide, setSuggestedSide] = useState<Side>('L');
  const [lastFeedTime, setLastFeedTime] = useState<string | null>(null);

  // Session state
  const [sessionStartEpoch, setSessionStartEpoch] = useState<number>(0);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [activeSide, setActiveSide] = useState<Side>('L');
  const [, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Summary
  const [summaryData, setSummaryData] = useState<{
    totalSec: number;
    leftSec: number;
    rightSec: number;
    switches: number;
    start: Date;
    end: Date;
    lastSide: Side;
  } | null>(null);

  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Bottle/formula state
  const [bottleMethod, setBottleMethod] = useState<'bottle' | 'formula'>('bottle');
  const [bottleAmount, setBottleAmount] = useState('');

  // ─── Derived values (recomputed every tick) ────────────────

  const now = Date.now();
  const isPaused =
    phase === 'session' &&
    segments.length > 0 &&
    segments[segments.length - 1].endEpoch !== null;

  const resolved = segments.map(s => ({
    ...s,
    endEpoch: s.endEpoch ?? now,
  }));
  const totalMs = resolved.reduce((a, s) => a + (s.endEpoch - s.startEpoch), 0);
  const leftMs = resolved.filter(s => s.side === 'L').reduce((a, s) => a + (s.endEpoch - s.startEpoch), 0);
  const rightMs = totalMs - leftMs;
  const totalSec = Math.floor(totalMs / 1000);
  const leftSec = Math.floor(leftMs / 1000);
  const rightSec = Math.floor(rightMs / 1000);
  const switches = Math.max(0, segments.length - 1);

  // ─── Timer tick ────────────────────────────────────────────

  useEffect(() => {
    if (phase === 'session' && !isPaused) {
      intervalRef.current = setInterval(() => setTick(t => t + 1), 200);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, isPaused]);

  // ─── On open: check persisted session or load suggestion ───

  const loadSuggestion = useCallback(async (cid: string) => {
    try {
      const { data } = await supabase
        .from('routine_logs')
        .select('notes, start_time')
        .eq('child_id', cid)
        .eq('type', 'feed')
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        const p = parsePayload(data.notes);
        const ls = p.last_side as Side | undefined;
        const opposite: Side = ls === 'L' ? 'R' : 'L';
        setSuggestedSide(opposite);
        setSelectedSide(opposite);
        setLastFeedTime(data.start_time);
      } else {
        setSuggestedSide('L');
        setSelectedSide('L');
        setLastFeedTime(null);
      }
    } catch {
      setSuggestedSide('L');
      setSelectedSide('L');
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const cid = activeChildId ?? '';
    setChildId(cid);
    setNotes('');
    setBottleAmount('');
    setBottleMethod('bottle');

    // Check for persisted session
    const persisted = loadSessionFromStorage();
    if (persisted && persisted.childId === cid && persisted.segments.length > 0) {
      // Restore session
      setSessionStartEpoch(persisted.sessionStartEpoch);
      setSegments(persisted.segments);
      setActiveSide(persisted.activeSide);
      setPhase('session');
    } else {
      setSegments([]);
      setPhase('suggest');
      loadSuggestion(cid);
    }
  }, [open, activeChildId, loadSuggestion]);

  // ─── Persist session on every segment change ───────────────

  useEffect(() => {
    if (phase === 'session' && segments.length > 0) {
      saveSessionToStorage({
        childId,
        sessionStartEpoch,
        segments,
        activeSide,
      });
    }
  }, [phase, segments, childId, sessionStartEpoch, activeSide]);

  // ─── Actions ───────────────────────────────────────────────

  function handleStart() {
    const n = Date.now();
    setSessionStartEpoch(n);
    setSegments([{ side: selectedSide, startEpoch: n, endEpoch: null }]);
    setActiveSide(selectedSide);
    setPhase('session');
  }

  function handleSwitch() {
    const n = Date.now();
    const newSide: Side = activeSide === 'L' ? 'R' : 'L';
    setSegments(prev => {
      const closed = prev.map((s, i) =>
        i === prev.length - 1 && s.endEpoch === null ? { ...s, endEpoch: n } : s,
      );
      return [...closed, { side: newSide, startEpoch: n, endEpoch: null }];
    });
    setActiveSide(newSide);
  }

  function handlePause() {
    if (isPaused) {
      // Resume
      const n = Date.now();
      setSegments(prev => [...prev, { side: activeSide, startEpoch: n, endEpoch: null }]);
    } else {
      // Pause
      const n = Date.now();
      setSegments(prev =>
        prev.map((s, i) =>
          i === prev.length - 1 && s.endEpoch === null ? { ...s, endEpoch: n } : s,
        ),
      );
    }
  }

  function handleFinish() {
    const n = Date.now();
    setSegments(prev => {
      const closed = prev.map((s, i) =>
        i === prev.length - 1 && s.endEpoch === null ? { ...s, endEpoch: n } : s,
      );
      const tMs = closed.reduce((a, s) => a + ((s.endEpoch ?? n) - s.startEpoch), 0);
      const lMs = closed.filter(s => s.side === 'L').reduce((a, s) => a + ((s.endEpoch ?? n) - s.startEpoch), 0);
      const rMs = tMs - lMs;
      const lastSeg = closed[closed.length - 1];
      setSummaryData({
        totalSec: Math.floor(tMs / 1000),
        leftSec: Math.floor(lMs / 1000),
        rightSec: Math.floor(rMs / 1000),
        switches: Math.max(0, closed.length - 1),
        start: new Date(sessionStartEpoch),
        end: new Date(n),
        lastSide: lastSeg?.side ?? 'L',
      });
      return closed;
    });
    setPhase('summary');
  }

  async function handleSave() {
    if (!user || !childId || !summaryData) return;
    setSaving(true);
    try {
      const payload = {
        session_type: 'breastfeed',
        left_seconds: summaryData.leftSec,
        right_seconds: summaryData.rightSec,
        total_seconds: summaryData.totalSec,
        switches: summaryData.switches,
        last_side: summaryData.lastSide,
      };

      const { error } = await supabase.from('routine_logs').insert({
        child_id: childId,
        author_id: user.id,
        type: 'feed',
        start_time: summaryData.start.toISOString(),
        end_time: summaryData.end.toISOString(),
        notes: makePayloadNotes(payload, notes),
      });
      if (error) throw error;
      clearSessionStorage();
      toast({ title: 'Sessão de amamentação salva! 🤱' });
      onSaved();
      handleClose();
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

  async function handleBottleSave() {
    if (!user || !childId) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { feeding_method: bottleMethod };
      if (bottleAmount) payload.amount_ml = Number(bottleAmount);
      const { error } = await supabase.from('routine_logs').insert({
        child_id: childId,
        author_id: user.id,
        type: 'feed',
        start_time: new Date().toISOString(),
        notes: makePayloadNotes(payload, notes),
      });
      if (error) throw error;
      toast({ title: bottleMethod === 'bottle' ? 'Mamadeira registrada! 🍼' : 'Fórmula registrada! 🥛' });
      onSaved();
      handleClose();
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

  // Manual entry state
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');
  const [manualSide, setManualSide] = useState<'L' | 'R' | 'both'>('L');

  async function handleManualSave() {
    if (!user || !childId || !manualStart) return;
    setSaving(true);
    try {
      const start = new Date(manualStart);
      const end = manualEnd ? new Date(manualEnd) : null;
      const totalSec = end ? Math.floor((end.getTime() - start.getTime()) / 1000) : 0;

      const payload: Record<string, unknown> = {
        session_type: 'breastfeed',
        mode: 'manual',
        total_seconds: totalSec,
        left_seconds: manualSide === 'R' ? 0 : manualSide === 'both' ? Math.floor(totalSec / 2) : totalSec,
        right_seconds: manualSide === 'L' ? 0 : manualSide === 'both' ? Math.ceil(totalSec / 2) : totalSec,
        switches: manualSide === 'both' ? 1 : 0,
        last_side: manualSide === 'L' ? 'L' : 'R',
      };

      const { error } = await supabase.from('routine_logs').insert({
        child_id: childId,
        author_id: user.id,
        type: 'feed',
        start_time: start.toISOString(),
        end_time: end?.toISOString() ?? null,
        notes: makePayloadNotes(payload, notes),
      });
      if (error) throw error;
      toast({ title: 'Amamentação registrada! 🤱' });
      onSaved();
      handleClose();
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

  function handleClose() {
    // Allow close but persist active session
    onClose();
    if (phase !== 'session') {
      setPhase('suggest');
      setSegments([]);
      setNotes('');
      setSummaryData(null);
    }
  }

  function handleDiscard() {
    clearSessionStorage();
    setSegments([]);
    setPhase('suggest');
    setSummaryData(null);
    setNotes('');
    loadSuggestion(childId);
  }

  const sage = 'hsl(var(--ninho-sage))';
  const brown = 'hsl(var(--ninho-brown))';

  // Dynamic sheet height
  const isFullHeight = phase === 'session' || phase === 'summary';

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <SheetContent
        side="bottom"
        className={`rounded-t-3xl pb-safe flex flex-col ${
          isFullHeight ? 'h-[92vh]' : ''
        }`}
        style={{ backgroundColor: 'hsl(var(--card))' }}
      >
        <AnimatePresence mode="wait">
          {/* ─── SUGGEST PHASE ─── */}
          {phase === 'suggest' && (
            <motion.div
              key="suggest"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col px-1 pt-2"
            >
              {/* Header */}
              <div className="text-center mb-6">
                <p
                  className="text-lg font-bold"
                  style={{ color: brown, fontFamily: 'Quicksand, sans-serif' }}
                >
                  🤱 Amamentar
                </p>
                {activeChild && (
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
                  >
                    {activeChild.name}
                  </p>
                )}
              </div>

              <ChildSelect value={childId} onChange={setChildId} />

              {/* Last feed info */}
              {lastFeedTime && (
                <div
                  className="rounded-2xl px-4 py-2.5 mb-5 text-center"
                  style={{ backgroundColor: 'hsl(var(--muted))' }}
                >
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                    Última mamada há <strong>{fmtTimeSince(lastFeedTime)}</strong>
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                    Bebês costumam mamar a cada 2–3h
                  </p>
                </div>
              )}

              {/* Side suggestion */}
              <p className="text-xs font-bold text-center mb-3" style={{ color: brown, fontFamily: 'Nunito, sans-serif' }}>
                Começar pelo lado
              </p>

              <div className="flex gap-3 mb-5">
                <SideCard
                  side="L"
                  active={selectedSide === 'L'}
                  selectable
                  onClick={() => setSelectedSide('L')}
                />
                <SideCard
                  side="R"
                  active={selectedSide === 'R'}
                  selectable
                  onClick={() => setSelectedSide('R')}
                />
              </div>

              {selectedSide !== suggestedSide && lastFeedTime && (
                <p className="text-[10px] text-center mb-3" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                  Sugerimos o lado {suggestedSide === 'L' ? 'esquerdo' : 'direito'} com base na última sessão
                </p>
              )}

              <Button
                onClick={handleStart}
                disabled={!childId}
                className="w-full rounded-2xl h-14 text-base font-bold"
                style={{ backgroundColor: sage, color: 'white' }}
              >
                ▶ Iniciar
              </Button>

              {/* Secondary options */}
              <div className="flex justify-center gap-4 mt-5">
                <button
                  onClick={() => setPhase('manual')}
                  className="text-xs font-semibold"
                  style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
                >
                  Adicionar manualmente
                </button>
                <span className="text-xs" style={{ color: 'hsl(var(--border))' }}>|</span>
                <button
                  onClick={() => setPhase('bottle')}
                  className="text-xs font-semibold"
                  style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
                >
                  Mamadeira / Fórmula
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── ACTIVE SESSION PHASE ─── */}
          {phase === 'session' && (
            <motion.div
              key="session"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col"
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-1 pt-1 mb-4">
                <p className="text-xs font-bold" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                  Sessão ativa
                </p>
                <button
                  onClick={handleDiscard}
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ color: 'hsl(var(--destructive))', backgroundColor: 'hsl(var(--destructive) / 0.08)' }}
                >
                  Descartar
                </button>
              </div>

              {/* Side indicators */}
              <div className="flex gap-3 px-2">
                <SideCard side="L" active={activeSide === 'L'} seconds={leftSec} />
                <SideCard side="R" active={activeSide === 'R'} seconds={rightSec} />
              </div>

              {/* Central timer */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <p
                  className="text-7xl font-bold tabular-nums"
                  style={{ color: sage, fontFamily: 'Quicksand, sans-serif' }}
                >
                  {fmtTimer(totalSec)}
                </p>
                <p
                  className="text-xs mt-2"
                  style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
                >
                  {isPaused ? '⏸ Pausado' : 'duração total'}
                </p>
                {switches > 0 && (
                  <p
                    className="text-[10px] mt-1"
                    style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
                  >
                    {switches} troca{switches > 1 ? 's' : ''} de lado
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="px-2 pb-4 space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={handlePause}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
                    style={{
                      backgroundColor: 'hsl(var(--muted))',
                      color: brown,
                      fontFamily: 'Nunito, sans-serif',
                    }}
                  >
                    {isPaused ? '▶ Continuar' : '⏸ Pausar'}
                  </button>
                  <button
                    onClick={handleFinish}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
                    style={{
                      backgroundColor: 'hsl(var(--ninho-mauve) / 0.15)',
                      color: 'hsl(var(--ninho-mauve))',
                      fontFamily: 'Nunito, sans-serif',
                    }}
                  >
                    ✓ Finalizar
                  </button>
                </div>

                {/* Primary: Switch side */}
                <button
                  onClick={handleSwitch}
                  disabled={isPaused}
                  className="w-full py-4 rounded-2xl text-base font-bold transition-all active:scale-[0.97] disabled:opacity-40"
                  style={{
                    backgroundColor: sage,
                    color: 'white',
                    fontFamily: 'Nunito, sans-serif',
                  }}
                >
                  ⟷ Trocar para lado {activeSide === 'L' ? 'direito' : 'esquerdo'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── SUMMARY PHASE ─── */}
          {phase === 'summary' && summaryData && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col px-1 pt-2"
            >
              <p
                className="text-lg font-bold text-center mb-6"
                style={{ color: brown, fontFamily: 'Quicksand, sans-serif' }}
              >
                Resumo da sessão
              </p>

              {/* Big total */}
              <div className="text-center mb-5">
                <p
                  className="text-5xl font-bold tabular-nums"
                  style={{ color: sage, fontFamily: 'Quicksand, sans-serif' }}
                >
                  {fmtDurationShort(summaryData.totalSec)}
                </p>
                <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                  duração total
                </p>
              </div>

              {/* Breakdown */}
              <div className="flex gap-3 mb-4">
                <div
                  className="flex-1 rounded-2xl p-4 text-center"
                  style={{ backgroundColor: 'hsl(var(--ninho-sage) / 0.08)' }}
                >
                  <p className="text-[10px] font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Esquerdo
                  </p>
                  <p className="text-xl font-bold mt-1" style={{ color: sage, fontFamily: 'Quicksand, sans-serif' }}>
                    {fmtDurationShort(summaryData.leftSec)}
                  </p>
                </div>
                <div
                  className="flex-1 rounded-2xl p-4 text-center"
                  style={{ backgroundColor: 'hsl(var(--muted))' }}
                >
                  <p className="text-[10px] font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Trocas
                  </p>
                  <p className="text-xl font-bold mt-1" style={{ color: brown, fontFamily: 'Quicksand, sans-serif' }}>
                    {summaryData.switches}
                  </p>
                </div>
                <div
                  className="flex-1 rounded-2xl p-4 text-center"
                  style={{ backgroundColor: 'hsl(var(--ninho-mauve) / 0.08)' }}
                >
                  <p className="text-[10px] font-semibold uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Direito
                  </p>
                  <p className="text-xl font-bold mt-1" style={{ color: 'hsl(var(--ninho-mauve))', fontFamily: 'Quicksand, sans-serif' }}>
                    {fmtDurationShort(summaryData.rightSec)}
                  </p>
                </div>
              </div>

              {/* Visual bar */}
              {summaryData.totalSec > 0 && (
                <div className="h-3 rounded-full overflow-hidden flex mb-5" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                  <div
                    className="h-full rounded-l-full"
                    style={{
                      width: `${(summaryData.leftSec / summaryData.totalSec) * 100}%`,
                      backgroundColor: sage,
                    }}
                  />
                  <div
                    className="h-full rounded-r-full"
                    style={{
                      width: `${(summaryData.rightSec / summaryData.totalSec) * 100}%`,
                      backgroundColor: 'hsl(var(--ninho-mauve))',
                    }}
                  />
                </div>
              )}

              {/* Time */}
              <div className="flex justify-between text-[10px] mb-5 px-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                <span>
                  Início: {summaryData.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span>
                  Fim: {summaryData.end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex-1" />

              {/* Notes */}
              <div className="space-y-1.5 mb-4">
                <Label className="text-xs font-semibold" style={{ color: brown }}>
                  Observações (opcional)
                </Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Mamou bem, ficou tranquilo..."
                  className="rounded-2xl border-border resize-none"
                  rows={2}
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-2xl h-14 text-base font-bold mb-2"
                style={{ backgroundColor: sage, color: 'white' }}
              >
                {saving ? 'Salvando...' : '✓ Salvar sessão'}
              </Button>

              <button
                onClick={handleDiscard}
                className="w-full py-2 text-xs font-semibold"
                style={{ color: 'hsl(var(--destructive))' }}
              >
                Descartar
              </button>
            </motion.div>
          )}

          {/* ─── MANUAL PHASE ─── */}
          {phase === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-1 pt-2 space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-lg font-bold" style={{ color: brown, fontFamily: 'Quicksand, sans-serif' }}>
                  Registro manual
                </p>
                <button
                  onClick={() => setPhase('suggest')}
                  className="text-xs font-semibold"
                  style={{ color: sage }}
                >
                  ← Voltar
                </button>
              </div>

              <ChildSelect value={childId} onChange={setChildId} />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold" style={{ color: brown }}>Início</Label>
                  <Input
                    type="datetime-local"
                    value={manualStart}
                    onChange={e => setManualStart(e.target.value)}
                    className="h-11 rounded-2xl border-border text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold" style={{ color: brown }}>Fim</Label>
                  <Input
                    type="datetime-local"
                    value={manualEnd}
                    onChange={e => setManualEnd(e.target.value)}
                    className="h-11 rounded-2xl border-border text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ color: brown }}>Lado</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: 'L' as const, l: '← Esquerdo' },
                    { v: 'R' as const, l: 'Direito →' },
                    { v: 'both' as const, l: 'Ambos' },
                  ]).map(opt => (
                    <button
                      key={opt.v}
                      onClick={() => setManualSide(opt.v)}
                      className="py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95"
                      style={{
                        backgroundColor: manualSide === opt.v ? sage : 'hsl(var(--muted))',
                        color: manualSide === opt.v ? 'white' : brown,
                        fontFamily: 'Nunito, sans-serif',
                      }}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ color: brown }}>Observações (opcional)</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="..."
                  className="rounded-2xl border-border resize-none"
                  rows={2}
                />
              </div>

              <Button
                onClick={handleManualSave}
                disabled={saving || !childId || !manualStart}
                className="w-full rounded-2xl h-12 font-bold"
                style={{ backgroundColor: sage, color: 'white' }}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </motion.div>
          )}

          {/* ─── BOTTLE / FORMULA PHASE ─── */}
          {phase === 'bottle' && (
            <motion.div
              key="bottle"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-1 pt-2 space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-lg font-bold" style={{ color: brown, fontFamily: 'Quicksand, sans-serif' }}>
                  {bottleMethod === 'bottle' ? '🍼 Mamadeira' : '🥛 Fórmula'}
                </p>
                <button
                  onClick={() => setPhase('suggest')}
                  className="text-xs font-semibold"
                  style={{ color: sage }}
                >
                  ← Voltar
                </button>
              </div>

              <ChildSelect value={childId} onChange={setChildId} />

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ color: brown }}>Tipo</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { v: 'bottle' as const, l: '🍼 Mamadeira' },
                    { v: 'formula' as const, l: '🥛 Fórmula' },
                  ]).map(opt => (
                    <button
                      key={opt.v}
                      onClick={() => setBottleMethod(opt.v)}
                      className="py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
                      style={{
                        backgroundColor: bottleMethod === opt.v ? sage : 'hsl(var(--muted))',
                        color: bottleMethod === opt.v ? 'white' : brown,
                        fontFamily: 'Nunito, sans-serif',
                      }}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ color: brown }}>Quantidade (ml)</Label>
                <Input
                  type="number"
                  value={bottleAmount}
                  onChange={e => setBottleAmount(e.target.value)}
                  placeholder="120"
                  min="0"
                  className="h-11 rounded-2xl border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ color: brown }}>Observações (opcional)</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="..."
                  className="rounded-2xl border-border resize-none"
                  rows={2}
                />
              </div>

              <Button
                onClick={handleBottleSave}
                disabled={saving || !childId}
                className="w-full rounded-2xl h-12 font-bold"
                style={{ backgroundColor: sage, color: 'white' }}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}
