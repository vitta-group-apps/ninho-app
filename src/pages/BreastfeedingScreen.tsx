/**
 * BreastfeedingScreen — Gold-standard full-screen breastfeeding flow.
 *
 * Phases:
 *  1. suggest  — side select + secondary actions (Registrar manualmente / Mamadeira)
 *  2. session  — large total timer + side cards + pause/end controls
 *  3. ended    — review form (tags, notes, report toggle) + save/discard
 *
 * DS: ScreenHeader · InlineStatusPill · StickyFooterCTA · SectionLabel · ChipGroup · ReportToggle
 * Back guard: BackConfirmSheet prevents silent data loss.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { toast } from '@/hooks/use-toast';
import { makePayloadNotes, fmtTimer, fmtDurationShort } from '@/lib/routineUtils';
import {
  ScreenHeader,
  StickyFooterCTA,
  SectionLabel,
  ChipGroup,
  ReportToggle,
  InlineStatusPill,
} from '@/components/ds';

// ─── Constants ────────────────────────────────────────────────────────────────

export const FEED_SESSION_KEY = 'ninho_feed_session_v6';
const FEED_COLOR = 'hsl(var(--color-feed))';

type Side = 'L' | 'R';
type SessionStatus = 'ACTIVE' | 'PAUSED' | 'FINISHED';
type Phase = 'suggest' | 'session' | 'ended' | 'manual';

interface SideTimes { L: number; R: number; }

export interface FeedSession {
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

const QUICK_TAGS = [
  { id: 'mamou_bem',     label: '😊 Mamou bem' },
  { id: 'inquieto',      label: '😟 Inquieto' },
  { id: 'dormiu',        label: '😴 Dormiu durante' },
  { id: 'pega_boa',      label: '👍 Pega boa' },
  { id: 'rejeitou_lado', label: '↩️ Rejeitou lado' },
];

// ─── Persistence ─────────────────────────────────────────────────────────────

export function saveFeedSession(d: FeedSession) {
  try { localStorage.setItem(FEED_SESSION_KEY, JSON.stringify(d)); } catch { /* noop */ }
}
export function clearFeedSession() {
  localStorage.removeItem(FEED_SESSION_KEY);
  localStorage.removeItem('ninho_feed_session_v4');
  localStorage.removeItem('ninho_feed_session');
}
export function loadFeedSession(): FeedSession | null {
  try { const r = localStorage.getItem(FEED_SESSION_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}

// ─── SideCard ─────────────────────────────────────────────────────────────────

function SideCard({
  side, active, totalMs, status, onClick,
}: {
  side: Side; active: boolean; totalMs: number;
  status: SessionStatus; onClick?: () => void;
}) {
  const label = side === 'L' ? 'Esquerdo' : 'Direito';
  const arrow = side === 'L' ? '←' : '→';
  const showPulse = active && status === 'ACTIVE';

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="flex-1 rounded-3xl py-5 px-3 text-center transition-all duration-200 select-none"
      style={{
        backgroundColor: active
          ? `color-mix(in srgb, ${FEED_COLOR} 10%, hsl(var(--card)))`
          : 'hsl(var(--muted) / 0.6)',
        border: `2px solid ${active
          ? `color-mix(in srgb, ${FEED_COLOR} 35%, transparent)`
          : 'transparent'}`,
        opacity: active ? 1 : 0.55,
        boxShadow: active
          ? `0 2px 10px color-mix(in srgb, ${FEED_COLOR} 14%, transparent)`
          : 'none',
      }}
    >
      <div
        className="w-11 h-11 rounded-full mx-auto flex items-center justify-center text-[18px] font-bold"
        style={{
          backgroundColor: active
            ? `color-mix(in srgb, ${FEED_COLOR} 18%, transparent)`
            : 'hsl(var(--border))',
          color: active ? FEED_COLOR : 'hsl(var(--muted-foreground))',
        }}
      >
        {arrow}
      </div>

      <p
        className="text-[11px] mt-2.5 font-bold uppercase tracking-[0.06em] font-nunito"
        style={{ color: active ? FEED_COLOR : 'hsl(var(--muted-foreground))' }}
      >
        {label}
      </p>

      {/* Timer — stable fixed height to prevent layout jump */}
      <div className="h-10 flex items-center justify-center mt-1">
        <p
          className="text-[28px] font-bold tabular-nums font-quicksand leading-none"
          style={{ color: active ? FEED_COLOR : 'hsl(var(--muted-foreground))' }}
        >
          {fmtTimer(Math.floor(totalMs / 1000))}
        </p>
      </div>

      {/* Status indicator — always occupies space to prevent layout shift */}
      <div className="h-5 flex items-center justify-center gap-1.5 mt-1">
        {showPulse && (
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: FEED_COLOR }} />
        )}
        <span
          className="text-[10px] font-semibold font-nunito"
          style={{ color: active ? FEED_COLOR : 'transparent' }}
        >
          {active && status === 'ACTIVE' ? 'ativo' : active && status === 'PAUSED' ? 'pausado' : '\u00A0'}
        </span>
      </div>
    </button>
  );
}

