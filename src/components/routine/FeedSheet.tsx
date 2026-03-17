/**
 * FeedSheet v4 — Breastfeeding session as a first-class product experience.
 *
 * Session state machine:
 *   suggest → session (ACTIVE | PAUSED) → finished (UNSAVED) → saved
 *
 * Timer invariants:
 *   - Single source of truth: accumulated ms in `accumulatedMs` ref
 *   - Interval only runs while ACTIVE; on every tick writes to ref and forces re-render
 *   - Reading time: accumulatedMs.current (no Date.now() in render path)
 *   - switchCount ONLY incremented in handleSwitch
 *
 * Data model:
 *   notes = __payload:{ session_type, left_seconds, right_seconds, total_seconds,
 *                       switches, last_side, tags?, _notes?, include_in_report? }
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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

const SESSION_KEY = 'ninho_feed_session_v4';

const QUICK_TAGS = [
  { id: 'mamou_bem', label: '😊 Mamou bem' },
  { id: 'inquieto', label: '😟 Inquieto' },
  { id: 'dormiu', label: '😴 Dormiu durante' },
  { id: 'desconforto', label: '😣 Desconforto' },
  { id: 'pega_boa', label: '👍 Pega boa' },
  { id: 'rejeitou_lado', label: '↩️ Rejeitou lado' },
];

const EDU_TIPS = [
  'Recém-nascidos costumam mamar de 8 a 12 vezes por dia.',
  'Bebês amamentados pedem o seio com frequência — isso é normal.',
  'Alternar os lados ajuda a manter a produção equilibrada.',
];

// ─── Types ─────────────────────────────────────────────────────────────────

type Side = 'L' | 'R';
/** ACTIVE = running, PAUSED = stopped but not done, FINISHED = completed awaiting save */
type SessionStatus = 'ACTIVE' | 'PAUSED' | 'FINISHED';
type FeedPhase = 'suggest' | 'session' | 'summary' | 'manual' | 'bottle';

interface SideTimes {
  L: number; // accumulated ms on left
  R: number; // accumulated ms on right
}

interface PersistedSession {
  childId: string;
  sessionStartEpoch: number;
  sideTimes: SideTimes;
  activeSide: Side;
  switchCount: number;
  status: SessionStatus;
  /** epoch when current segment started (only valid when ACTIVE) */
  segmentStartEpoch: number | null;
}

interface FinishedData {
  totalSec: number;
  leftSec: number;
  rightSec: number;
  switches: number;
  start: Date;
  end: Date;
  lastSide: Side;
}

// ─── Persistence helpers ───────────────────────────────────────────────────

