/**
 * FeedSheet v7 — contrato novo de rotina
 *
 * Banco:
 * - routine_logs.notes = texto humano
 * - routine_logs.payload = json estruturado
 *
 * Front:
 * - leitura via toRoutineRecord(...)
 * - escrita via serializeRoutinePayload(...)
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
import { fmtTimer, fmtDurationShort, fmtTimeSince } from '@/lib/routineUtils';
import { toRoutineRecord, serializeRoutinePayload } from '@/lib/adapters/routineAdapters';
import type { RoutineRecord } from '@/lib/contracts/routine';

// ─── Constants ─────────────────────────────────────────────────────────────

const SESSION_KEY = 'ninho_feed_session_v7';

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
type SessionStatus = 'ACTIVE' | 'PAUSED' | 'FINISHED';
type FeedPhase = 'suggest' | 'session' | 'summary' | 'manual' | 'bottle';

interface SideTimes {
  L: number;
  R: number;
}

interface PersistedSession {
  childId: string;
  sessionStartEpoch: number;
  sideTimes: SideTimes;
  activeSide: Side;
  switchCount: number;
  status: SessionStatus;
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

type FeedRoutineRecord = RoutineRecord<'feed'>;

// ─── Persistence ───────────────────────────────────────────────────────────

function saveSession(data: PersistedSession) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    // noop
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('ninho_feed_session_v6');
  localStorage.removeItem('ninho_feed_session_v4');
  localStorage.removeItem('ninho_feed_session');
}

function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as PersistedSession) : null;
  } catch {
    return null;
  }
}

// ─── Insight engine ────────────────────────────────────────────────────────

function getFeedTotalSeconds(log: FeedRoutineRecord): number {
  if (typeof log.payload.totalSeconds === 'number' && Number.isFinite(log.payload.totalSeconds)) {
    return log.payload.totalSeconds;
  }

  if (log.endTime) {
    const diff = Math.floor(
      (new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 1000
    );
    return diff > 0 ? diff : 0;
  }

  return 0;
}

function getFeedSwitches(log: FeedRoutineRecord): number {
  return typeof log.payload.switches === 'number' && Number.isFinite(log.payload.switches)
    ? log.payload.switches
    : 0;
}

function computeInsight(
  totalSec: number,
  switches: number,
  lastFeedTime: string | null,
  recent: FeedRoutineRecord[]
): string | null {
  const today = new Date().toDateString();
  const todaySessions = recent.filter(
    session => new Date(session.startTime).toDateString() === today
  );

  const todayTotals = todaySessions
    .map(getFeedTotalSeconds)
    .filter(seconds => seconds > 0);

  if (todayTotals.length >= 1 && totalSec > Math.max(...todayTotals)) {
    return '✨ Sessão mais longa do dia';
  }

  if (lastFeedTime && recent.length >= 4) {
    const times = recent.slice(0, 7).map(session => new Date(session.startTime).getTime());
    const diffs = times.slice(0, -1).map((time, index) => Math.abs(time - times[index + 1]) / 60000);
    const avgMin = diffs.reduce((acc, value) => acc + value, 0) / diffs.length;
    const currentMin = (Date.now() - new Date(lastFeedTime).getTime()) / 60000;

    if (avgMin > 0 && currentMin < avgMin * 0.65 && currentMin < 90) {
      return '⏱ Intervalo menor que o usual';
    }
  }

  if (todaySessions.length >= 2) {
    const switchCounts = todaySessions.map(getFeedSwitches);
    const avg = switchCounts.reduce((acc, value) => acc + value, 0) / switchCounts.length;

    if (avg > 0 && switches > avg * 1.5 && switches >= 3) {
      return '🔄 Mais trocas que o habitual';
    }
  }

  return null;
}

// ─── ChildHeader ───────────────────────────────────────────────────────────

function ChildHeader() {
  const { activeChild, getAgeLabel } = useActiveChild();

  if (!activeChild) return null;

  const initials = activeChild.name.charAt(0).toUpperCase();
  const age = getAgeLabel(activeChild.birth_date);

  return (
    <div className="flex items-center gap-3 mb-5">
      {activeChild.avatar_url ? (
        <img
          src={activeChild.avatar_url}
          alt={activeChild.name}
          className="w-11 h-11 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-base font-bold"
          style={{
            background:
              'linear-gradient(135deg, hsl(var(--ninho-sage)), hsl(var(--ninho-mauve)))',
            color: 'white',
            fontFamily: 'Quicksand, sans-serif',
          }}
        >
          {initials}
        </div>
      )}

      <div>
        <p
          className="text-base font-bold leading-tight"
          style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}
        >
          {activeChild.name}
        </p>
        <p
          className="text-xs"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
        >
          {age}
        </p>
      </div>
    </div>
  );
}

// ─── SideCard ──────────────────────────────────────────────────────────────

function SideCard({
  side,
  active,
  totalMs,
  sessionStatus,
  onClick,
}: {
  side: Side;
  active: boolean;
  totalMs?: number;
  sessionStatus?: SessionStatus;
  onClick?: () => void;
}) {
  const label = side === 'L' ? 'Esquerdo' : 'Direito';
  const arrow = side === 'L' ? '←' : '→';

  const statusLabel =
    !sessionStatus
      ? '\u00A0'
      : active && sessionStatus === 'ACTIVE'
      ? 'ativo'
      : active && sessionStatus === 'PAUSED'
      ? 'pausado'
      : '\u00A0';

  const showPulse = active && sessionStatus === 'ACTIVE';

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="flex-1 rounded-3xl p-4 text-center transition-all duration-200"
      style={{
        backgroundColor: active ? 'hsl(var(--ninho-sage) / 0.1)' : 'hsl(var(--muted))',
        border: active
          ? '2px solid hsl(var(--ninho-sage) / 0.4)'
          : '2px solid transparent',
        opacity: active ? 1 : 0.4,
        transform: active ? 'scale(1.02)' : 'scale(1)',
        boxShadow: active ? '0 4px 20px -6px hsl(var(--ninho-sage) / 0.3)' : 'none',
      }}
    >
      <div
        className="w-10 h-10 rounded-full mx-auto flex items-center justify-center text-base font-bold"
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

      <div className="h-9 flex items-center justify-center mt-1">
        {totalMs !== undefined ? (
          <p
            className="text-2xl font-bold tabular-nums"
            style={{
              color: active ? 'hsl(var(--ninho-sage))' : 'hsl(var(--muted-foreground))',
              fontFamily: 'Quicksand, sans-serif',
            }}
          >
            {fmtTimer(Math.floor(totalMs / 1000))}
          </p>
        ) : (
          <div className="h-9" />
        )}
      </div>

      <div className="h-5 flex items-center justify-center gap-1 mt-1">
        {showPulse && (
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: 'hsl(var(--ninho-sage))' }}
          />
        )}
        <span
          className="text-[10px] font-semibold"
          style={{
            color: active ? 'hsl(var(--ninho-sage))' : 'transparent',
            fontFamily: 'Nunito, sans-serif',
          }}
        >
          {statusLabel}
        </span>
      </div>

      {onClick && (
        <div className="mt-1">
          {active ? (
            <div
              className="w-5 h-5 rounded-full mx-auto flex items-center justify-center"
              style={{ backgroundColor: 'hsl(var(--ninho-sage))' }}
            >
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          ) : (
            <div
              className="w-5 h-5 rounded-full border-2 mx-auto"
              style={{ borderColor: 'hsl(var(--border))' }}
            />
          )}
        </div>
      )}
    </button>
  );
}

// ─── ChildSelect ───────────────────────────────────────────────────────────

function ChildSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
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
          {children.map(child => (
            <SelectItem key={child.id} value={child.id}>
              {child.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── Dialogs ───────────────────────────────────────────────────────────────

function DiscardDialog({
  durationMin,
  onDiscard,
  onContinue,
}: {
  durationMin: number;
  onDiscard: () => void;
  onContinue: () => void;
}) {
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
        <p
          className="text-base font-bold text-center"
          style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}
        >
          Descartar sessão?
        </p>
        <p
          className="text-sm text-center"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
        >
          Você registrou {durationMin} min nesta mamada. Deseja descartar mesmo?
        </p>

        <div className="space-y-2 pt-2">
          <button
            onClick={onContinue}
            className="w-full py-3.5 rounded-2xl text-sm font-bold"
            style={{
              backgroundColor: 'hsl(var(--muted))',
              color: 'hsl(var(--ninho-brown))',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            Continuar editando
          </button>
          <button
            onClick={onDiscard}
            className="w-full py-2 text-xs font-semibold"
            style={{ color: 'hsl(var(--destructive))', fontFamily: 'Nunito, sans-serif' }}
          >
            Descartar sessão
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function UnsavedDialog({
  onSave,
  onDiscard,
  onContinue,
}: {
  onSave: () => void;
  onDiscard: () => void;
  onContinue: () => void;
}) {
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
        <p
          className="text-base font-bold text-center"
          style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}
        >
          Sessão não salva
        </p>
        <p
          className="text-sm text-center"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
        >
          Deseja salvar esta sessão antes de sair?
        </p>

        <div className="space-y-2 pt-2">
          <button
            onClick={onSave}
            className="w-full py-3.5 rounded-2xl text-sm font-bold"
            style={{
              background:
                'linear-gradient(135deg, hsl(var(--ninho-sage)), hsl(var(--ninho-mauve)))',
              color: 'white',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            Salvar
          </button>
          <button
            onClick={onContinue}
            className="w-full py-3.5 rounded-2xl text-sm font-bold"
            style={{
              backgroundColor: 'hsl(var(--muted))',
              color: 'hsl(var(--ninho-brown))',
              fontFamily: 'Nunito, sans-serif',
            }}
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
  const { activeChildId } = useActiveChild();

  const [childId, setChildId] = useState(activeChildId ?? '');

  const [phase, setPhase] = useState<FeedPhase>('suggest');
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('ACTIVE');

  const [selectedSide, setSelectedSide] = useState<Side>('L');
  const [suggestedSide, setSuggestedSide] = useState<Side>('L');
  const [lastFeedTime, setLastFeedTime] = useState<string | null>(null);
  const [recentSessions, setRecentSessions] = useState<FeedRoutineRecord[]>([]);

  const [sessionStartEpoch, setSessionStartEpoch] = useState<number>(0);
  const [activeSide, setActiveSide] = useState<Side>('L');
  const [switchCount, setSwitchCount] = useState(0);

  const sideTimesRef = useRef<SideTimes>({ L: 0, R: 0 });
  const segmentStartRef = useRef<number | null>(null);
  const activeSideRef = useRef<Side>('L');
  const [, forceRender] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [finishedData, setFinishedData] = useState<FinishedData | null>(null);
  const [sessionInsight, setSessionInsight] = useState<string | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [tipIndex] = useState(() => Math.floor(Math.random() * EDU_TIPS.length));

  const [obsOpen, setObsOpen] = useState(false);
  const [obsTags, setObsTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);
  const [saving, setSaving] = useState(false);

  const [bottleMethod, setBottleMethod] = useState<'bottle' | 'formula'>('bottle');
  const [bottleAmount, setBottleAmount] = useState('');
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');
  const [manualSide, setManualSide] = useState<'L' | 'R' | 'both'>('L');

  // ─── Display derived from refs ───────────────────────────────

  function getDisplay() {
    const nowMs =
      segmentStartRef.current !== null && sessionStatus === 'ACTIVE'
        ? Date.now() - segmentStartRef.current
        : 0;

    const L = sideTimesRef.current.L + (activeSideRef.current === 'L' ? nowMs : 0);
    const R = sideTimesRef.current.R + (activeSideRef.current === 'R' ? nowMs : 0);

    return {
      L,
      R,
      total: L + R,
    };
  }

  function getTotalDurationMin() {
    const display = getDisplay();
    return Math.floor(display.total / 60000);
  }

  // ─── Timer control ────────────────────────────────────────────

  function startInterval() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => forceRender(n => n + 1), 500);
  }

  function stopInterval() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  useEffect(() => {
    if (phase === 'session' && sessionStatus === 'ACTIVE') {
      startInterval();
    } else {
      stopInterval();
    }

    return stopInterval;
  }, [phase, sessionStatus]);

  // ─── Persist ─────────────────────────────────────────────────

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

  useEffect(() => {
    persistSession();
  }, [persistSession]);

  // ─── Helpers ─────────────────────────────────────────────────

  function resetTimers() {
    sideTimesRef.current = { L: 0, R: 0 };
    segmentStartRef.current = null;
    activeSideRef.current = 'L';
    setActiveSide('L');
    setSwitchCount(0);
    setSessionStatus('ACTIVE');
    setSessionStartEpoch(0);
    stopInterval();
  }

  function resetObs() {
    setObsOpen(false);
    setObsTags([]);
    setNotes('');
    setIncludeInReport(false);
    setFinishedData(null);
    setSessionInsight(null);
    setSaving(false);
    setBottleAmount('');
    setBottleMethod('bottle');
    setManualStart('');
    setManualEnd('');
    setManualSide('L');
  }

  function toggleTag(id: string) {
    setObsTags(prev => (prev.includes(id) ? prev.filter(tag => tag !== id) : [...prev, id]));
  }

  // ─── Suggestion loading ──────────────────────────────────────

  const loadSuggestion = useCallback(async (targetChildId: string) => {
    try {
      const { data, error } = await supabase
        .from('routine_logs')
        .select('*')
        .eq('child_id', targetChildId)
        .eq('type', 'feed')
        .order('start_time', { ascending: false })
        .limit(10);

      if (error) throw error;

      const records = (data ?? [])
        .filter(row => row.type === 'feed')
        .map(row => toRoutineRecord({ ...row, type: 'feed' }));

      if (records.length > 0) {
        const last = records[0];
        const lastSide = last.payload.lastSide;
        const suggested: Side = lastSide === 'L' ? 'R' : 'L';

        setSuggestedSide(suggested);
        setSelectedSide(suggested);
        setLastFeedTime(last.startTime);
        setRecentSessions(records);
      } else {
        setSuggestedSide('L');
        setSelectedSide('L');
        setLastFeedTime(null);
        setRecentSessions([]);
      }
    } catch {
      setSuggestedSide('L');
      setSelectedSide('L');
      setLastFeedTime(null);
      setRecentSessions([]);
    }
  }, []);

  // ─── On sheet open ────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;

    const targetChildId = activeChildId ?? '';
    setChildId(targetChildId);
    resetObs();
    setShowUnsavedDialog(false);
    setShowDiscardDialog(false);

    const persisted = loadSession();

    if (persisted && persisted.childId === targetChildId) {
      sideTimesRef.current = persisted.sideTimes ?? { L: 0, R: 0 };
      activeSideRef.current = persisted.activeSide ?? 'L';
      setActiveSide(persisted.activeSide ?? 'L');
      setSwitchCount(persisted.switchCount ?? 0);
      setSessionStartEpoch(persisted.sessionStartEpoch);

      if (persisted.status === 'FINISHED') {
        stopInterval();
        segmentStartRef.current = null;
        setSessionStatus('FINISHED');
        setPhase('session');
      } else if (persisted.status === 'ACTIVE' && persisted.segmentStartEpoch) {
        const gap = Date.now() - persisted.segmentStartEpoch;

        sideTimesRef.current = {
          ...sideTimesRef.current,
          [activeSideRef.current]: sideTimesRef.current[activeSideRef.current] + gap,
        };

        segmentStartRef.current = null;
        setSessionStatus('PAUSED');
        setPhase('session');
      } else {
        segmentStartRef.current = null;
        setSessionStatus('PAUSED');
        setPhase('session');
      }
    } else {
      resetTimers();
      setPhase('suggest');
      loadSuggestion(targetChildId);
    }
  }, [open, activeChildId, loadSuggestion]);

  // ─── Session actions ──────────────────────────────────────────

  function handleStart() {
    const now = Date.now();

    sideTimesRef.current = { L: 0, R: 0 };
    activeSideRef.current = selectedSide;
    segmentStartRef.current = now;

    setActiveSide(selectedSide);
    setSwitchCount(0);
    setSessionStatus('ACTIVE');
    setSessionStartEpoch(now);
    setPhase('session');

    toast({ title: '🤱 Sessão iniciada' });
  }

  function handleSwitch() {
    const now = Date.now();
    const newSide: Side = activeSideRef.current === 'L' ? 'R' : 'L';

    if (segmentStartRef.current !== null) {
      const elapsed = now - segmentStartRef.current;

      sideTimesRef.current = {
        ...sideTimesRef.current,
        [activeSideRef.current]: sideTimesRef.current[activeSideRef.current] + elapsed,
      };
    }

    segmentStartRef.current = now;
    activeSideRef.current = newSide;

    setActiveSide(newSide);
    setSwitchCount(count => count + 1);
    setSessionStatus('ACTIVE');
    forceRender(n => n + 1);

    toast({
      title: `↔ Lado ${newSide === 'R' ? 'direito' : 'esquerdo'} iniciado`,
    });
  }

  function handlePause() {
    const now = Date.now();

    if (segmentStartRef.current !== null) {
      sideTimesRef.current = {
        ...sideTimesRef.current,
        [activeSideRef.current]:
          sideTimesRef.current[activeSideRef.current] + (now - segmentStartRef.current),
      };
      segmentStartRef.current = null;
    }

    setSessionStatus('PAUSED');
    toast({ title: '⏸ Sessão pausada' });
  }

  function handleResume() {
    segmentStartRef.current = Date.now();
    setSessionStatus('ACTIVE');
    toast({ title: '▶ Sessão retomada' });
  }

  function handleFinish() {
    const now = Date.now();

    if (segmentStartRef.current !== null) {
      sideTimesRef.current = {
        ...sideTimesRef.current,
        [activeSideRef.current]:
          sideTimesRef.current[activeSideRef.current] + (now - segmentStartRef.current),
      };
      segmentStartRef.current = null;
    }

    stopInterval();

    const totalMs = sideTimesRef.current.L + sideTimesRef.current.R;
    const totalSec = Math.floor(totalMs / 1000);

    const result: FinishedData = {
      totalSec,
      leftSec: Math.floor(sideTimesRef.current.L / 1000),
      rightSec: Math.floor(sideTimesRef.current.R / 1000),
      switches: switchCount,
      start: new Date(sessionStartEpoch),
      end: new Date(now),
      lastSide: activeSideRef.current,
    };

    setFinishedData(result);
    setSessionInsight(
      computeInsight(totalSec, switchCount, lastFeedTime, recentSessions)
    );
    setSessionStatus('FINISHED');
    setPhase('summary');
  }

  // ─── Discard logic ────────────────────────────────────────────

  function requestDiscard() {
    const durationMin = getTotalDurationMin();

    if (durationMin < 1) {
      doDiscard();
    } else {
      setShowDiscardDialog(true);
    }
  }

  function doDiscard() {
    clearSession();
    resetTimers();
    resetObs();
    setPhase('suggest');
    setShowDiscardDialog(false);
    setShowUnsavedDialog(false);
    onClose();
    toast({ title: '🗑 Sessão descartada' });
    loadSuggestion(childId);
  }

  // ─── Save actions ─────────────────────────────────────────────

  async function handleSave() {
    if (!user || !childId || !finishedData) return;

    setSaving(true);

    try {
      const payload = serializeRoutinePayload('feed', {
        mode: 'breastfeeding',
        side:
          finishedData.leftSec > 0 && finishedData.rightSec > 0
            ? 'both'
            : finishedData.leftSec > 0
            ? 'left'
            : 'right',
        amountMl: null,
        food: null,
        totalSeconds: finishedData.totalSec,
        leftSeconds: finishedData.leftSec,
        rightSeconds: finishedData.rightSec,
        switches: finishedData.switches,
        lastSide: finishedData.lastSide,
        tags: obsTags,
        includeInReport,
      });

      const { error } = await supabase.from('routine_logs').insert([{
        child_id: childId,
        author_id: user.id,
        type: 'feed' as const,
        start_time: finishedData.start.toISOString(),
        end_time: finishedData.end.toISOString(),
        notes: notes.trim() || null,
        payload: payload as unknown as import('@/integrations/supabase/types').Json,
      }]);

      if (error) throw error;

      clearSession();
      toast({ title: '✓ Sessão salva' });
      onSaved();
      doClose(true);
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
      const payload = serializeRoutinePayload('feed', {
        mode: 'bottle',
        side: null,
        amountMl: bottleAmount ? Number(bottleAmount) : null,
        food: bottleMethod === 'formula' ? 'formula' : 'mamadeira',
        tags: [],
        includeInReport: false,
      });

      const { error } = await supabase.from('routine_logs').insert([{
        child_id: childId,
        author_id: user.id,
        type: 'feed' as const,
        start_time: new Date().toISOString(),
        end_time: null,
        notes: null,
        payload: payload as unknown as import('@/integrations/supabase/types').Json,
      }]);
        notes: notes.trim() || null,
        payload,
      });

      if (error) throw error;

      toast({
        title: bottleMethod === 'bottle' ? '🍼 Mamadeira registrada' : '🥛 Fórmula registrada',
      });

      onSaved();
      doClose(true);
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

  async function handleManualSave() {
    if (!user || !childId || !manualStart) return;

    setSaving(true);

    try {
      const start = new Date(manualStart);
      const end = manualEnd ? new Date(manualEnd) : null;
      const totalSec = end
        ? Math.floor((end.getTime() - start.getTime()) / 1000)
        : 0;

      const leftSec =
        manualSide === 'R'
          ? 0
          : manualSide === 'both'
          ? Math.floor(totalSec / 2)
          : totalSec;

      const rightSec =
        manualSide === 'L'
          ? 0
          : manualSide === 'both'
          ? Math.ceil(totalSec / 2)
          : totalSec;

      const payload = serializeRoutinePayload('feed', {
        mode: 'breastfeeding',
        side:
          manualSide === 'both'
            ? 'both'
            : manualSide === 'L'
            ? 'left'
            : 'right',
        amountMl: null,
        food: null,
        totalSeconds: totalSec,
        leftSeconds: leftSec,
        rightSeconds: rightSec,
        switches: manualSide === 'both' ? 1 : 0,
        lastSide: manualSide === 'L' ? 'L' : 'R',
        tags: [],
        includeInReport: false,
        isManual: true,
      });

      const { error } = await supabase.from('routine_logs').insert({
        child_id: childId,
        author_id: user.id,
        type: 'feed',
        start_time: start.toISOString(),
        end_time: end?.toISOString() ?? null,
        notes: notes.trim() || null,
        payload,
      });

      if (error) throw error;

      toast({ title: '🤱 Amamentação registrada' });
      onSaved();
      doClose(true);
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

  // ─── Close logic ──────────────────────────────────────────────

  function handleSheetDismiss() {
    if (phase === 'summary' && sessionStatus === 'FINISHED') {
      setShowUnsavedDialog(true);
      return;
    }

    if (
      phase === 'session' &&
      (sessionStatus === 'ACTIVE' || sessionStatus === 'PAUSED')
    ) {
      onClose();
      return;
    }

    doClose(false);
  }

  function doClose(fullReset: boolean) {
    setShowUnsavedDialog(false);
    setShowDiscardDialog(false);
    onClose();

    if (fullReset) {
      resetTimers();
      resetObs();
      setPhase('suggest');
      clearSession();
    }
  }

  // ─── Render derived ───────────────────────────────────────────

  const display = getDisplay();
  const isFullHeight = phase === 'session' || phase === 'summary';

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={value => {
          if (!value) handleSheetDismiss();
        }}
      >
        <SheetContent
          side="bottom"
          className={`rounded-t-3xl pb-safe flex flex-col overflow-y-auto ${
            isFullHeight ? 'h-[92vh]' : ''
          }`}
          style={{ backgroundColor: 'hsl(var(--card))' }}
        >
          <AnimatePresence mode="wait">
            {phase === 'suggest' && (
              <motion.div
                key="suggest"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col px-1 pt-2"
              >
                <ChildHeader />
                <ChildSelect value={childId} onChange={setChildId} />

                {lastFeedTime && (
                  <div
                    className="rounded-2xl px-4 py-3 mb-5 flex items-center gap-3"
                    style={{ backgroundColor: 'hsl(var(--ninho-sage) / 0.08)' }}
                  >
                    <span className="text-xl">⏰</span>
                    <div>
                      <p
                        className="text-sm font-bold"
                        style={{
                          color: 'hsl(var(--ninho-brown))',
                          fontFamily: 'Quicksand, sans-serif',
                        }}
                      >
                        Última mamada há {fmtTimeSince(lastFeedTime)}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{
                          color: 'hsl(var(--muted-foreground))',
                          fontFamily: 'Nunito, sans-serif',
                        }}
                      >
                        Bebês costumam mamar a cada 2–3h
                      </p>
                    </div>
                  </div>
                )}

                <p
                  className="text-xs font-bold uppercase tracking-wider mb-3"
                  style={{
                    color: 'hsl(var(--muted-foreground))',
                    fontFamily: 'Nunito, sans-serif',
                  }}
                >
                  Começar pelo lado
                </p>

                <div className="flex gap-3 mb-2">
                  <SideCard
                    side="L"
                    active={selectedSide === 'L'}
                    onClick={() => setSelectedSide('L')}
                  />
                  <SideCard
                    side="R"
                    active={selectedSide === 'R'}
                    onClick={() => setSelectedSide('R')}
                  />
                </div>

                {selectedSide === suggestedSide && lastFeedTime ? (
                  <p
                    className="text-[11px] text-center mb-5"
                    style={{
                      color: 'hsl(var(--ninho-sage))',
                      fontFamily: 'Nunito, sans-serif',
                    }}
                  >
                    ✓ Sugerido com base na última sessão
                  </p>
                ) : (
                  <div className="mb-5" />
                )}

                <Button
                  onClick={handleStart}
                  disabled={!childId}
                  className="w-full rounded-2xl h-14 text-base font-bold shadow-md"
                  style={{
                    background:
                      'linear-gradient(135deg, hsl(var(--ninho-sage)), hsl(var(--ninho-mauve)))',
                    color: 'white',
                  }}
                >
                  ▶ Iniciar amamentação
                </Button>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => setPhase('manual')}
                    className="py-3 rounded-2xl text-sm font-bold text-center transition-all active:scale-95"
                    style={{
                      backgroundColor: 'hsl(var(--muted))',
                      color: 'hsl(var(--ninho-brown))',
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
                      color: 'hsl(var(--ninho-brown))',
                      fontFamily: 'Nunito, sans-serif',
                    }}
                  >
                    🍼 Mamadeira / Fórmula
                  </button>
                </div>
              </motion.div>
            )}

            {phase === 'session' && (
              <motion.div
                key="session"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col"
              >
                <div className="flex items-center justify-center gap-2 px-1 pt-1 mb-5">
                  {sessionStatus === 'ACTIVE' && (
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: 'hsl(var(--ninho-sage))' }}
                    />
                  )}

                  <p
                    className="text-sm font-bold"
                    style={{
                      color: 'hsl(var(--ninho-brown))',
                      fontFamily: 'Nunito, sans-serif',
                    }}
                  >
                    {sessionStatus === 'ACTIVE'
                      ? 'Sessão em andamento'
                      : sessionStatus === 'PAUSED'
                      ? '⏸ Sessão pausada'
                      : '✓ Sessão finalizada'}
                  </p>
                </div>

                <div className="flex gap-3 px-1">
                  <SideCard
                    side="L"
                    active={activeSide === 'L'}
                    totalMs={display.L}
                    sessionStatus={sessionStatus}
                  />
                  <SideCard
                    side="R"
                    active={activeSide === 'R'}
                    totalMs={display.R}
                    sessionStatus={sessionStatus}
                  />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                  <p
                    className="text-7xl font-bold tabular-nums"
                    style={{
                      color:
                        sessionStatus === 'ACTIVE'
                          ? 'hsl(var(--ninho-sage))'
                          : 'hsl(var(--muted-foreground))',
                      fontFamily: 'Quicksand, sans-serif',
                    }}
                  >
                    {fmtTimer(Math.floor(display.total / 1000))}
                  </p>

                  <p
                    className="text-xs mt-2 font-semibold"
                    style={{
                      color: 'hsl(var(--muted-foreground))',
                      fontFamily: 'Nunito, sans-serif',
                    }}
                  >
                    duração total
                  </p>

                  {switchCount > 0 && (
                    <p
                      className="text-[11px] mt-2 px-3 py-1 rounded-full"
                      style={{
                        color: 'hsl(var(--ninho-mauve))',
                        backgroundColor: 'hsl(var(--ninho-mauve) / 0.1)',
                        fontFamily: 'Nunito, sans-serif',
                        fontWeight: 600,
                      }}
                    >
                      {switchCount} troca{switchCount > 1 ? 's' : ''} de lado
                    </p>
                  )}
                </div>

                <div className="px-1 pb-4 space-y-3">
                  {sessionStatus !== 'FINISHED' && (
                    <>
                      <button
                        onClick={handleSwitch}
                        className="w-full py-5 rounded-2xl text-base font-bold transition-all active:scale-[0.97] shadow-md"
                        style={{
                          background:
                            'linear-gradient(135deg, hsl(var(--ninho-sage)), hsl(var(--ninho-mauve)))',
                          color: 'white',
                          fontFamily: 'Nunito, sans-serif',
                        }}
                      >
                        ⟷ Trocar para lado {activeSide === 'L' ? 'direito →' : '← esquerdo'}
                      </button>

                      <div className="flex gap-3">
                        <button
                          onClick={sessionStatus === 'PAUSED' ? handleResume : handlePause}
                          className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
                          style={{
                            backgroundColor: 'hsl(var(--muted))',
                            color: 'hsl(var(--ninho-brown))',
                            fontFamily: 'Nunito, sans-serif',
                          }}
                        >
                          {sessionStatus === 'PAUSED' ? '▶ Continuar' : '⏸ Pausar'}
                        </button>

                        <button
                          onClick={handleFinish}
                          className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
                          style={{
                            backgroundColor: 'hsl(var(--ninho-mauve) / 0.12)',
                            color: 'hsl(var(--ninho-mauve))',
                            fontFamily: 'Nunito, sans-serif',
                          }}
                        >
                          ✓ Finalizar
                        </button>
                      </div>
                    </>
                  )}

                  {sessionStatus === 'FINISHED' && (
                    <Button
                      onClick={() => setPhase('summary')}
                      className="w-full rounded-2xl h-14 text-base font-bold"
                      style={{
                        background:
                          'linear-gradient(135deg, hsl(var(--ninho-sage)), hsl(var(--ninho-mauve)))',
                        color: 'white',
                      }}
                    >
                      Ver resumo →
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {phase === 'summary' && finishedData && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="flex-1 flex flex-col px-1 pt-2"
              >
                <p
                  className="text-xl font-bold text-center mb-0.5"
                  style={{
                    color: 'hsl(var(--ninho-brown))',
                    fontFamily: 'Quicksand, sans-serif',
                  }}
                >
                  Resumo
                </p>

                <p
                  className="text-xs text-center mb-5"
                  style={{
                    color: 'hsl(var(--muted-foreground))',
                    fontFamily: 'Nunito, sans-serif',
                  }}
                >
                  {finishedData.start.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  –{' '}
                  {finishedData.end.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>

                <div className="text-center mb-4">
                  <p
                    className="text-5xl font-bold tabular-nums"
                    style={{
                      color: 'hsl(var(--ninho-sage))',
                      fontFamily: 'Quicksand, sans-serif',
                    }}
                  >
                    {fmtDurationShort(finishedData.totalSec)}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{
                      color: 'hsl(var(--muted-foreground))',
                      fontFamily: 'Nunito, sans-serif',
                    }}
                  >
                    duração total
                  </p>
                </div>

                <div className="flex gap-2 mb-2.5">
                  {[
                    {
                      label: 'Esquerdo',
                      value: fmtDurationShort(finishedData.leftSec),
                      color: 'hsl(var(--ninho-sage))',
                      bg: 'hsl(var(--ninho-sage) / 0.08)',
                    },
                    {
                      label: 'Trocas',
                      value: String(finishedData.switches),
                      color: 'hsl(var(--ninho-brown))',
                      bg: 'hsl(var(--muted))',
                    },
                    {
                      label: 'Direito',
                      value: fmtDurationShort(finishedData.rightSec),
                      color: 'hsl(var(--ninho-mauve))',
                      bg: 'hsl(var(--ninho-mauve) / 0.08)',
                    },
                  ].map(stat => (
                    <div
                      key={stat.label}
                      className="flex-1 rounded-2xl p-3.5 text-center"
                      style={{ backgroundColor: stat.bg }}
                    >
                      <p
                        className="text-[10px] font-bold uppercase tracking-wide"
                        style={{ color: stat.color }}
                      >
                        {stat.label}
                      </p>
                      <p
                        className="text-xl font-bold mt-1"
                        style={{ color: stat.color, fontFamily: 'Quicksand, sans-serif' }}
                      >
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {finishedData.totalSec > 0 && (
                  <div
                    className="h-2 rounded-full overflow-hidden flex mb-4"
                    style={{ backgroundColor: 'hsl(var(--muted))' }}
                  >
                    <div
                      style={{
                        width: `${(finishedData.leftSec / finishedData.totalSec) * 100}%`,
                        background: 'hsl(var(--ninho-sage))',
                        borderRadius: '9999px 0 0 9999px',
                      }}
                    />
                    {finishedData.rightSec > 0 && (
                      <div
                        style={{
                          width: `${(finishedData.rightSec / finishedData.totalSec) * 100}%`,
                          background: 'hsl(var(--ninho-mauve))',
                          borderRadius: '0 9999px 9999px 0',
                        }}
                      />
                    )}
                  </div>
                )}

                {sessionInsight && (
                  <div
                    className="rounded-2xl px-4 py-2.5 mb-3 flex items-center gap-2"
                    style={{
                      backgroundColor: 'hsl(var(--ninho-sage) / 0.07)',
                      border: '1px solid hsl(var(--ninho-sage) / 0.2)',
                    }}
                  >
                    <p
                      className="text-sm font-semibold"
                      style={{
                        color: 'hsl(var(--ninho-brown))',
                        fontFamily: 'Nunito, sans-serif',
                      }}
                    >
                      {sessionInsight}
                    </p>
                  </div>
                )}

                {recentSessions.length <= 5 && !sessionInsight && (
                  <p
                    className="text-[11px] text-center mb-3"
                    style={{
                      color: 'hsl(var(--muted-foreground))',
                      fontFamily: 'Nunito, sans-serif',
                    }}
                  >
                    💡 {EDU_TIPS[tipIndex]}
                  </p>
                )}

                <div className="flex-1 min-h-3" />

                <AnimatePresence>
                  {obsOpen && (
                    <motion.div
                      key="obs"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mb-3 space-y-3 overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <p
                          className="text-xs font-bold uppercase tracking-wide"
                          style={{
                            color: 'hsl(var(--muted-foreground))',
                            fontFamily: 'Nunito, sans-serif',
                          }}
                        >
                          Como foi?
                        </p>

                        <button
                          onClick={() => {
                            setObsOpen(false);
                            setObsTags([]);
                            setNotes('');
                            setIncludeInReport(false);
                          }}
                          className="text-xs font-semibold"
                          style={{ color: 'hsl(var(--muted-foreground))' }}
                        >
                          Cancelar
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {QUICK_TAGS.map(tag => (
                          <button
                            key={tag.id}
                            onClick={() => toggleTag(tag.id)}
                            className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all active:scale-95"
                            style={{
                              backgroundColor: obsTags.includes(tag.id)
                                ? 'hsl(var(--ninho-sage))'
                                : 'hsl(var(--muted))',
                              color: obsTags.includes(tag.id)
                                ? 'white'
                                : 'hsl(var(--ninho-brown))',
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

                      <div
                        className="flex items-center justify-between px-4 py-3 rounded-2xl"
                        style={{ backgroundColor: 'hsl(var(--muted))' }}
                      >
                        <div>
                          <p
                            className="text-sm font-semibold"
                            style={{
                              color: 'hsl(var(--ninho-brown))',
                              fontFamily: 'Nunito, sans-serif',
                            }}
                          >
                            Incluir no relatório médico
                          </p>
                          <p
                            className="text-[11px]"
                            style={{
                              color: 'hsl(var(--muted-foreground))',
                              fontFamily: 'Nunito, sans-serif',
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
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full rounded-2xl h-14 text-base font-bold shadow-md mb-2"
                  style={{
                    background:
                      'linear-gradient(135deg, hsl(var(--ninho-sage)), hsl(var(--ninho-mauve)))',
                    color: 'white',
                  }}
                >
                  {saving ? 'Salvando...' : '✓ Salvar sessão'}
                </Button>

                {!obsOpen && (
                  <button
                    onClick={() => setObsOpen(true)}
                    className="w-full py-3 rounded-2xl text-sm font-bold text-center mb-2 transition-all active:scale-95"
                    style={{
                      backgroundColor: 'hsl(var(--muted))',
                      color: 'hsl(var(--ninho-brown))',
                      fontFamily: 'Nunito, sans-serif',
                    }}
                  >
                    + Adicionar observação
                  </button>
                )}

                <button
                  onClick={requestDiscard}
                  className="w-full py-2 text-xs font-semibold"
                  style={{
                    color: 'hsl(var(--destructive))',
                    fontFamily: 'Nunito, sans-serif',
                  }}
                >
                  Descartar sessão
                </button>
              </motion.div>
            )}

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
                  <p
                    className="text-lg font-bold"
                    style={{
                      color: 'hsl(var(--ninho-brown))',
                      fontFamily: 'Quicksand, sans-serif',
                    }}
                  >
                    📝 Registro manual
                  </p>

                  <button
                    onClick={() => setPhase('suggest')}
                    className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{
                      backgroundColor: 'hsl(var(--muted))',
                      color: 'hsl(var(--ninho-brown))',
                    }}
                  >
                    ← Voltar
                  </button>
                </div>

                <ChildSelect value={childId} onChange={setChildId} />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      className="text-xs font-semibold"
                      style={{ color: 'hsl(var(--ninho-brown))' }}
                    >
                      Início
                    </Label>
                    <Input
                      type="datetime-local"
                      value={manualStart}
                      onChange={e => setManualStart(e.target.value)}
                      className="h-11 rounded-2xl border-border text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      className="text-xs font-semibold"
                      style={{ color: 'hsl(var(--ninho-brown))' }}
                    >
                      Fim (opcional)
                    </Label>
                    <Input
                      type="datetime-local"
                      value={manualEnd}
                      onChange={e => setManualEnd(e.target.value)}
                      className="h-11 rounded-2xl border-border text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    className="text-xs font-semibold"
                    style={{ color: 'hsl(var(--ninho-brown))' }}
                  >
                    Lado
                  </Label>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'L' as const, label: '← Esquerdo' },
                      { value: 'R' as const, label: 'Direito →' },
                      { value: 'both' as const, label: '↔ Ambos' },
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setManualSide(option.value)}
                        className="py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95"
                        style={{
                          backgroundColor:
                            manualSide === option.value
                              ? 'hsl(var(--ninho-sage))'
                              : 'hsl(var(--muted))',
                          color:
                            manualSide === option.value
                              ? 'white'
                              : 'hsl(var(--ninho-brown))',
                          fontFamily: 'Nunito, sans-serif',
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    className="text-xs font-semibold"
                    style={{ color: 'hsl(var(--ninho-brown))' }}
                  >
                    Observações (opcional)
                  </Label>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Mamou bem..."
                    className="rounded-2xl border-border resize-none"
                    rows={2}
                  />
                </div>

                <Button
                  onClick={handleManualSave}
                  disabled={saving || !childId || !manualStart}
                  className="w-full rounded-2xl h-12 font-bold"
                  style={{
                    backgroundColor: 'hsl(var(--ninho-sage))',
                    color: 'white',
                  }}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </motion.div>
            )}

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
                  <p
                    className="text-lg font-bold"
                    style={{
                      color: 'hsl(var(--ninho-brown))',
                      fontFamily: 'Quicksand, sans-serif',
                    }}
                  >
                    {bottleMethod === 'bottle' ? '🍼 Mamadeira' : '🥛 Fórmula'}
                  </p>

                  <button
                    onClick={() => setPhase('suggest')}
                    className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{
                      backgroundColor: 'hsl(var(--muted))',
                      color: 'hsl(var(--ninho-brown))',
                    }}
                  >
                    ← Voltar
                  </button>
                </div>

                <ChildSelect value={childId} onChange={setChildId} />

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'bottle' as const, label: '🍼 Mamadeira' },
                    { value: 'formula' as const, label: '🥛 Fórmula' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setBottleMethod(option.value)}
                      className="py-3 rounded-2xl text-sm font-bold transition-all active:scale-95"
                      style={{
                        backgroundColor:
                          bottleMethod === option.value
                            ? 'hsl(var(--ninho-sage))'
                            : 'hsl(var(--muted))',
                        color:
                          bottleMethod === option.value
                            ? 'white'
                            : 'hsl(var(--ninho-brown))',
                        fontFamily: 'Nunito, sans-serif',
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label
                    className="text-xs font-semibold"
                    style={{ color: 'hsl(var(--ninho-brown))' }}
                  >
                    Quantidade (ml)
                  </Label>
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
                  <Label
                    className="text-xs font-semibold"
                    style={{ color: 'hsl(var(--ninho-brown))' }}
                  >
                    Observações (opcional)
                  </Label>
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
                  style={{
                    backgroundColor: 'hsl(var(--ninho-sage))',
                    color: 'white',
                  }}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </SheetContent>
      </Sheet>

      {showUnsavedDialog && (
        <UnsavedDialog
          onSave={handleSave}
          onDiscard={doDiscard}
          onContinue={() => setShowUnsavedDialog(false)}
        />
      )}

      {showDiscardDialog && (
        <DiscardDialog
          durationMin={
            finishedData
              ? Math.floor(finishedData.totalSec / 60)
              : getTotalDurationMin()
          }
          onDiscard={doDiscard}
          onContinue={() => setShowDiscardDialog(false)}
        />
      )}
    </>
  );
}