// ─── Discard review confirm sheet ────────────────────────────────────────────
// Only shown when user tries to go back from the "ended" review phase.
// Active/paused sessions persist silently in background — no interruption.

function DiscardReviewSheet({
  open, durationSec, onStay, onDiscard,
}: {
  open: boolean;
  durationSec: number;
  onStay: () => void;
  onDiscard: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onStay}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        className="w-full max-w-md rounded-t-3xl px-5 pt-6 space-y-3 bg-card"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        <p className="text-base font-bold text-center font-quicksand text-foreground">
          Descartar o registro?
        </p>
        <p className="text-sm text-center pb-1 text-muted-foreground font-nunito">
          {durationSec >= 60
            ? `Você tem ${fmtDurationShort(durationSec)} registrados. Esses dados serão perdidos.`
            : 'A revisão será descartada. Tem certeza?'}
        </p>
        <div className="space-y-2 pb-2">
          <button
            onClick={onStay}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-center transition-all active:scale-95 font-nunito text-white"
            style={{ backgroundColor: FEED_COLOR }}
          >
            Continuar e salvar
          </button>
          <button
            onClick={onDiscard}
            className="w-full py-2 text-xs font-semibold text-center font-nunito text-destructive"
          >
            Descartar e voltar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BreastfeedingScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeChildId, activeChild } = useActiveChild();

  const [phase, setPhase] = useState<Phase>('suggest');
  const [selectedSide, setSelectedSide] = useState<Side>('L');
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('ACTIVE');
  const [sessionStartEpoch, setSessionStartEpoch] = useState(0);
  const [activeSide, setActiveSide] = useState<Side>('L');
  const [switchCount, setSwitchCount] = useState(0);
  const sideTimesRef  = useRef<SideTimes>({ L: 0, R: 0 });
  const segmentStart  = useRef<number | null>(null);
  const activeSideRef = useRef<Side>('L');
  const [, forceRender] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [finishedData, setFinishedData] = useState<FinishedData | null>(null);
  const [obsTags, setObsTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);
  const [saving, setSaving] = useState(false);

  // Manual mode fields
  const [manualSide, setManualSide] = useState<'L' | 'R' | 'both'>('L');
  const [manualDurationMin, setManualDurationMin] = useState('');
  const [manualStartTime, setManualStartTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  // Load existing session on mount
  useEffect(() => {
    const existing = loadFeedSession();
    if (existing && existing.childId === activeChildId) {
      sideTimesRef.current = existing.sideTimes;
      activeSideRef.current = existing.activeSide;
      setActiveSide(existing.activeSide);
      setSwitchCount(existing.switchCount);
      setSessionStartEpoch(existing.sessionStartEpoch);
      setSessionStatus(existing.status);
      if (existing.status !== 'FINISHED') {
        if (existing.segmentStartEpoch) segmentStart.current = existing.segmentStartEpoch;
        setPhase('session');
        if (existing.status === 'ACTIVE') startTicker();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startTicker() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => forceRender(n => n + 1), 500);
  }
  function stopTicker() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }
  useEffect(() => () => stopTicker(), []);

  function getDisplay() {
    const nowMs = segmentStart.current !== null && sessionStatus === 'ACTIVE'
      ? Date.now() - segmentStart.current : 0;
    const L = sideTimesRef.current.L + (activeSideRef.current === 'L' ? nowMs : 0);
    const R = sideTimesRef.current.R + (activeSideRef.current === 'R' ? nowMs : 0);
    return { L, R, total: L + R };
  }

  function getCurrentTotalSec(): number {
    return Math.floor(getDisplay().total / 1000);
  }

  function persist(status: SessionStatus) {
    if (!activeChildId) return;
    saveFeedSession({
      childId: activeChildId,
      sessionStartEpoch,
      sideTimes: sideTimesRef.current,
      activeSide: activeSideRef.current,
      switchCount,
      status,
      segmentStartEpoch: segmentStart.current,
    });
  }

  function handleStart() {
    const now = Date.now();
    sideTimesRef.current = { L: 0, R: 0 };
    activeSideRef.current = selectedSide;
    segmentStart.current = now;
    setActiveSide(selectedSide);
    setSwitchCount(0);
    setSessionStartEpoch(now);
    setSessionStatus('ACTIVE');
    setPhase('session');
    startTicker();
    persist('ACTIVE');
  }

  function handleSwitch() {
    if (sessionStatus !== 'ACTIVE' || !segmentStart.current) return;
    const now = Date.now();
    sideTimesRef.current[activeSideRef.current] += now - segmentStart.current;
    const next: Side = activeSideRef.current === 'L' ? 'R' : 'L';
    activeSideRef.current = next;
    segmentStart.current = now;
    setActiveSide(next);
    setSwitchCount(c => c + 1);
    forceRender(n => n + 1);
    persist('ACTIVE');
  }

  function handlePause() {
    if (!segmentStart.current) return;
    sideTimesRef.current[activeSideRef.current] += Date.now() - segmentStart.current;
    segmentStart.current = null;
    stopTicker();
    setSessionStatus('PAUSED');
    forceRender(n => n + 1);
    persist('PAUSED');
  }

  function handleResume() {
    segmentStart.current = Date.now();
    setSessionStatus('ACTIVE');
    startTicker();
    persist('ACTIVE');
  }

  function handleEnd() {
    if (segmentStart.current && sessionStatus === 'ACTIVE') {
      sideTimesRef.current[activeSideRef.current] += Date.now() - segmentStart.current;
      segmentStart.current = null;
    }
    stopTicker();
    const totalMs = sideTimesRef.current.L + sideTimesRef.current.R;
    setFinishedData({
      totalSec: Math.floor(totalMs / 1000),
      leftSec:  Math.floor(sideTimesRef.current.L / 1000),
      rightSec: Math.floor(sideTimesRef.current.R / 1000),
      switches: switchCount,
      start: new Date(sessionStartEpoch),
      end: new Date(),
      lastSide: activeSideRef.current,
    });
    setPhase('ended');
    clearFeedSession();
  }

  async function handleSave() {
    if (!user || !activeChildId || !finishedData) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        session_type: 'breastfeed',
        total_seconds: finishedData.totalSec,
        left_seconds:  finishedData.leftSec,
        right_seconds: finishedData.rightSec,
        switches:      finishedData.switches,
        last_side:     finishedData.lastSide,
      };
      if (obsTags.length > 0) payload.tags = obsTags.join(',');
      if (includeInReport)    payload.include_in_report = true;

      const { error } = await supabase.from('routine_logs').insert({
        child_id:   activeChildId,
        author_id:  user.id,
        type:       'feed',
        start_time: finishedData.start.toISOString(),
        end_time:   finishedData.end.toISOString(),
        notes:      makePayloadNotes(payload, notes),
      });
      if (error) throw error;
      toast({ title: '🤱 Amamentação registrada' });
      navigate(-1);
    } catch (e: unknown) {
      toast({ title: 'Erro ao salvar', description: e instanceof Error ? e.message : 'Tente novamente', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveManual() {
    if (!user || !activeChildId) return;
    setSaving(true);
    try {
      const durationSec = manualDurationMin ? Number(manualDurationMin) * 60 : 0;
      // Parse start time from HH:MM input
      const now = new Date();
      const [hours, minutes] = manualStartTime.split(':').map(Number);
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
      const endDate = durationSec > 0 ? new Date(startDate.getTime() + durationSec * 1000) : now;

      const sideMap: Record<'L' | 'R' | 'both', { left: number; right: number }> = {
        L:    { left: durationSec, right: 0 },
        R:    { left: 0, right: durationSec },
        both: { left: Math.floor(durationSec / 2), right: Math.ceil(durationSec / 2) },
      };
      const { left, right } = sideMap[manualSide];

      const payload: Record<string, unknown> = {
        session_type:  'breastfeed',
        total_seconds: durationSec,
        left_seconds:  left,
        right_seconds: right,
        switches:      0,
        last_side:     manualSide === 'R' ? 'R' : 'L',
        manual_entry:  true,
      };
      if (obsTags.length > 0) payload.tags = obsTags.join(',');
      if (includeInReport)    payload.include_in_report = true;

      const { error } = await supabase.from('routine_logs').insert({
        child_id:   activeChildId,
        author_id:  user.id,
        type:       'feed',
        start_time: startDate.toISOString(),
        end_time:   endDate.toISOString(),
        notes:      makePayloadNotes(payload, notes),
      });
      if (error) throw error;
      toast({ title: '🤱 Amamentação registrada' });
      navigate(-1);
    } catch (e: unknown) {
      toast({ title: 'Erro ao salvar', description: e instanceof Error ? e.message : 'Tente novamente', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    // Sessions are background-persistent — navigating away never interrupts them.
    // Only the "ended" phase (unsaved review) needs a confirmation to prevent data loss.
    if (phase === 'ended' || phase === 'manual') {
      setShowBackConfirm(true);
    } else {
      // session or suggest: just navigate back — session continues in background
      navigate(-1);
    }
  }

  function handleConfirmContinue() { setShowBackConfirm(false); }
  function handleConfirmSaveReview() {
    setShowBackConfirm(false);
    if (phase === 'session') handleEnd();
  }
  function handleConfirmDiscard() {
    clearFeedSession();
    navigate(-1);
  }

  const display = getDisplay();
  const totalSec = getCurrentTotalSec();

  const statusPill = phase === 'session' ? (
    <InlineStatusPill
      label={sessionStatus === 'ACTIVE' ? 'Em andamento' : 'Pausada'}
      variant={sessionStatus === 'ACTIVE' ? 'active' : 'paused'}
      color={FEED_COLOR}
    />
  ) : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* DS Header */}
      <ScreenHeader
        title="Amamentação"
        childName={activeChild?.name}
        onBack={handleBack}
        statusSlot={statusPill}
      />

      {/* Scrollable body */}
      <div className="ds-form-body">

        {/* ── SUGGEST ───────────────────────────────────────────────── */}
        {phase === 'suggest' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-7 pt-6"
          >
            {/* Hero icon */}
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: `color-mix(in srgb, ${FEED_COLOR} 10%, transparent)`,
                border: `2px dashed color-mix(in srgb, ${FEED_COLOR} 30%, transparent)`,
              }}
            >
              <span className="text-[52px]">🤱</span>
            </div>

            <div className="text-center space-y-1.5">
              <p className="text-[18px] font-bold font-quicksand text-foreground">Pronta para mamar?</p>
              <p className="text-[13px] text-muted-foreground font-nunito leading-snug max-w-[200px] mx-auto">
                Escolha o lado e inicie o cronômetro
              </p>
            </div>

            {/* Side selector */}
            <div className="w-full">
              <SectionLabel>Por qual lado começar?</SectionLabel>
              <div className="flex gap-3">
                {(['L', 'R'] as Side[]).map(s => (
                  <SideCard key={s} side={s} active={selectedSide === s}
                    totalMs={0} status="ACTIVE" onClick={() => setSelectedSide(s)} />
                ))}
              </div>
            </div>

          {/* Secondary actions */}
            <div className="w-full flex flex-col gap-2 pt-2 border-t border-border">
              <button
                onClick={() => navigate('/bottle')}
                className="w-full py-3 rounded-2xl text-[13px] font-semibold font-nunito text-center transition-all active:scale-95 bg-muted text-foreground"
              >
                🍼 Mamadeira / Fórmula
              </button>
              <button
                onClick={() => {
                  // Reset manual fields to current time
                  const now = new Date();
                  setManualStartTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
                  setManualDurationMin('');
                  setManualSide('L');
                  setPhase('manual');
                }}
                className="w-full py-2.5 text-[12px] font-semibold font-nunito text-center text-muted-foreground"
              >
                Registrar sem cronômetro
              </button>
            </div>
          </motion.div>
        )}

        {/* ── SESSION ───────────────────────────────────────────────── */}
        {phase === 'session' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Total timer — dominant visual element */}
            <div
              className="flex flex-col items-center py-6 px-4 rounded-2xl"
              style={{
                backgroundColor: `color-mix(in srgb, ${FEED_COLOR} 7%, hsl(var(--card)))`,
                border: `1.5px solid color-mix(in srgb, ${FEED_COLOR} 22%, transparent)`,
              }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-2 text-muted-foreground font-nunito">
                Tempo total
              </p>
              <p
                className="text-[52px] font-bold tabular-nums font-quicksand leading-none"
                style={{ color: FEED_COLOR }}
              >
                {fmtTimer(Math.floor(display.total / 1000))}
              </p>
              {sessionStatus === 'ACTIVE' && (
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: FEED_COLOR }} />
                  <p className="text-[11px] font-semibold font-nunito" style={{ color: FEED_COLOR }}>
                    Sessão em andamento
                  </p>
                </div>
              )}
              {sessionStatus === 'PAUSED' && (
                <p className="text-[11px] font-semibold font-nunito mt-2 text-muted-foreground">
                  Sessão pausada
                </p>
              )}
            </div>

            {/* Side cards */}
            <div>
              <SectionLabel>
                {sessionStatus === 'ACTIVE' ? 'Toque no lado para alternar' : 'Sessão pausada'}
              </SectionLabel>
              <div className="flex gap-3">
                {(['L', 'R'] as Side[]).map(s => (
                  <SideCard key={s} side={s} active={activeSide === s}
                    totalMs={display[s]} status={sessionStatus}
                    onClick={sessionStatus === 'ACTIVE' ? handleSwitch : undefined} />
                ))}
              </div>
              {switchCount > 0 && (
                <p className="text-center text-[12px] mt-2 text-muted-foreground font-nunito">
                  {switchCount} troca{switchCount > 1 ? 's' : ''} de lado
                </p>
              )}
            </div>

            {/* Trocar de lado — always visible, disabled when not active */}
            <button
              onClick={sessionStatus === 'ACTIVE' ? handleSwitch : undefined}
              disabled={sessionStatus !== 'ACTIVE'}
              className="w-full py-3.5 rounded-2xl text-[13px] font-bold font-nunito transition-all active:scale-95"
              style={{
                backgroundColor: sessionStatus === 'ACTIVE'
                  ? `color-mix(in srgb, ${FEED_COLOR} 10%, transparent)`
                  : 'hsl(var(--muted))',
                color: sessionStatus === 'ACTIVE' ? FEED_COLOR : 'hsl(var(--muted-foreground))',
                border: `1.5px solid ${sessionStatus === 'ACTIVE'
                  ? `color-mix(in srgb, ${FEED_COLOR} 25%, transparent)`
                  : 'transparent'}`,
                opacity: sessionStatus === 'ACTIVE' ? 1 : 0.45,
              }}
            >
              ⇄ Trocar de lado
            </button>

            {/* Controls */}
            <div className="flex gap-3">
              {sessionStatus === 'ACTIVE' ? (
                <button
                  onClick={handlePause}
                  className="flex-1 py-4 rounded-2xl text-[14px] font-bold font-nunito transition-all active:scale-95 bg-secondary text-foreground"
                >
                  Pausar
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  className="flex-1 py-4 rounded-2xl text-[14px] font-bold font-nunito transition-all active:scale-95"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${FEED_COLOR} 10%, transparent)`,
                    color: FEED_COLOR,
                    border: `1.5px solid color-mix(in srgb, ${FEED_COLOR} 30%, transparent)`,
                  }}
                >
                  Continuar
                </button>
              )}
              <button
                onClick={handleEnd}
                className="flex-1 py-4 rounded-2xl text-[14px] font-bold font-nunito transition-all active:scale-95 text-white"
                style={{ backgroundColor: FEED_COLOR }}
              >
                Encerrar
              </button>
            </div>
          </motion.div>
        )}

        {/* ── MANUAL ────────────────────────────────────────────────── */}
        {phase === 'manual' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header */}
            <div
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{
                backgroundColor: `color-mix(in srgb, ${FEED_COLOR} 8%, hsl(var(--card)))`,
                border: `1.5px solid color-mix(in srgb, ${FEED_COLOR} 22%, transparent)`,
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0"
                style={{ backgroundColor: `color-mix(in srgb, ${FEED_COLOR} 16%, transparent)` }}
              >
                🤱
              </div>
              <div>
                <p className="text-[14px] font-bold font-quicksand text-foreground leading-tight">Registro manual</p>
                <p className="text-[12px] font-nunito text-muted-foreground mt-0.5">Preencha os dados da mamada</p>
              </div>
            </div>

            {/* Side selection */}
            <div>
              <SectionLabel>Qual lado?</SectionLabel>
              <div className="flex gap-3">
                {([
                  { val: 'L',    label: 'Esquerdo', arrow: '←' },
                  { val: 'R',    label: 'Direito',   arrow: '→' },
                  { val: 'both', label: 'Ambos',     arrow: '⇄' },
                ] as { val: 'L' | 'R' | 'both'; label: string; arrow: string }[]).map(opt => {
                  const isActive = manualSide === opt.val;
                  return (
                    <button
                      key={opt.val}
                      onClick={() => setManualSide(opt.val)}
                      className="flex-1 flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl font-bold transition-all active:scale-95 font-nunito"
                      style={{
                        backgroundColor: isActive
                          ? `color-mix(in srgb, ${FEED_COLOR} 10%, hsl(var(--card)))`
                          : 'hsl(var(--card))',
                        border: `2px solid ${isActive ? FEED_COLOR : 'hsl(var(--border))'}`,
                      }}
                    >
                      <span
                        className="text-[20px] font-bold"
                        style={{ color: isActive ? FEED_COLOR : 'hsl(var(--muted-foreground))' }}
                      >
                        {opt.arrow}
                      </span>
                      <p
                        className="text-[11px] font-bold"
                        style={{ color: isActive ? FEED_COLOR : 'hsl(var(--foreground))' }}
                      >
                        {opt.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration */}
            <div>
              <SectionLabel>Duração (minutos)</SectionLabel>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="120"
                placeholder="ex: 15"
                value={manualDurationMin}
                onChange={e => setManualDurationMin(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl text-[15px] font-semibold border bg-card text-foreground font-nunito outline-none focus:ring-2 focus:ring-offset-0"
                style={{ borderColor: 'hsl(var(--border))', '--tw-ring-color': FEED_COLOR } as React.CSSProperties}
              />
            </div>

            {/* Start time */}
            <div>
              <SectionLabel>Horário de início</SectionLabel>
              <input
                type="time"
                value={manualStartTime}
                onChange={e => setManualStartTime(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl text-[15px] font-semibold border bg-card text-foreground font-nunito outline-none focus:ring-2 focus:ring-offset-0"
                style={{ borderColor: 'hsl(var(--border))', '--tw-ring-color': FEED_COLOR } as React.CSSProperties}
              />
            </div>

            <div className="h-px" style={{ backgroundColor: 'hsl(var(--border))' }} />

            {/* Quick tags */}
            <div>
              <SectionLabel>Como foi a mamada?</SectionLabel>
              <ChipGroup
                options={QUICK_TAGS.map(t => ({ value: t.id, label: t.label }))}
                values={obsTags}
                onToggle={id => setObsTags(p => p.includes(id) ? p.filter(t => t !== id) : [...p, id])}
                accentColor={FEED_COLOR}
                multiSelect
              />
            </div>

            {/* Observations */}
            <div>
              <SectionLabel>Observações</SectionLabel>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Como foi a mamada? Alguma observação..."
                className="ds-textarea"
                rows={3}
              />
            </div>

            <ReportToggle checked={includeInReport} onCheckedChange={setIncludeInReport} />

            {/* Discard — tertiary */}
            <button
              onClick={() => setPhase('suggest')}
              className="w-full py-2.5 text-[12px] font-semibold text-center text-muted-foreground font-nunito"
            >
              Cancelar
            </button>
          </motion.div>
        )}

        {/* ── ENDED ─────────────────────────────────────────────────── */}
        {phase === 'ended' && finishedData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* Summary card */}
            <div
              className="flex items-center gap-4 p-4 rounded-2xl"
              style={{
                backgroundColor: `color-mix(in srgb, ${FEED_COLOR} 8%, hsl(var(--card)))`,
                border: `1.5px solid color-mix(in srgb, ${FEED_COLOR} 22%, transparent)`,
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0"
                style={{ backgroundColor: `color-mix(in srgb, ${FEED_COLOR} 16%, transparent)` }}
              >
                🤱
              </div>
              <div>
                <p className="text-[14px] font-bold font-quicksand text-foreground leading-tight">
                  {finishedData.totalSec > 0 ? 'Sessão encerrada' : 'Registro manual'}
                </p>
                {finishedData.totalSec > 0 ? (
                  <p className="text-[13px] font-semibold mt-0.5 font-nunito" style={{ color: FEED_COLOR }}>
                    {[
                      finishedData.leftSec  > 0 ? `Esquerdo: ${fmtDurationShort(finishedData.leftSec)}`  : null,
                      finishedData.rightSec > 0 ? `Direito: ${fmtDurationShort(finishedData.rightSec)}` : null,
                      finishedData.switches > 0 ? `${finishedData.switches} troca${finishedData.switches > 1 ? 's' : ''}` : null,
                    ].filter(Boolean).join(' · ')}
                  </p>
                ) : (
                  <p className="text-[12px] mt-0.5 font-nunito text-muted-foreground">
                    Adicione observações se quiser
                  </p>
                )}
              </div>
            </div>

            {/* Quick tags */}
            <div>
              <SectionLabel>Como foi a mamada?</SectionLabel>
              <ChipGroup
                options={QUICK_TAGS.map(t => ({ value: t.id, label: t.label }))}
                values={obsTags}
                onToggle={id => setObsTags(p => p.includes(id) ? p.filter(t => t !== id) : [...p, id])}
                accentColor={FEED_COLOR}
                multiSelect
              />
            </div>

            {/* Divider */}
            <div className="h-px" style={{ backgroundColor: 'hsl(var(--border))' }} />

            {/* Observations */}
            <div>
              <SectionLabel>Observações</SectionLabel>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Como foi a mamada? Alguma observação..."
                className="ds-textarea"
                rows={3}
              />
            </div>

            {/* Medical report */}
            <ReportToggle checked={includeInReport} onCheckedChange={setIncludeInReport} />

            {/* Discard — tertiary */}
            <button
              onClick={handleConfirmDiscard}
              className="w-full py-2.5 text-[12px] font-semibold text-center text-muted-foreground font-nunito"
            >
              Descartar e voltar
            </button>
          </motion.div>
        )}
      </div>

      {/* DS Sticky CTA — only on suggest, manual and ended phases */}
      {phase === 'suggest' && (
        <StickyFooterCTA
          primaryLabel={`Iniciar — lado ${selectedSide === 'L' ? 'esquerdo' : 'direito'}`}
          onPrimary={handleStart}
          primaryColor={FEED_COLOR}
          primaryDisabled={!activeChildId}
        />
      )}
      {phase === 'manual' && (
        <StickyFooterCTA
          primaryLabel={saving ? 'Salvando...' : 'Registrar mamada'}
          onPrimary={handleSaveManual}
          primaryLoading={saving}
          primaryColor={FEED_COLOR}
        />
      )}
      {phase === 'ended' && (
        <StickyFooterCTA
          primaryLabel={saving ? 'Salvando...' : 'Salvar mamada'}
          onPrimary={handleSave}
          primaryLoading={saving}
          primaryColor={FEED_COLOR}
        />
      )}

      {/* Discard review guard — only shown in "ended" phase */}
      <AnimatePresence>
        {showBackConfirm && (
          <DiscardReviewSheet
            open
            durationSec={finishedData?.totalSec ?? 0}
            onStay={handleConfirmContinue}
            onDiscard={handleConfirmDiscard}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