function saveSession(data: PersistedSession) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch { /* noop */ }
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  // clean old key too
  localStorage.removeItem('ninho_feed_session');
}
function loadSession(): PersistedSession | null {
  try { const r = localStorage.getItem(SESSION_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}

// ─── Insight engine ────────────────────────────────────────────────────────

function computeInsights(
  totalSec: number,
  sw: number,
  lastFeedTime: string | null,
  recent: { start_time: string; notes: string | null }[],
): string[] {
  const insights: string[] = [];
  const today = new Date().toDateString();
  const todaySessions = recent.filter(s => new Date(s.start_time).toDateString() === today);

  // Longest session today (compare against today's completed sessions)
  const todayTotals = todaySessions
    .map(s => Number(parsePayload(s.notes).total_seconds ?? 0))
    .filter(t => t > 0);
  if (todayTotals.length >= 1 && totalSec > Math.max(...todayTotals)) {
    insights.push('✨ Sessão mais longa do dia');
  }

  // Short interval vs historical average (needs ≥4 sessions for reliability)
  if (lastFeedTime && recent.length >= 4) {
    const times = recent.slice(0, 7).map(s => new Date(s.start_time).getTime());
    const diffs = times.slice(0, -1).map((t, i) => Math.abs(t - times[i + 1]) / 60000);
    const avgMin = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const currentMin = (Date.now() - new Date(lastFeedTime).getTime()) / 60000;
    if (avgMin > 0 && currentMin < avgMin * 0.65 && currentMin < 90) {
      insights.push('⏱ Intervalo menor que o usual');
    }
  }

  // More switches than recent average (needs ≥2 other sessions today)
  if (todaySessions.length >= 2) {
    const swCounts = todaySessions.map(s => Number(parsePayload(s.notes).switches ?? 0));
    const avg = swCounts.reduce((a, b) => a + b, 0) / swCounts.length;
    if (avg > 0 && sw > avg * 1.5 && sw >= 3) {
      insights.push('🔄 Mais trocas que o habitual');
    }
  }

  return insights.slice(0, 1);
}

// ─── SideCard ──────────────────────────────────────────────────────────────

function SideCard({
  side, active, totalMs, sessionStatus, onClick,
}: {
  side: Side;
  active: boolean;
  totalMs?: number;       // accumulated ms for this side (for display during session)
  sessionStatus?: SessionStatus;
  onClick?: () => void;
}) {
  const label = side === 'L' ? 'Esquerdo' : 'Direito';
  const arrow = side === 'L' ? '←' : '→';
  const isRunning = active && sessionStatus === 'ACTIVE';

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
          color: active ? 'hsl(var(--ninho-sage))' : 'hsl(var(--muted-foreground))',
        }}
      >
        {arrow}
      </div>

      <p
        className="text-[11px] mt-2 font-bold uppercase tracking-wide"
        style={{
          color: active ? 'hsl(var(--ninho-sage))' : 'hsl(var(--muted-foreground))',
          fontFamily: 'Nunito, sans-serif',
        }}
      >
        {label}
      </p>

      {totalMs !== undefined && (
        <p
          className="text-2xl font-bold tabular-nums mt-1"
          style={{
            color: active ? 'hsl(var(--ninho-sage))' : 'hsl(var(--muted-foreground))',
            fontFamily: 'Quicksand, sans-serif',
          }}
        >
          {fmtTimer(Math.floor(totalMs / 1000))}
        </p>
      )}

      {isRunning && (
        <div className="flex items-center justify-center gap-1 mt-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'hsl(var(--ninho-sage))' }} />
          <span className="text-[10px] font-semibold" style={{ color: 'hsl(var(--ninho-sage))', fontFamily: 'Nunito, sans-serif' }}>
            ativo
          </span>
        </div>
      )}

      {/* Radio-button style for suggest phase */}
      {onClick && (
        <div className="mt-2">
          {active ? (
            <div className="w-5 h-5 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--ninho-sage))' }}>
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border-2 mx-auto" style={{ borderColor: 'hsl(var(--border))' }} />
          )}
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

// ─── UnsavedDialog — shown when user tries to close during FINISHED state ──

function UnsavedDialog({
  onSave, onDiscard, onContinue,
}: { onSave: () => void; onDiscard: () => void; onContinue: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onContinue}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        className="w-full max-w-md rounded-t-3xl p-6 space-y-3"
        style={{ backgroundColor: 'hsl(var(--card))' }}
        onClick={e => e.stopPropagation()}
      >
        <p className="text-base font-bold text-center" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
          Sessão não salva
        </p>
        <p className="text-sm text-center" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
          Deseja salvar esta sessão antes de sair?
        </p>
        <div className="space-y-2 pt-2">
          <button
            onClick={onSave}
            className="w-full py-3.5 rounded-2xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, hsl(var(--ninho-sage)), hsl(var(--ninho-mauve)))', color: 'white', fontFamily: 'Nunito, sans-serif' }}
          >
            Salvar
          </button>
          <button
            onClick={onContinue}
            className="w-full py-3.5 rounded-2xl text-sm font-bold"
            style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
          >
            Continuar editando
          </button>
          <button
            onClick={onDiscard}
            className="w-full py-2 text-xs font-semibold"
            style={{ color: 'hsl(var(--destructive))', fontFamily: 'Nunito, sans-serif' }}
          >
            Descartar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main FeedSheet ────────────────────────────────────────────────────────

interface FeedSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function FeedSheet({ open, onClose, onSaved }: FeedSheetProps) {
  const { user } = useAuth();
  const { activeChildId, activeChild } = useActiveChild();
  const [childId, setChildId] = useState(activeChildId ?? '');

  // ── Phase & session status ─────────────────────────────────────
  const [phase, setPhase] = useState<FeedPhase>('suggest');
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('ACTIVE');

  // ── Suggest state ──────────────────────────────────────────────
  const [selectedSide, setSelectedSide] = useState<Side>('L');
  const [suggestedSide, setSuggestedSide] = useState<Side>('L');
  const [lastFeedTime, setLastFeedTime] = useState<string | null>(null);
  const [recentSessions, setRecentSessions] = useState<RoutineLog[]>([]);

  // ── Session state ──────────────────────────────────────────────
  const [sessionStartEpoch, setSessionStartEpoch] = useState<number>(0);
  const [activeSide, setActiveSide] = useState<Side>('L');
  const [switchCount, setSwitchCount] = useState(0);

  /**
   * TIMER — single source of truth.
   * sideTimes = accumulated ms per side (only for completed segments).
   * segmentStartEpoch = epoch when the current running segment started (null = paused/finished).
   * displayMs = sideTimes + (now - segmentStartEpoch) when ACTIVE.
   */
  const sideTimesRef = useRef<SideTimes>({ L: 0, R: 0 });
  const segmentStartRef = useRef<number | null>(null);
  const activeSideRef = useRef<Side>('L');
  const [, forceRender] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Summary / unsaved dialog state ────────────────────────────
  const [finishedData, setFinishedData] = useState<FinishedData | null>(null);
  const [sessionInsights, setSessionInsights] = useState<string[]>([]);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // ── Observations ───────────────────────────────────────────────
  const [obsOpen, setObsOpen] = useState(false);
  const [obsTags, setObsTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tipIndex] = useState(() => Math.floor(Math.random() * EDU_TIPS.length));

  // ── Bottle / manual state ──────────────────────────────────────
  const [bottleMethod, setBottleMethod] = useState<'bottle' | 'formula'>('bottle');
  const [bottleAmount, setBottleAmount] = useState('');
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');
  const [manualSide, setManualSide] = useState<'L' | 'R' | 'both'>('L');

  // ─── Derived display values ─────────────────────────────────────

  function getCurrentDisplayMs(): { L: number; R: number; total: number } {
    const nowMs = segmentStartRef.current !== null && sessionStatus === 'ACTIVE'
      ? Date.now() - segmentStartRef.current
      : 0;
    const L = sideTimesRef.current.L + (activeSideRef.current === 'L' ? nowMs : 0);
    const R = sideTimesRef.current.R + (activeSideRef.current === 'R' ? nowMs : 0);
    return { L, R, total: L + R };
  }

  // ─── Timer control ─────────────────────────────────────────────

  function startInterval() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => forceRender(n => n + 1), 500);
  }
  function stopInterval() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }

  useEffect(() => {
    if (phase === 'session' && sessionStatus === 'ACTIVE') {
      startInterval();
    } else {
      stopInterval();
    }
    return stopInterval;
  }, [phase, sessionStatus]);

  // ─── Persistence ───────────────────────────────────────────────

  const persistSession = useCallback(() => {
    if (phase !== 'session') return;
    saveSession({
      childId,
      sessionStartEpoch,
      sideTimes: sideTimesRef.current,
      activeSide: activeSideRef.current,
      switchCount,
      status: sessionStatus,
      segmentStartEpoch: segmentStartRef.current,
    });
  }, [phase, childId, sessionStartEpoch, switchCount, sessionStatus]);

  useEffect(() => { persistSession(); }, [persistSession]);

  // ─── Load suggestion + history ─────────────────────────────────

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

  // ─── On sheet open ──────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    const cid = activeChildId ?? '';
    setChildId(cid);
    resetObsState();
    setShowUnsavedDialog(false);

    const persisted = loadSession();
    if (persisted && persisted.childId === cid) {
      // Restore session — recalc accumulated time for any gap if ACTIVE
      sideTimesRef.current = persisted.sideTimes ?? { L: 0, R: 0 };
      activeSideRef.current = persisted.activeSide ?? 'L';
      setActiveSide(persisted.activeSide ?? 'L');
      setSwitchCount(persisted.switchCount ?? 0);
      setSessionStartEpoch(persisted.sessionStartEpoch);

      if (persisted.status === 'FINISHED') {
        // Don't auto-resume a finished session — go straight to summary
        stopInterval();
        segmentStartRef.current = null;
        setSessionStatus('FINISHED');
        setPhase('session'); // will show "session finished" state
      } else if (persisted.status === 'ACTIVE' && persisted.segmentStartEpoch) {
        // Was running when app closed — add elapsed gap to accumulated
        const gap = Date.now() - persisted.segmentStartEpoch;
        sideTimesRef.current = {
          ...sideTimesRef.current,
          [activeSideRef.current]: (sideTimesRef.current[activeSideRef.current] ?? 0) + gap,
        };
        // Resume as paused (safer — user can tap continue)
        segmentStartRef.current = null;
        setSessionStatus('PAUSED');
        setPhase('session');
      } else {
        // PAUSED
        segmentStartRef.current = null;
        setSessionStatus('PAUSED');
        setPhase('session');
      }
    } else {
      resetSessionState();
      setPhase('suggest');
      loadSuggestion(cid);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeChildId]);

  // ─── Helpers ───────────────────────────────────────────────────

  function resetSessionState() {
    sideTimesRef.current = { L: 0, R: 0 };
    segmentStartRef.current = null;
    activeSideRef.current = 'L';
    setActiveSide('L');
    setSwitchCount(0);
    setSessionStatus('ACTIVE');
    setSessionStartEpoch(0);
    stopInterval();
  }

  function resetObsState() {
    setObsOpen(false);
    setObsTags([]);
    setNotes('');
    setIncludeInReport(false);
    setFinishedData(null);
    setSessionInsights([]);
    setSaving(false);
    setBottleAmount('');
    setBottleMethod('bottle');
  }

  function toggleTag(id: string) {
    setObsTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }

  // ─── Session actions ────────────────────────────────────────────

  function handleStart() {
    const n = Date.now();
    sideTimesRef.current = { L: 0, R: 0 };
    activeSideRef.current = selectedSide;
    segmentStartRef.current = n;
    setActiveSide(selectedSide);
    setSwitchCount(0);
    setSessionStatus('ACTIVE');
    setSessionStartEpoch(n);
    setPhase('session');
  }

  /** ✅ ONLY here switchCount increments */
  function handleSwitch() {
    const n = Date.now();
    const newSide: Side = activeSideRef.current === 'L' ? 'R' : 'L';

    // Flush current segment into accumulated ms
    if (segmentStartRef.current !== null) {
      const elapsed = n - segmentStartRef.current;
      sideTimesRef.current = {
        ...sideTimesRef.current,
        [activeSideRef.current]: sideTimesRef.current[activeSideRef.current] + elapsed,
      };
    }

    // Start new segment on other side
    segmentStartRef.current = n;
    activeSideRef.current = newSide;
    setActiveSide(newSide);
    setSwitchCount(c => c + 1); // ← ONLY here
    setSessionStatus('ACTIVE'); // switch always resumes
    forceRender(n => n + 1);
  }

  /** Pause — flush current segment, mark no running segment */
  function handlePause() {
    const n = Date.now();
    if (segmentStartRef.current !== null) {
      const elapsed = n - segmentStartRef.current;
      sideTimesRef.current = {
        ...sideTimesRef.current,
        [activeSideRef.current]: sideTimesRef.current[activeSideRef.current] + elapsed,
      };
      segmentStartRef.current = null;
    }
    setSessionStatus('PAUSED');
    // switchCount unchanged ✅
  }

  /** Resume — restart segment on same side */
  function handleResume() {
    segmentStartRef.current = Date.now();
    setSessionStatus('ACTIVE');
    // switchCount unchanged ✅
  }

  /** Finish — freeze all values, go to summary */
  function handleFinish() {
    const n = Date.now();

    // Flush any running segment
    if (segmentStartRef.current !== null) {
      const elapsed = n - segmentStartRef.current;
      sideTimesRef.current = {
        ...sideTimesRef.current,
        [activeSideRef.current]: sideTimesRef.current[activeSideRef.current] + elapsed,
      };
      segmentStartRef.current = null;
    }
    stopInterval();

    const tMs = sideTimesRef.current.L + sideTimesRef.current.R;
    const tSec = Math.floor(tMs / 1000);

    const insights = computeInsights(tSec, switchCount, lastFeedTime, recentSessions);

    setFinishedData({
      totalSec: tSec,
      leftSec: Math.floor(sideTimesRef.current.L / 1000),
      rightSec: Math.floor(sideTimesRef.current.R / 1000),
      switches: switchCount,
      start: new Date(sessionStartEpoch),
      end: new Date(n),
      lastSide: activeSideRef.current,
    });
    setSessionInsights(insights);
    setSessionStatus('FINISHED');
    setPhase('summary');
  }

  // ─── Save actions ───────────────────────────────────────────────

  async function handleSave() {
    if (!user || !childId || !finishedData) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        session_type: 'breastfeed',
        left_seconds: finishedData.leftSec,
        right_seconds: finishedData.rightSec,
        total_seconds: finishedData.totalSec,
        switches: finishedData.switches,
        last_side: finishedData.lastSide,
        ...(obsTags.length > 0 && { tags: obsTags.join(',') }),
        ...(includeInReport && { include_in_report: true }),
      };

      const { error } = await supabase.from('routine_logs').insert({
        child_id: childId,
        author_id: user.id,
        type: 'feed',
        start_time: finishedData.start.toISOString(),
        end_time: finishedData.end.toISOString(),
        notes: makePayloadNotes(payload, notes),
      });
      if (error) throw error;
      clearSession();
      toast({ title: 'Sessão salva! 🤱' });
      onSaved();
      doClose(true);
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
      doClose(true);
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
      doClose(true);
    } catch (e: unknown) {
      toast({ title: 'Erro ao salvar', description: e instanceof Error ? e.message : 'Tente novamente', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  // ─── Close logic ────────────────────────────────────────────────

  function handleSheetDismiss() {
    if (phase === 'summary' && sessionStatus === 'FINISHED') {
      // Show unsaved dialog instead of closing
      setShowUnsavedDialog(true);
      return;
    }
    if (phase === 'session' && (sessionStatus === 'ACTIVE' || sessionStatus === 'PAUSED')) {
      // Session is running/paused — just close, session is persisted
      onClose();
      return;
    }
    doClose(false);
  }

  function doClose(fullReset: boolean) {
    setShowUnsavedDialog(false);
    onClose();
    if (fullReset) {
      resetSessionState();
      resetObsState();
      setPhase('suggest');
      clearSession();
    }
  }

  function handleDiscard() {
    clearSession();
    resetSessionState();
    resetObsState();
    setPhase('suggest');
    setShowUnsavedDialog(false);
    onClose();
    loadSuggestion(childId);
  }

  // ─── Render ─────────────────────────────────────────────────────

  const display = getCurrentDisplayMs();
  const isFullHeight = phase === 'session' || phase === 'summary';

  return (
    <>
      <Sheet open={open} onOpenChange={v => { if (!v) handleSheetDismiss(); }}>
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
                <div className="mb-5">
                  <p className="text-xl font-bold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
                    🤱 Amamentar
                  </p>
                  {activeChild && (
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                      {activeChild.name}
                    </p>
                  )}
                </div>

                <ChildSelect value={childId} onChange={setChildId} />

                {lastFeedTime && (
                  <div
                    className="rounded-2xl px-4 py-3 mb-5 flex items-center gap-3"
                    style={{ backgroundColor: 'hsl(var(--ninho-sage) / 0.08)' }}
                  >
                    <span className="text-xl">⏰</span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
                        Última mamada há {fmtTimeSince(lastFeedTime)}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                        Bebês costumam mamar a cada 2–3h
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs font-bold uppercase tracking-wider mb-3"
                  style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                  Começar pelo lado
                </p>

                <div className="flex gap-3 mb-2">
                  <SideCard side="L" active={selectedSide === 'L'} onClick={() => setSelectedSide('L')} />
                  <SideCard side="R" active={selectedSide === 'R'} onClick={() => setSelectedSide('R')} />
                </div>

                {selectedSide === suggestedSide && lastFeedTime ? (
                  <p className="text-[11px] text-center mb-5" style={{ color: 'hsl(var(--ninho-sage))', fontFamily: 'Nunito, sans-serif' }}>
                    ✓ Sugerido com base na última sessão
                  </p>
                ) : <div className="mb-5" />}

                <Button
                  onClick={handleStart}
                  disabled={!childId}
                  className="w-full rounded-2xl h-14 text-base font-bold shadow-md"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--ninho-sage)), hsl(var(--ninho-mauve)))', color: 'white' }}
                >
                  ▶ Iniciar amamentação
                </Button>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => setPhase('manual')}
                    className="py-3 rounded-2xl text-sm font-bold text-center transition-all active:scale-95"
                    style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
                  >
                    📝 Registrar manualmente
                  </button>
                  <button
                    onClick={() => setPhase('bottle')}
                    className="py-3 rounded-2xl text-sm font-bold text-center transition-all active:scale-95"
                    style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
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
                    {sessionStatus === 'ACTIVE' && (
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'hsl(var(--ninho-sage))' }} />
                    )}
                    <p className="text-xs font-bold" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                      {sessionStatus === 'ACTIVE' ? 'Sessão ativa' : sessionStatus === 'PAUSED' ? '⏸ Pausado' : '✓ Finalizado'}
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

                {/* Side cards */}
                <div className="flex gap-3 px-1">
                  <SideCard side="L" active={activeSide === 'L'} totalMs={display.L} sessionStatus={sessionStatus} />
                  <SideCard side="R" active={activeSide === 'R'} totalMs={display.R} sessionStatus={sessionStatus} />
                </div>

                {/* Central total timer */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <p
                    className="text-7xl font-bold tabular-nums"
                    style={{
                      color: sessionStatus === 'ACTIVE' ? 'hsl(var(--ninho-sage))' : 'hsl(var(--muted-foreground))',
                      fontFamily: 'Quicksand, sans-serif',
                    }}
                  >
                    {fmtTimer(Math.floor(display.total / 1000))}
                  </p>
                  <p className="text-xs mt-2 font-semibold" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                    duração total
                  </p>
                  {switchCount > 0 && (
                    <p
                      className="text-[11px] mt-2 px-3 py-1 rounded-full"
                      style={{ color: 'hsl(var(--ninho-mauve))', backgroundColor: 'hsl(var(--ninho-mauve) / 0.1)', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}
                    >
                      {switchCount} troca{switchCount > 1 ? 's' : ''} de lado
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="px-1 pb-4 space-y-3">
                  {sessionStatus !== 'FINISHED' && (
                    <>
                      <div className="flex gap-3">
                        <button
                          onClick={sessionStatus === 'PAUSED' ? handleResume : handlePause}
                          className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
                          style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
                        >
                          {sessionStatus === 'PAUSED' ? '▶ Continuar' : '⏸ Pausar'}
                        </button>
                        <button
                          onClick={handleFinish}
                          className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
                          style={{ backgroundColor: 'hsl(var(--ninho-mauve) / 0.12)', color: 'hsl(var(--ninho-mauve))', fontFamily: 'Nunito, sans-serif' }}
                        >
                          ✓ Finalizar
                        </button>
                      </div>

                      <button
                        onClick={handleSwitch}
                        className="w-full py-5 rounded-2xl text-base font-bold transition-all active:scale-[0.97] shadow-md"
                        style={{ background: 'linear-gradient(135deg, hsl(var(--ninho-sage)), hsl(var(--ninho-mauve)))', color: 'white', fontFamily: 'Nunito, sans-serif' }}
                      >
                        ⟷ Trocar para lado {activeSide === 'L' ? 'direito →' : '← esquerdo'}
                      </button>
                    </>
                  )}

                  {sessionStatus === 'FINISHED' && (
                    <Button
                      onClick={() => setPhase('summary')}
                      className="w-full rounded-2xl h-14 text-base font-bold"
                      style={{ background: 'linear-gradient(135deg, hsl(var(--ninho-sage)), hsl(var(--ninho-mauve)))', color: 'white' }}
                    >
                      Ver resumo →
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════
                SUMMARY PHASE
            ══════════════════════════════════════════════ */}
            {phase === 'summary' && finishedData && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="flex-1 flex flex-col px-1 pt-2 overflow-y-auto"
              >
                <p className="text-xl font-bold text-center mb-1" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
                  Resumo
                </p>
                <p className="text-xs text-center mb-5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                  {finishedData.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} –{' '}
                  {finishedData.end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>

                {/* Total */}
                <div className="text-center mb-5">
                  <p className="text-5xl font-bold tabular-nums" style={{ color: 'hsl(var(--ninho-sage))', fontFamily: 'Quicksand, sans-serif' }}>
                    {fmtDurationShort(finishedData.totalSec)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>duração total</p>
                </div>

                {/* E / Trocas / D */}
                <div className="flex gap-2 mb-3">
                  {[
                    { label: 'Esquerdo', value: fmtDurationShort(finishedData.leftSec), color: 'hsl(var(--ninho-sage))', bg: 'hsl(var(--ninho-sage) / 0.08)' },
                    { label: 'Trocas', value: String(finishedData.switches), color: 'hsl(var(--ninho-brown))', bg: 'hsl(var(--muted))' },
                    { label: 'Direito', value: fmtDurationShort(finishedData.rightSec), color: 'hsl(var(--ninho-mauve))', bg: 'hsl(var(--ninho-mauve) / 0.08)' },
                  ].map(s => (
                    <div key={s.label} className="flex-1 rounded-2xl p-3.5 text-center" style={{ backgroundColor: s.bg }}>
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: s.color }}>{s.label}</p>
                      <p className="text-xl font-bold mt-1" style={{ color: s.color, fontFamily: 'Quicksand, sans-serif' }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* E/D split bar */}
                {finishedData.totalSec > 0 && (
                  <div className="h-2.5 rounded-full overflow-hidden flex mb-4" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                    <div
                      className="h-full"
                      style={{ width: `${(finishedData.leftSec / finishedData.totalSec) * 100}%`, background: 'linear-gradient(90deg, hsl(var(--ninho-sage)), hsl(var(--ninho-sage) / 0.7))', borderRadius: '9999px 0 0 9999px' }}
                    />
                    {finishedData.rightSec > 0 && (
                      <div
                        className="h-full"
                        style={{ width: `${(finishedData.rightSec / finishedData.totalSec) * 100}%`, background: 'linear-gradient(90deg, hsl(var(--ninho-mauve) / 0.7), hsl(var(--ninho-mauve)))', borderRadius: '0 9999px 9999px 0' }}
                      />
                    )}
                  </div>
                )}

                {/* Contextual insight */}
                {sessionInsights.length > 0 && (
                  <div
                    className="rounded-2xl px-4 py-3 mb-3 flex items-center gap-2"
                    style={{ backgroundColor: 'hsl(var(--ninho-sage) / 0.07)', border: '1px solid hsl(var(--ninho-sage) / 0.2)' }}
                  >
                    <p className="text-sm font-semibold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}>
                      {sessionInsights[0]}
                    </p>
                  </div>
                )}

                {/* Educational tip (subtle, occasional) */}
                {recentSessions.length <= 5 && (
                  <p className="text-[11px] text-center mb-3" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                    💡 {EDU_TIPS[tipIndex]}
                  </p>
                )}

                <div className="flex-1" />

                {/* Observations */}
                <AnimatePresence>
                  {!obsOpen ? (
                    <motion.button
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setObsOpen(true)}
                      className="w-full py-3 rounded-2xl text-sm font-bold text-center mb-3 transition-all active:scale-95"
                      style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}
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
                        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>Como foi?</p>
                        <button onClick={() => { setObsOpen(false); setObsTags([]); setNotes(''); }} className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Cancelar</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {QUICK_TAGS.map(tag => (
                          <button
                            key={tag.id}
                            onClick={() => toggleTag(tag.id)}
                            className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all active:scale-95"
                            style={{
                              backgroundColor: obsTags.includes(tag.id) ? 'hsl(var(--ninho-sage))' : 'hsl(var(--muted))',
                              color: obsTags.includes(tag.id) ? 'white' : 'hsl(var(--ninho-brown))',
                              fontFamily: 'Nunito, sans-serif',
                            }}
                          >
                            {tag.label}
                          </button>
                        ))}
                      </div>
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

                {/* Include in medical report toggle */}
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-2xl mb-3"
                  style={{ backgroundColor: 'hsl(var(--muted))' }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}>
                      Adicionar ao relatório médico
                    </p>
                    <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                      Marca esta sessão para inclusão futura
                    </p>
                  </div>
                  <Switch
                    checked={includeInReport}
                    onCheckedChange={setIncludeInReport}
                  />
                </div>

                {/* Save */}
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full rounded-2xl h-14 text-base font-bold shadow-md mb-2"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--ninho-sage)), hsl(var(--ninho-mauve)))', color: 'white' }}
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
                  <p className="text-lg font-bold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
                    📝 Registro manual
                  </p>
                  <button onClick={() => setPhase('suggest')} className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--ninho-brown))' }}>← Voltar</button>
                </div>
                <ChildSelect value={childId} onChange={setChildId} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Início</Label>
                    <Input type="datetime-local" value={manualStart} onChange={e => setManualStart(e.target.value)} className="h-11 rounded-2xl border-border text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Fim (opcional)</Label>
                    <Input type="datetime-local" value={manualEnd} onChange={e => setManualEnd(e.target.value)} className="h-11 rounded-2xl border-border text-xs" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Lado</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([{ v: 'L' as const, l: '← Esquerdo' }, { v: 'R' as const, l: 'Direito →' }, { v: 'both' as const, l: '↔ Ambos' }]).map(opt => (
                      <button key={opt.v} onClick={() => setManualSide(opt.v)}
                        className="py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95"
                        style={{ backgroundColor: manualSide === opt.v ? 'hsl(var(--ninho-sage))' : 'hsl(var(--muted))', color: manualSide === opt.v ? 'white' : 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Observações (opcional)</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Mamou bem..." className="rounded-2xl border-border resize-none" rows={2} />
                </div>
                <Button onClick={handleManualSave} disabled={saving || !childId || !manualStart}
                  className="w-full rounded-2xl h-12 font-bold"
                  style={{ backgroundColor: 'hsl(var(--ninho-sage))', color: 'white' }}>
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
                  <p className="text-lg font-bold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
                    {bottleMethod === 'bottle' ? '🍼 Mamadeira' : '🥛 Fórmula'}
                  </p>
                  <button onClick={() => setPhase('suggest')} className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--ninho-brown))' }}>← Voltar</button>
                </div>
                <ChildSelect value={childId} onChange={setChildId} />
                <div className="grid grid-cols-2 gap-2">
                  {([{ v: 'bottle' as const, l: '🍼 Mamadeira' }, { v: 'formula' as const, l: '🥛 Fórmula' }]).map(opt => (
                    <button key={opt.v} onClick={() => setBottleMethod(opt.v)}
                      className="py-3 rounded-2xl text-sm font-bold transition-all active:scale-95"
                      style={{ backgroundColor: bottleMethod === opt.v ? 'hsl(var(--ninho-sage))' : 'hsl(var(--muted))', color: bottleMethod === opt.v ? 'white' : 'hsl(var(--ninho-brown))', fontFamily: 'Nunito, sans-serif' }}>
                      {opt.l}
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Quantidade (ml)</Label>
                  <Input type="number" value={bottleAmount} onChange={e => setBottleAmount(e.target.value)} placeholder="120" min="0" className="h-11 rounded-2xl border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold" style={{ color: 'hsl(var(--ninho-brown))' }}>Observações (opcional)</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="..." className="rounded-2xl border-border resize-none" rows={2} />
                </div>
                <Button onClick={handleBottleSave} disabled={saving || !childId}
                  className="w-full rounded-2xl h-12 font-bold"
                  style={{ backgroundColor: 'hsl(var(--ninho-sage))', color: 'white' }}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </SheetContent>
      </Sheet>

      {/* Unsaved dialog — portal-level, outside Sheet */}
      {showUnsavedDialog && (
        <UnsavedDialog
          onSave={handleSave}
          onDiscard={handleDiscard}
          onContinue={() => setShowUnsavedDialog(false)}
        />
      )}
    </>
  );
}
