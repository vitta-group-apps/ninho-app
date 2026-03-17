/**
 * FeedSheet v3 — Breastfeeding session as a first-class product experience.
 *
 * Key invariants:
 *  - switchCount only increments on explicit "Trocar lado" taps
 *  - Pause / resume never affects switchCount
 *  - Session persists to localStorage (survives sheet close)
 *  - Observations stored as structured tags[] + optional free text
 *  - Contextual insights computed from recent session history (max 1 shown)
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
  type RoutineLog,
} from '@/lib/routineUtils';

// ─── Constants ─────────────────────────────────────────────────────────────

const SESSION_KEY = 'ninho_feed_session';

const QUICK_TAGS = [
  { id: 'mamou_bem', label: '😊 Mamou bem' },
  { id: 'inquieto', label: '😟 Inquieto' },
  { id: 'dormiu', label: '😴 Dormiu durante' },
  { id: 'desconforto', label: '😣 Desconforto' },
  { id: 'pega_boa', label: '👍 Pega boa' },
  { id: 'rejeitou_lado', label: '↩️ Rejeitou lado' },
];

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
  switchCount: number;
}

// ─── Pure helpers ──────────────────────────────────────────────────────────

function saveSession(data: PersistedSession) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch { /* noop */ }
}
function clearSession() { localStorage.removeItem(SESSION_KEY); }
function loadSession(): PersistedSession | null {
  try { const r = localStorage.getItem(SESSION_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}

/** Compute contextual insights from recent session history. Returns max 1. */
function computeInsights(
  totalSec: number,
  sw: number,
  lastFeedTime: string | null,
  recent: { start_time: string; notes: string | null }[],
): string[] {
  const insights: string[] = [];
  const today = new Date().toDateString();
  const todaySessions = recent.filter(s => new Date(s.start_time).toDateString() === today);

  // Longest session today
  const todayTotals = todaySessions
    .map(s => Number(parsePayload(s.notes).total_seconds ?? 0))
    .filter(t => t > 0);
  if (todayTotals.length >= 1 && totalSec > Math.max(...todayTotals)) {
    insights.push('✨ Sessão mais longa do dia');
  }

  // Short interval vs average
  if (lastFeedTime && recent.length >= 4) {
    const times = recent.slice(0, 6).map(s => new Date(s.start_time).getTime());
    const diffs = times.slice(0, -1).map((t, i) => Math.abs(t - times[i + 1]) / 60000);
    const avgMin = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const currentMin = (Date.now() - new Date(lastFeedTime).getTime()) / 60000;
    if (avgMin > 0 && currentMin < avgMin * 0.65 && currentMin < 90) {
      insights.push('⏱ Intervalo menor que o usual');
    }
  }

  // More switches than usual
  if (todaySessions.length >= 2) {
    const swCounts = todaySessions.map(s => Number(parsePayload(s.notes).switches ?? 0));
    const avg = swCounts.reduce((a, b) => a + b, 0) / swCounts.length;
    if (avg > 0 && sw > avg * 1.5 && sw >= 3) {
      insights.push('🔄 Mais trocas que o habitual');
    }
  }

  return insights.slice(0, 1); // max 1 insight
}

// ─── SideCard ──────────────────────────────────────────────────────────────

function SideCard({
  side,
  active,
  seconds,
  onClick,
}: {
  side: Side;
  active: boolean;
  seconds?: number;
  onClick?: () => void;
}) {
  const sage = 'hsl(var(--ninho-sage))';
  const mauve = 'hsl(var(--ninho-mauve))';
  const activeColor = sage;
  const label = side === 'L' ? 'Esquerdo' : 'Direito';
  const arrow = side === 'L' ? '←' : '→';

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="flex-1 rounded-3xl p-4 text-center transition-all duration-200"
      style={{
        backgroundColor: active ? 'hsl(var(--ninho-sage) / 0.1)' : 'hsl(var(--muted))',
        border: active ? `2px solid hsl(var(--ninho-sage) / 0.4)` : '2px solid transparent',
        opacity: active ? 1 : 0.35,
        transform: active ? 'scale(1.04)' : 'scale(1)',
        boxShadow: active ? `0 4px 24px -6px hsl(var(--ninho-sage) / 0.35)` : 'none',
      }}
    >
      <div
        className="w-11 h-11 rounded-full mx-auto flex items-center justify-center text-base font-bold"
        style={{
          backgroundColor: active ? 'hsl(var(--ninho-sage) / 0.2)' : 'hsl(var(--border))',
          color: active ? activeColor : 'hsl(var(--muted-foreground))',
        }}
      >
        {arrow}
      </div>

      <p
        className="text-[11px] mt-2 font-bold uppercase tracking-wide"
        style={{
          color: active ? activeColor : 'hsl(var(--muted-foreground))',
          fontFamily: 'Nunito, sans-serif',
        }}
      >
        {label}
      </p>

      {seconds !== undefined && (
        <p
          className="text-2xl font-bold tabular-nums mt-1"
          style={{
            color: active ? activeColor : 'hsl(var(--muted-foreground))',
            fontFamily: 'Quicksand, sans-serif',
          }}
        >
          {fmtTimer(seconds)}
        </p>
      )}

      {active && (
        <div className="flex items-center justify-center gap-1 mt-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: activeColor }}
          />
          <span
            className="text-[10px] font-semibold"
            style={{ color: activeColor, fontFamily: 'Nunito, sans-serif' }}
          >
            ativo
          </span>
        </div>
      )}

      {/* Selectable state (suggest phase) */}
      {onClick && !active && (
        <div className="mt-2">
          <div
            className="w-5 h-5 rounded-full border-2 mx-auto"
            style={{ borderColor: 'hsl(var(--border))' }}
          />
        </div>
      )}
      {onClick && active && (
        <div className="mt-2">
          <div
            className="w-5 h-5 rounded-full mx-auto flex items-center justify-center"
            style={{ backgroundColor: activeColor }}
          >
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        </div>
      )}
    </button>
  );
}

// ─── ChildSelect ───────────────────────────────────────────────────────────

function ChildSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { children } = useActiveChild();
  if (children.length <= 1) return null;
  return (
    <div className="space-y-1.5 mb-4">
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

  // Phase management
  const [phase, setPhase] = useState<FeedPhase>('suggest');

  // Suggestion phase
  const [selectedSide, setSelectedSide] = useState<Side>('L');
  const [suggestedSide, setSuggestedSide] = useState<Side>('L');
  const [lastFeedTime, setLastFeedTime] = useState<string | null>(null);
  const [recentSessions, setRecentSessions] = useState<RoutineLog[]>([]);

  // Session phase — segments track time blocks per side
  const [sessionStartEpoch, setSessionStartEpoch] = useState<number>(0);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [activeSide, setActiveSide] = useState<Side>('L');
  // ✅ switchCount is ONLY incremented by handleSwitch, never by pause/resume
  const [switchCount, setSwitchCount] = useState(0);
  const [, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Summary phase
  const [summaryData, setSummaryData] = useState<{
    totalSec: number;
    leftSec: number;
    rightSec: number;
    switches: number;
    start: Date;
    end: Date;
    lastSide: Side;
  } | null>(null);
  const [sessionInsights, setSessionInsights] = useState<string[]>([]);

  // Observations (summary phase)
  const [obsOpen, setObsOpen] = useState(false);
  const [obsTags, setObsTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Bottle/formula phase
  const [bottleMethod, setBottleMethod] = useState<'bottle' | 'formula'>('bottle');
  const [bottleAmount, setBottleAmount] = useState('');

  // Manual phase
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');
  const [manualSide, setManualSide] = useState<'L' | 'R' | 'both'>('L');

  // ─── Derived values (recomputed every tick) ──────────────

  const now = Date.now();
  // isPaused: last segment already has an endEpoch (was explicitly closed by handlePause)
  const isPaused =
    phase === 'session' &&
    segments.length > 0 &&
    segments[segments.length - 1].endEpoch !== null;

  const resolved = segments.map(s => ({ ...s, endEpoch: s.endEpoch ?? now }));
  const totalSec = Math.floor(resolved.reduce((a, s) => a + (s.endEpoch - s.startEpoch), 0) / 1000);
  const leftSec = Math.floor(resolved.filter(s => s.side === 'L').reduce((a, s) => a + (s.endEpoch - s.startEpoch), 0) / 1000);
  const rightSec = totalSec - leftSec;

  // ─── Timer tick ─────────────────────────────────────────

  useEffect(() => {
    if (phase === 'session' && !isPaused) {
      intervalRef.current = setInterval(() => setTick(t => t + 1), 200);
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, isPaused]);

  // ─── Load suggestion + recent history ───────────────────

  const loadSuggestion = useCallback(async (cid: string) => {
    try {
      const { data } = await supabase
        .from('routine_logs')
        .select('*')
        .eq('child_id', cid)
        .eq('type', 'feed')
        .order('start_time', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        const last = data[0];
        const p = parsePayload(last.notes);
        const ls = p.last_side as Side | undefined;
        const suggested: Side = ls === 'L' ? 'R' : 'L';
        setSuggestedSide(suggested);
        setSelectedSide(suggested);
        setLastFeedTime(last.start_time);
        setRecentSessions(data as RoutineLog[]);
      } else {
        setSuggestedSide('L');
        setSelectedSide('L');
        setLastFeedTime(null);
        setRecentSessions([]);
      }
    } catch {
      setSuggestedSide('L');
      setSelectedSide('L');
    }
  }, []);

  // ─── On sheet open ───────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    const cid = activeChildId ?? '';
    setChildId(cid);
    resetObsState();

    const persisted = loadSession();
    if (persisted && persisted.childId === cid && persisted.segments.length > 0) {
      setSessionStartEpoch(persisted.sessionStartEpoch);
      setSegments(persisted.segments);
      setActiveSide(persisted.activeSide);
      setSwitchCount(persisted.switchCount ?? 0);
      setPhase('session');
    } else {
      setSegments([]);
      setSwitchCount(0);
      setPhase('suggest');
      loadSuggestion(cid);
    }
  }, [open, activeChildId, loadSuggestion]);

  // ─── Persist session on change ───────────────────────────

  useEffect(() => {
    if (phase === 'session' && segments.length > 0) {
      saveSession({ childId, sessionStartEpoch, segments, activeSide, switchCount });
    }
  }, [phase, segments, childId, sessionStartEpoch, activeSide, switchCount]);

  // ─── Helpers ─────────────────────────────────────────────

  function resetObsState() {
    setObsOpen(false);
    setObsTags([]);
    setNotes('');
    setSummaryData(null);
    setSessionInsights([]);
    setSaving(false);
    setBottleAmount('');
    setBottleMethod('bottle');
  }

  function toggleTag(id: string) {
    setObsTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }

  // ─── Session actions ─────────────────────────────────────

  function handleStart() {
    const n = Date.now();
    setSessionStartEpoch(n);
    setSegments([{ side: selectedSide, startEpoch: n, endEpoch: null }]);
    setActiveSide(selectedSide);
    setSwitchCount(0);
    setPhase('session');
  }

  /** ✅ ONLY this function increments switchCount */
  function handleSwitch() {
    const n = Date.now();
    const newSide: Side = activeSide === 'L' ? 'R' : 'L';
    // Close current segment (whether running or already paused from a prior pause)
    // Then open a new one for the other side
    setSegments(prev => {
      const closed = prev.map((s, i) =>
        i === prev.length - 1 && s.endEpoch === null ? { ...s, endEpoch: n } : s,
      );
      return [...closed, { side: newSide, startEpoch: n, endEpoch: null }];
    });
    setActiveSide(newSide);
    setSwitchCount(c => c + 1); // ← ONLY incremented here
  }

  /** Pause = close current segment WITHOUT incrementing switchCount */
  function handlePause() {
    const n = Date.now();
    setSegments(prev =>
      prev.map((s, i) =>
        i === prev.length - 1 && s.endEpoch === null ? { ...s, endEpoch: n } : s,
      ),
    );
    // switchCount unchanged ✅
  }

  /** Resume = open new segment for SAME side WITHOUT incrementing switchCount */
  function handleResume() {
    const n = Date.now();
    setSegments(prev => [...prev, { side: activeSide, startEpoch: n, endEpoch: null }]);
    // switchCount unchanged ✅
  }

  function handleFinish() {
    const n = Date.now();

    // Close last segment if still open
    const closedSegments = segments.map((s, i) =>
      i === segments.length - 1 && s.endEpoch === null ? { ...s, endEpoch: n } : s,
    );

    const tMs = closedSegments.reduce((a, s) => a + ((s.endEpoch ?? n) - s.startEpoch), 0);
    const lMs = closedSegments.filter(s => s.side === 'L').reduce((a, s) => a + ((s.endEpoch ?? n) - s.startEpoch), 0);
    const rMs = tMs - lMs;
    const lastSeg = closedSegments[closedSegments.length - 1];
    const tSec = Math.floor(tMs / 1000);

    const insights = computeInsights(tSec, switchCount, lastFeedTime, recentSessions);

    setSegments(closedSegments);
    setSummaryData({
      totalSec: tSec,
      leftSec: Math.floor(lMs / 1000),
      rightSec: Math.floor(rMs / 1000),
      switches: switchCount, // ✅ uses dedicated counter
      start: new Date(sessionStartEpoch),
      end: new Date(n),
      lastSide: lastSeg?.side ?? 'L',
    });
    setSessionInsights(insights);
    setPhase('summary');
  }

  // ─── Save actions ─────────────────────────────────────────

  async function handleSave() {
    if (!user || !childId || !summaryData) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        session_type: 'breastfeed',
        left_seconds: summaryData.leftSec,
        right_seconds: summaryData.rightSec,
        total_seconds: summaryData.totalSec,
        switches: summaryData.switches,
        last_side: summaryData.lastSide,
        ...(obsTags.length > 0 && { tags: obsTags.join(',') }),
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
      clearSession();
      toast({ title: 'Sessão salva! 🤱' });
      onSaved();
      handleClose(true);
    } catch (e: unknown) {
      toast({ title: 'Erro ao salvar', description: e instanceof Error ? e.message : 'Tente novamente', variant: 'destructive' });
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
      handleClose(true);
    } catch (e: unknown) {
      toast({ title: 'Erro ao salvar', description: e instanceof Error ? e.message : 'Tente novamente', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleManualSave() {
    if (!user || !childId || !manualStart) return;
    setSaving(true);
    try {
      const start = new Date(manualStart);
      const end = manualEnd ? new Date(manualEnd) : null;
      const tSec = end ? Math.floor((end.getTime() - start.getTime()) / 1000) : 0;
      const lSec = manualSide === 'R' ? 0 : manualSide === 'both' ? Math.floor(tSec / 2) : tSec;
      const rSec = manualSide === 'L' ? 0 : manualSide === 'both' ? Math.ceil(tSec / 2) : tSec;

      const { error } = await supabase.from('routine_logs').insert({
        child_id: childId,
        author_id: user.id,
        type: 'feed',
        start_time: start.toISOString(),
        end_time: end?.toISOString() ?? null,
        notes: makePayloadNotes({
          session_type: 'breastfeed',
          mode: 'manual',
          total_seconds: tSec,
          left_seconds: lSec,
          right_seconds: rSec,
          switches: manualSide === 'both' ? 1 : 0,
          last_side: manualSide === 'L' ? 'L' : 'R',
        }, notes),
      });
      if (error) throw error;
      toast({ title: 'Amamentação registrada! 🤱' });
      onSaved();
      handleClose(true);
    } catch (e: unknown) {
      toast({ title: 'Erro ao salvar', description: e instanceof Error ? e.message : 'Tente novamente', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  function handleClose(fullReset = false) {
    onClose();
    if (fullReset || phase !== 'session') {
      setPhase('suggest');
      setSegments([]);
      setSwitchCount(0);
      resetObsState();
    }
    // If in active session, just close — session persists in localStorage
  }

  function handleDiscard() {
    clearSession();
    setSegments([]);
    setSwitchCount(0);
    setPhase('suggest');
    resetObsState();
    loadSuggestion(childId);
  }

  // ─── Shared styles ────────────────────────────────────────

  const sage = 'hsl(var(--ninho-sage))';
  const brown = 'hsl(var(--ninho-brown))';
  const mauve = 'hsl(var(--ninho-mauve))';
  const isFullHeight = phase === 'session' || phase === 'summary';

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <SheetContent
        side="bottom"
        className={`rounded-t-3xl pb-safe flex flex-col overflow-y-auto ${isFullHeight ? 'h-[92vh]' : ''}`}
        style={{ backgroundColor: 'hsl(var(--card))' }}
      >
        <AnimatePresence mode="wait">

          {/* ══════════════════════════════════════════════
              SUGGEST PHASE
          ══════════════════════════════════════════════ */}
          {phase === 'suggest' && (
            <motion.div
              key="suggest"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col px-1 pt-2"
            >
              {/* Title */}
              <div className="mb-5">
                <p className="text-xl font-bold" style={{ color: brown, fontFamily: 'Quicksand, sans-serif' }}>
                  🤱 Amamentar
                </p>
                {activeChild && (
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                    {activeChild.name}
                  </p>
                )}
              </div>

              <ChildSelect value={childId} onChange={setChildId} />

              {/* Last feed banner */}
              {lastFeedTime && (
                <div
                  className="rounded-2xl px-4 py-3 mb-5 flex items-center gap-3"
                  style={{ backgroundColor: 'hsl(var(--ninho-sage) / 0.08)' }}
                >
                  <span className="text-xl">⏰</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: brown, fontFamily: 'Quicksand, sans-serif' }}>
                      Última mamada há {fmtTimeSince(lastFeedTime)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                      Bebês costumam mamar a cada 2–3h
                    </p>
                  </div>
                </div>
              )}

              {/* Side selector */}
              <p
                className="text-xs font-bold uppercase tracking-wider mb-3"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
              >
                Começar pelo lado
              </p>

              <div className="flex gap-3 mb-2">
                <SideCard side="L" active={selectedSide === 'L'} onClick={() => setSelectedSide('L')} />
                <SideCard side="R" active={selectedSide === 'R'} onClick={() => setSelectedSide('R')} />
              </div>

              {selectedSide === suggestedSide && lastFeedTime ? (
                <p className="text-[11px] text-center mb-5" style={{ color: sage, fontFamily: 'Nunito, sans-serif' }}>
                  ✓ Sugerido com base na última sessão
                </p>
              ) : (
                <div className="mb-5" />
              )}

              {/* PRIMARY CTA */}
              <Button
                onClick={handleStart}
                disabled={!childId}
                className="w-full rounded-2xl h-14 text-base font-bold shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${sage}, ${mauve})`,
                  color: 'white',
                }}
              >
                ▶ Iniciar amamentação
              </Button>

              {/* SECONDARY actions — clearly tappable, lower visual weight */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={() => setPhase('manual')}
                  className="py-3 rounded-2xl text-sm font-bold text-center transition-all active:scale-95"
                  style={{
                    backgroundColor: 'hsl(var(--muted))',
                    color: brown,
                    fontFamily: 'Nunito, sans-serif',
                  }}
                >
                  📝 Registrar manualmente
                </button>
                <button
                  onClick={() => setPhase('bottle')}
                  className="py-3 rounded-2xl text-sm font-bold text-center transition-all active:scale-95"
                  style={{
                    backgroundColor: 'hsl(var(--muted))',
                    color: brown,
                    fontFamily: 'Nunito, sans-serif',
                  }}
                >
                  🍼 Mamadeira / Fórmula
                </button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════
              SESSION PHASE
          ══════════════════════════════════════════════ */}
          {phase === 'session' && (
            <motion.div
              key="session"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-1 pt-1 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: sage }} />
                  <p className="text-xs font-bold" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                    {isPaused ? 'Pausado' : 'Sessão ativa'}
                  </p>
                </div>
                <button
                  onClick={handleDiscard}
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ color: 'hsl(var(--destructive))', backgroundColor: 'hsl(var(--destructive) / 0.08)' }}
                >
                  Descartar
                </button>
              </div>

              {/* Side cards — active one is very prominent */}
              <div className="flex gap-3 px-1">
                <SideCard side="L" active={activeSide === 'L'} seconds={leftSec} />
                <SideCard side="R" active={activeSide === 'R'} seconds={rightSec} />
              </div>

              {/* Central total timer */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <p
                  className="text-7xl font-bold tabular-nums"
                  style={{ color: isPaused ? 'hsl(var(--muted-foreground))' : sage, fontFamily: 'Quicksand, sans-serif' }}
                >
                  {fmtTimer(totalSec)}
                </p>
                <p
                  className="text-xs mt-2 font-semibold"
                  style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
                >
                  {isPaused ? '⏸ Pausado' : 'duração total'}
                </p>
                {switchCount > 0 && (
                  <p
                    className="text-[11px] mt-1 px-3 py-1 rounded-full mt-2"
                    style={{
                      color: mauve,
                      backgroundColor: 'hsl(var(--ninho-mauve) / 0.1)',
                      fontFamily: 'Nunito, sans-serif',
                      fontWeight: 600,
                    }}
                  >
                    {switchCount} troca{switchCount > 1 ? 's' : ''} de lado
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="px-1 pb-4 space-y-3">
                {/* Secondary: Pause + Finish */}
                <div className="flex gap-3">
                  <button
                    onClick={isPaused ? handleResume : handlePause}
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
                      backgroundColor: 'hsl(var(--ninho-mauve) / 0.12)',
                      color: mauve,
                      fontFamily: 'Nunito, sans-serif',
                    }}
                  >
                    ✓ Finalizar
                  </button>
                </div>

                {/* PRIMARY: Switch side — thumb-reachable at bottom */}
                <button
                  onClick={handleSwitch}
                  className="w-full py-5 rounded-2xl text-base font-bold transition-all active:scale-[0.97] shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${sage}, ${mauve})`,
                    color: 'white',
                    fontFamily: 'Nunito, sans-serif',
                  }}
                >
                  ⟷ Trocar para lado {activeSide === 'L' ? 'direito →' : '← esquerdo'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════
              SUMMARY PHASE
          ══════════════════════════════════════════════ */}
          {phase === 'summary' && summaryData && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="flex-1 flex flex-col px-1 pt-2"
            >
              <p className="text-xl font-bold text-center mb-1" style={{ color: brown, fontFamily: 'Quicksand, sans-serif' }}>
                Resumo
              </p>
              <p className="text-xs text-center mb-5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                {summaryData.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} –{' '}
                {summaryData.end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>

              {/* Total */}
              <div className="text-center mb-5">
                <p className="text-5xl font-bold tabular-nums" style={{ color: sage, fontFamily: 'Quicksand, sans-serif' }}>
                  {fmtDurationShort(summaryData.totalSec)}
                </p>
                <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                  duração total
                </p>
              </div>

              {/* E / Trocas / D */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1 rounded-2xl p-3.5 text-center" style={{ backgroundColor: 'hsl(var(--ninho-sage) / 0.08)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: sage }}>Esquerdo</p>
                  <p className="text-xl font-bold mt-1" style={{ color: sage, fontFamily: 'Quicksand, sans-serif' }}>
                    {fmtDurationShort(summaryData.leftSec)}
                  </p>
                </div>
                <div className="flex-1 rounded-2xl p-3.5 text-center" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>Trocas</p>
                  <p className="text-xl font-bold mt-1" style={{ color: brown, fontFamily: 'Quicksand, sans-serif' }}>
                    {summaryData.switches}
                  </p>
                </div>
                <div className="flex-1 rounded-2xl p-3.5 text-center" style={{ backgroundColor: 'hsl(var(--ninho-mauve) / 0.08)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: mauve }}>Direito</p>
                  <p className="text-xl font-bold mt-1" style={{ color: mauve, fontFamily: 'Quicksand, sans-serif' }}>
                    {fmtDurationShort(summaryData.rightSec)}
                  </p>
                </div>
              </div>

              {/* Visual E/D split bar */}
              {summaryData.totalSec > 0 && (
                <div className="h-2.5 rounded-full overflow-hidden flex mb-4" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${(summaryData.leftSec / summaryData.totalSec) * 100}%`,
                      background: `linear-gradient(90deg, ${sage}, hsl(var(--ninho-sage) / 0.7))`,
                      borderRadius: '9999px 0 0 9999px',
                    }}
                  />
                  {summaryData.rightSec > 0 && (
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${(summaryData.rightSec / summaryData.totalSec) * 100}%`,
                        background: `linear-gradient(90deg, hsl(var(--ninho-mauve) / 0.7), ${mauve})`,
                        borderRadius: '0 9999px 9999px 0',
                      }}
                    />
                  )}
                </div>
              )}

              {/* Contextual insight (only when meaningful) */}
              {sessionInsights.length > 0 && (
                <div
                  className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-2"
                  style={{ backgroundColor: 'hsl(var(--ninho-sage) / 0.07)', border: `1px solid hsl(var(--ninho-sage) / 0.2)` }}
                >
                  <p className="text-sm font-semibold" style={{ color: brown, fontFamily: 'Nunito, sans-serif' }}>
                    {sessionInsights[0]}
                  </p>
                </div>
              )}

              <div className="flex-1" />

              {/* Observation section */}
              <AnimatePresence>
                {!obsOpen ? (
                  <motion.button
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setObsOpen(true)}
                    className="w-full py-3 rounded-2xl text-sm font-bold text-center mb-3 transition-all active:scale-95"
                    style={{
                      backgroundColor: 'hsl(var(--muted))',
                      color: brown,
                      fontFamily: 'Nunito, sans-serif',
                    }}
                  >
                    + Adicionar observação
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                        Como foi?
                      </p>
                      <button
                        onClick={() => { setObsOpen(false); setObsTags([]); setNotes(''); }}
                        className="text-xs"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                      >
                        Cancelar
                      </button>
                    </div>

                    {/* Quick tags */}
                    <div className="flex flex-wrap gap-2">
                      {QUICK_TAGS.map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.id)}
                          className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all active:scale-95"
                          style={{
                            backgroundColor: obsTags.includes(tag.id) ? sage : 'hsl(var(--muted))',
                            color: obsTags.includes(tag.id) ? 'white' : brown,
                            fontFamily: 'Nunito, sans-serif',
                          }}
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>

                    {/* Free text */}
                    <Textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Outras observações..."
                      className="rounded-2xl border-border resize-none"
                      rows={2}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Save */}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-2xl h-14 text-base font-bold shadow-md mb-2"
                style={{ background: `linear-gradient(135deg, ${sage}, ${mauve})`, color: 'white' }}
              >
                {saving ? 'Salvando...' : '✓ Salvar sessão'}
              </Button>

              <button
                onClick={handleDiscard}
                className="w-full py-2 text-xs font-semibold"
                style={{ color: 'hsl(var(--destructive))', fontFamily: 'Nunito, sans-serif' }}
              >
                Descartar sessão
              </button>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════
              MANUAL PHASE
          ══════════════════════════════════════════════ */}
          {phase === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="px-1 pt-2 space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-lg font-bold" style={{ color: brown, fontFamily: 'Quicksand, sans-serif' }}>
                  📝 Registro manual
                </p>
                <button
                  onClick={() => setPhase('suggest')}
                  className="text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: 'hsl(var(--muted))', color: brown }}
                >
                  ← Voltar
                </button>
              </div>

              <ChildSelect value={childId} onChange={setChildId} />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold" style={{ color: brown }}>Início</Label>
                  <Input type="datetime-local" value={manualStart} onChange={e => setManualStart(e.target.value)}
                    className="h-11 rounded-2xl border-border text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold" style={{ color: brown }}>Fim (opcional)</Label>
                  <Input type="datetime-local" value={manualEnd} onChange={e => setManualEnd(e.target.value)}
                    className="h-11 rounded-2xl border-border text-xs" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ color: brown }}>Lado</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: 'L' as const, l: '← Esquerdo' },
                    { v: 'R' as const, l: 'Direito →' },
                    { v: 'both' as const, l: '↔ Ambos' },
                  ]).map(opt => (
                    <button key={opt.v} onClick={() => setManualSide(opt.v)}
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
                <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Mamou bem..." className="rounded-2xl border-border resize-none" rows={2} />
              </div>

              <Button onClick={handleManualSave} disabled={saving || !childId || !manualStart}
                className="w-full rounded-2xl h-12 font-bold"
                style={{ backgroundColor: sage, color: 'white' }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════
              BOTTLE / FORMULA PHASE
          ══════════════════════════════════════════════ */}
          {phase === 'bottle' && (
            <motion.div
              key="bottle"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="px-1 pt-2 space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-lg font-bold" style={{ color: brown, fontFamily: 'Quicksand, sans-serif' }}>
                  {bottleMethod === 'bottle' ? '🍼 Mamadeira' : '🥛 Fórmula'}
                </p>
                <button
                  onClick={() => setPhase('suggest')}
                  className="text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: 'hsl(var(--muted))', color: brown }}
                >
                  ← Voltar
                </button>
              </div>

              <ChildSelect value={childId} onChange={setChildId} />

              <div className="grid grid-cols-2 gap-2">
                {([
                  { v: 'bottle' as const, l: '🍼 Mamadeira' },
                  { v: 'formula' as const, l: '🥛 Fórmula' },
                ]).map(opt => (
                  <button key={opt.v} onClick={() => setBottleMethod(opt.v)}
                    className="py-3 rounded-2xl text-sm font-bold transition-all active:scale-95"
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

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ color: brown }}>Quantidade (ml)</Label>
                <Input type="number" value={bottleAmount} onChange={e => setBottleAmount(e.target.value)}
                  placeholder="120" min="0" className="h-11 rounded-2xl border-border" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ color: brown }}>Observações (opcional)</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="..." className="rounded-2xl border-border resize-none" rows={2} />
              </div>

              <Button onClick={handleBottleSave} disabled={saving || !childId}
                className="w-full rounded-2xl h-12 font-bold"
                style={{ backgroundColor: sage, color: 'white' }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}
