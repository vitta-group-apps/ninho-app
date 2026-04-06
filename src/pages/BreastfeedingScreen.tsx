/**
 * BreastfeedingScreen — Gold-standard full-screen breastfeeding flow.
 *
 * Phases:
 *  1. suggest  — side select + secondary actions (Registrar manualmente / Mamadeira)
 *  2. session  — large total timer + side cards + pause/end controls
 *  3. ended    — review form (tags, notes, report toggle) + save/discard
 *
 * Contrato novo:
 *  - payload estruturado em routine_logs.payload
 *  - notes é texto humano
 *  - sem JSON serializado em notes
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { toast } from '@/hooks/use-toast';
import { fmtTimer, fmtDurationShort } from '@/lib/routineUtils';
import { BREASTFEEDING_QUICK_TAGS } from '@/lib/eventSystem';
import { serializeRoutinePayload } from '@/lib/adapters/routineAdapters';
import {
  ScreenHeader,
  StickyFooterCTA,
  SectionLabel,
  ChipGroup,
  ReportToggle,
  InlineStatusPill,
} from '@/components/ds';

// ── Cores fixas ──
const FEED_COLOR = '#789687';
const FEED_BG = '#ebf0ed';
const FEED_LIGHT = '#f0f5f2';
const FEED_BORDER = '#ccd9d3';
const CARD_BG = '#ffffff';
const CARD_BORDER = '#E5E0D8';
const MUTED_BG = '#E8E8E2';
const PAGE_BG = '#F8F5F0';
const TXT = '#2C2C2C';
const TXT_MUTED = '#7A7A7A';
const DANGER = '#C04A4A';

export const FEED_SESSION_KEY = 'ninho_feed_session_v7';

type Side = 'L' | 'R';
type SessionStatus = 'ACTIVE' | 'PAUSED' | 'FINISHED';
type Phase = 'suggest' | 'session' | 'ended' | 'manual';

interface SideTimes {
  L: number;
  R: number;
}

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



function timeToMinutes(time: string) {
  if (!time || !time.includes(':')) return null;
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function minutesToTime(totalMinutes: number) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// ── Persistence ──
export function saveFeedSession(data: FeedSession) {
  try {
    localStorage.setItem(FEED_SESSION_KEY, JSON.stringify(data));
  } catch {
    // noop
  }
}

export function clearFeedSession() {
  localStorage.removeItem(FEED_SESSION_KEY);
  localStorage.removeItem('ninho_feed_session_v6');
  localStorage.removeItem('ninho_feed_session_v4');
  localStorage.removeItem('ninho_feed_session');
}

export function loadFeedSession(): FeedSession | null {
  try {
    const raw = localStorage.getItem(FEED_SESSION_KEY);
    return raw ? (JSON.parse(raw) as FeedSession) : null;
  } catch {
    return null;
  }
}

// ── SideCard ──
function SideCard({
  side,
  active,
  totalMs,
  status,
  onClick,
}: {
  side: Side;
  active: boolean;
  totalMs: number;
  status: SessionStatus;
  onClick?: () => void;
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
        backgroundColor: active ? FEED_BG : MUTED_BG,
        border: `2px solid ${active ? FEED_BORDER : 'transparent'}`,
        opacity: active ? 1 : 0.55,
        boxShadow: active ? `0 2px 10px rgba(120,150,135,0.18)` : 'none',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div
        className="w-11 h-11 rounded-full mx-auto flex items-center justify-center text-[18px] font-bold"
        style={{
          backgroundColor: active ? FEED_LIGHT : CARD_BORDER,
          color: active ? FEED_COLOR : TXT_MUTED,
        }}
      >
        {arrow}
      </div>

      <p
        className="text-[11px] mt-2.5 font-bold uppercase tracking-[0.06em] font-nunito"
        style={{ color: active ? FEED_COLOR : TXT_MUTED }}
      >
        {label}
      </p>

      <div className="h-10 flex items-center justify-center mt-1">
        <p
          className="text-[28px] font-bold tabular-nums font-quicksand leading-none"
          style={{ color: active ? FEED_COLOR : TXT_MUTED }}
        >
          {fmtTimer(Math.floor(totalMs / 1000))}
        </p>
      </div>

      <div className="h-5 flex items-center justify-center gap-1.5 mt-1">
        {showPulse && (
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: FEED_COLOR }}
          />
        )}
        <span
          className="text-[10px] font-semibold font-nunito"
          style={{ color: active ? FEED_COLOR : 'transparent' }}
        >
          {active && status === 'ACTIVE'
            ? 'ativo'
            : active && status === 'PAUSED'
            ? 'pausado'
            : '\u00A0'}
        </span>
      </div>
    </button>
  );
}

// ── DiscardReviewSheet ──
function DiscardReviewSheet({
  open,
  durationSec,
  onStay,
  onDiscard,
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
        className="w-full max-w-md rounded-t-3xl px-5 pt-6 space-y-3"
        style={{
          backgroundColor: CARD_BG,
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        }}
        onClick={e => e.stopPropagation()}
      >
        <p className="text-base font-bold text-center font-quicksand" style={{ color: TXT }}>
          Descartar o registro?
        </p>
        <p className="text-sm text-center pb-1 font-nunito" style={{ color: TXT_MUTED }}>
          {durationSec >= 60
            ? `Você tem ${fmtDurationShort(durationSec)} registrados. Esses dados serão perdidos.`
            : 'A revisão será descartada. Tem certeza?'}
        </p>
        <div className="space-y-2 pb-2">
          <button
            onClick={onStay}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-center transition-all active:scale-95 font-nunito text-white"
            style={{ backgroundColor: FEED_COLOR, border: 'none', cursor: 'pointer' }}
          >
            Continuar e salvar
          </button>
          <button
            onClick={onDiscard}
            className="w-full py-2 text-xs font-semibold text-center font-nunito"
            style={{ color: DANGER, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Descartar e voltar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Component ──
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

  const sideTimesRef = useRef<SideTimes>({ L: 0, R: 0 });
  const segmentStart = useRef<number | null>(null);
  const activeSideRef = useRef<Side>('L');
  const [, forceRender] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [finishedData, setFinishedData] = useState<FinishedData | null>(null);
  const [obsTags, setObsTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);
  const [saving, setSaving] = useState(false);

  const [manualSide, setManualSide] = useState<'L' | 'R' | 'both'>('L');
  const [manualDurationMin, setManualDurationMin] = useState('');
  const [manualStartTime, setManualStartTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
  });
  const [manualEndTime, setManualEndTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
  });

  function handleManualStartTimeChange(value: string) {
    setManualStartTime(value);

    const duration = Number(manualDurationMin);
    const startMin = timeToMinutes(value);

    if (startMin !== null && duration > 0) {
      setManualEndTime(minutesToTime(startMin + duration));
    }
  }

  function handleManualEndTimeChange(value: string) {
    setManualEndTime(value);

    const endMin = timeToMinutes(value);
    const startMin = timeToMinutes(manualStartTime);
    const duration = Number(manualDurationMin);

    if (endMin !== null && startMin !== null) {
      const diff = endMin - startMin;
      const adjustedDiff = diff >= 0 ? diff : diff + 1440;
      setManualDurationMin(String(adjustedDiff));
      return;
    }

    if (endMin !== null && duration > 0) {
      setManualStartTime(minutesToTime(endMin - duration));
    }
  }

  function handleManualDurationChange(value: string) {
    setManualDurationMin(value);

    const duration = Number(value);
    const startMin = timeToMinutes(manualStartTime);
    const endMin = timeToMinutes(manualEndTime);

    if (!(duration > 0)) return;

    if (startMin !== null) {
      setManualEndTime(minutesToTime(startMin + duration));
      return;
    }

    if (endMin !== null) {
      setManualStartTime(minutesToTime(endMin - duration));
    }
  }

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
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  useEffect(() => () => stopTicker(), []);

  function getDisplay() {
    const nowMs =
      segmentStart.current !== null && sessionStatus === 'ACTIVE'
        ? Date.now() - segmentStart.current
        : 0;

    const L = sideTimesRef.current.L + (activeSideRef.current === 'L' ? nowMs : 0);
    const R = sideTimesRef.current.R + (activeSideRef.current === 'R' ? nowMs : 0);

    return { L, R, total: L + R };
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
    setSwitchCount(current => current + 1);
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
      leftSec: Math.floor(sideTimesRef.current.L / 1000),
      rightSec: Math.floor(sideTimesRef.current.R / 1000),
      switches: switchCount,
      start: new Date(sessionStartEpoch),
      end: new Date(),
      lastSide: activeSideRef.current,
    });

    setPhase('ended');
    clearFeedSession();
  }

  function handleBack() {
    if (phase === 'ended' || phase === 'manual') {
      setShowBackConfirm(true);
    } else {
      navigate(-1);
    }
  }

  const display = getDisplay();
  const totalSec = Math.floor(display.total / 1000);

  const statusPill =
    phase === 'session' ? (
      <InlineStatusPill
        label={sessionStatus === 'ACTIVE' ? 'Em andamento' : 'Pausada'}
        variant={sessionStatus === 'ACTIVE' ? 'active' : 'paused'}
        color={FEED_COLOR}
      />
    ) : null;

  async function handleSave() {
    if (!user || !activeChildId || !finishedData) return;

    setSaving(true);

    try {
      const payload = serializeRoutinePayload('feed', {
        mode: 'breastfeeding',
        side:
          finishedData.leftSec > 0 && finishedData.rightSec > 0
            ? 'both'
            : finishedData.lastSide === 'L'
            ? 'left'
            : 'right',
        left_seconds: finishedData.leftSec,
        right_seconds: finishedData.rightSec,
        total_seconds: finishedData.totalSec,
        switches: finishedData.switches,
        tags: obsTags.length > 0 ? obsTags : null,
        include_in_report: includeInReport,
      });

      const { error } = await supabase.from('routine_logs').insert([{
        child_id: activeChildId,
        author_id: user.id,
        type: 'feed' as const,
        start_time: finishedData.start.toISOString(),
        end_time: finishedData.end.toISOString(),
        notes: notes.trim() || null,
        payload: payload as unknown as import('@/integrations/supabase/types').Json,
      }]);

      if (error) throw error;

      toast({ title: '🤱 Amamentação registrada' });
      navigate(-1);
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

  async function handleSaveManual() {
    if (!user || !activeChildId) return;

    setSaving(true);

    try {
      const now = new Date();

      const [startHours, startMinutes] = manualStartTime.split(':').map(Number);
      const [endHours, endMinutes] = manualEndTime.split(':').map(Number);

      const startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        startHours,
        startMinutes,
        0
      );

      let endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        endHours,
        endMinutes,
        0
      );

      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }

      const totalSeconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);

      if (totalSeconds <= 0) {
        throw new Error('O horário de fim precisa ser maior que o de início.');
      }

      const sideMap: Record<'L' | 'R' | 'both', { left: number; right: number; side: 'left' | 'right' | 'both' }> = {
        L: { left: totalSeconds, right: 0, side: 'left' },
        R: { left: 0, right: totalSeconds, side: 'right' },
        both: {
          left: Math.floor(totalSeconds / 2),
          right: Math.ceil(totalSeconds / 2),
          side: 'both',
        },
      };

      const { left, right, side } = sideMap[manualSide];

      const payload = serializeRoutinePayload('feed', {
        mode: 'manual',
        side,
        left_seconds: left,
        right_seconds: right,
        total_seconds: totalSeconds,
        switches: manualSide === 'both' ? 1 : 0,
        tags: obsTags.length > 0 ? obsTags : null,
        include_in_report: includeInReport,
      });

      const { error } = await supabase.from('routine_logs').insert([{
        child_id: activeChildId,
        author_id: user.id,
        type: 'feed' as const,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        notes: notes.trim() || null,
        payload: payload as unknown as import('@/integrations/supabase/types').Json,
      }]);

      if (error) throw error;

      toast({ title: '🤱 Amamentação registrada' });
      navigate(-1);
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

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: PAGE_BG }}>
      <ScreenHeader
        title="Amamentação"
        childName={activeChild?.name}
        onBack={handleBack}
        statusSlot={statusPill}
      />

      <div className="ds-form-body">
        {phase === 'suggest' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6 pt-4"
          >
            <div>
              <SectionLabel>Escolha o lado para iniciar</SectionLabel>
              <div className="flex gap-3">
                {(['L', 'R'] as Side[]).map(side => (
                  <SideCard
                    key={side}
                    side={side}
                    active={selectedSide === side}
                    totalMs={0}
                    status="ACTIVE"
                    onClick={() => setSelectedSide(side)}
                  />
                ))}
              </div>
            </div>

            <div
              className="flex flex-col gap-2 pt-2"
              style={{ borderTop: `1px solid ${CARD_BORDER}` }}
            >
              <p
                className="text-[11px] font-bold uppercase tracking-[0.08em] font-nunito mb-1"
                style={{ color: TXT_MUTED }}
              >
                Outras opções
              </p>

              <button
                onClick={() => navigate('/bottle')}
                className="w-full py-3 rounded-2xl text-[13px] font-semibold font-nunito text-center transition-all active:scale-95"
                style={{
                  backgroundColor: MUTED_BG,
                  color: TXT,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                🍼 Mamadeira ou fórmula
              </button>

              <button
                onClick={() => {
                  const now = new Date();
                  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(
                    now.getMinutes()
                  ).padStart(2, '0')}`;
                  setManualStartTime(nowTime);
                  setManualEndTime(nowTime);
                  setManualDurationMin('');
                  setManualSide('L');
                  setPhase('manual');
                }}
                className="w-full py-2.5 text-[12px] font-semibold font-nunito text-center"
                style={{
                  color: TXT_MUTED,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Registrar sem cronômetro
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'session' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div
              className="flex flex-col items-center py-6 px-4 rounded-2xl"
              style={{ backgroundColor: FEED_BG, border: `1.5px solid ${FEED_BORDER}` }}
            >
              <p
                className="text-[11px] font-bold uppercase tracking-[0.08em] mb-2 font-nunito"
                style={{ color: TXT_MUTED }}
              >
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
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: FEED_COLOR }}
                  />
                  <p
                    className="text-[11px] font-semibold font-nunito"
                    style={{ color: FEED_COLOR }}
                  >
                    Sessão em andamento
                  </p>
                </div>
              )}

              {sessionStatus === 'PAUSED' && (
                <p
                  className="text-[11px] font-semibold font-nunito mt-2"
                  style={{ color: TXT_MUTED }}
                >
                  Sessão pausada
                </p>
              )}
            </div>

            <div>
              <SectionLabel>
                {sessionStatus === 'ACTIVE'
                  ? 'Toque no lado para alternar'
                  : 'Sessão pausada — retome para continuar'}
              </SectionLabel>
              <div className="flex gap-3">
                {(['L', 'R'] as Side[]).map(side => (
                  <SideCard
                    key={side}
                    side={side}
                    active={activeSide === side}
                    totalMs={display[side]}
                    status={sessionStatus}
                    onClick={sessionStatus === 'ACTIVE' ? handleSwitch : undefined}
                  />
                ))}
              </div>

              {switchCount > 0 && (
                <p
                  className="text-center text-[12px] mt-2 font-nunito"
                  style={{ color: TXT_MUTED }}
                >
                  {switchCount} troca{switchCount > 1 ? 's' : ''} de lado
                </p>
              )}
            </div>

            <button
              onClick={sessionStatus === 'ACTIVE' ? handleSwitch : undefined}
              disabled={sessionStatus !== 'ACTIVE'}
              className="w-full py-3.5 rounded-2xl text-[13px] font-bold font-nunito transition-all active:scale-95"
              style={{
                backgroundColor: sessionStatus === 'ACTIVE' ? FEED_LIGHT : MUTED_BG,
                color: sessionStatus === 'ACTIVE' ? FEED_COLOR : TXT_MUTED,
                border: `1.5px solid ${
                  sessionStatus === 'ACTIVE' ? FEED_BORDER : 'transparent'
                }`,
                opacity: sessionStatus === 'ACTIVE' ? 1 : 0.45,
                cursor: sessionStatus === 'ACTIVE' ? 'pointer' : 'default',
              }}
            >
              ⇄ Trocar de lado
            </button>

            <div className="flex gap-3">
              {sessionStatus === 'ACTIVE' ? (
                <button
                  onClick={handlePause}
                  className="flex-1 py-4 rounded-2xl text-[14px] font-bold font-nunito transition-all active:scale-95"
                  style={{
                    backgroundColor: MUTED_BG,
                    color: TXT,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Pausar
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  className="flex-1 py-4 rounded-2xl text-[14px] font-bold font-nunito transition-all active:scale-95"
                  style={{
                    backgroundColor: FEED_LIGHT,
                    color: FEED_COLOR,
                    border: `1.5px solid ${FEED_BORDER}`,
                    cursor: 'pointer',
                  }}
                >
                  Continuar
                </button>
              )}

              <button
                onClick={handleEnd}
                className="flex-1 py-4 rounded-2xl text-[14px] font-bold font-nunito transition-all active:scale-95 text-white"
                style={{
                  backgroundColor: FEED_COLOR,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Encerrar
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'manual' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ backgroundColor: FEED_BG, border: `1.5px solid ${FEED_BORDER}` }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0"
                style={{ backgroundColor: FEED_LIGHT }}
              >
                🤱
              </div>
              <div>
                <p
                  className="text-[14px] font-bold font-quicksand leading-tight"
                  style={{ color: TXT }}
                >
                  Registro manual
                </p>
                <p className="text-[12px] font-nunito mt-0.5" style={{ color: TXT_MUTED }}>
                  Preencha os dados da mamada
                </p>
              </div>
            </div>

            <div>
              <SectionLabel>Qual lado?</SectionLabel>
              <div className="flex gap-3">
                {([
                  { val: 'L', label: 'Esquerdo', arrow: '←' },
                  { val: 'R', label: 'Direito', arrow: '→' },
                  { val: 'both', label: 'Ambos', arrow: '⇄' },
                ] as { val: 'L' | 'R' | 'both'; label: string; arrow: string }[]).map(opt => {
                  const isActive = manualSide === opt.val;

                  return (
                    <button
                      key={opt.val}
                      onClick={() => setManualSide(opt.val)}
                      className="flex-1 flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl font-bold transition-all active:scale-95 font-nunito"
                      style={{
                        backgroundColor: isActive ? FEED_BG : CARD_BG,
                        border: `2px solid ${isActive ? FEED_COLOR : CARD_BORDER}`,
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        className="text-[20px] font-bold"
                        style={{ color: isActive ? FEED_COLOR : TXT_MUTED }}
                      >
                        {opt.arrow}
                      </span>
                      <p
                        className="text-[11px] font-bold"
                        style={{ color: isActive ? FEED_COLOR : TXT }}
                      >
                        {opt.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <SectionLabel>Duração (minutos)</SectionLabel>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="120"
                placeholder="ex: 15"
                value={manualDurationMin}
                onChange={e => handleManualDurationChange(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl text-[15px] font-semibold font-nunito outline-none"
                style={{
                  backgroundColor: MUTED_BG,
                  border: `1.5px solid ${CARD_BORDER}`,
                  color: TXT,
                }}
              />
            </div>

            <div>
              <SectionLabel>Horários</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p
                    className="text-[11px] font-bold uppercase tracking-[0.06em] font-nunito mb-2"
                    style={{ color: TXT_MUTED }}
                  >
                    Início
                  </p>
                  <input
                    type="time"
                    value={manualStartTime}
                    onChange={e => handleManualStartTimeChange(e.target.value)}
                    className="w-full h-12 px-4 rounded-2xl text-[15px] font-semibold font-nunito outline-none"
                    style={{
                      backgroundColor: MUTED_BG,
                      border: `1.5px solid ${CARD_BORDER}`,
                      color: TXT,
                    }}
                  />
                </div>

                <div>
                  <p
                    className="text-[11px] font-bold uppercase tracking-[0.06em] font-nunito mb-2"
                    style={{ color: TXT_MUTED }}
                  >
                    Fim
                  </p>
                  <input
                    type="time"
                    value={manualEndTime}
                    onChange={e => handleManualEndTimeChange(e.target.value)}
                    className="w-full h-12 px-4 rounded-2xl text-[15px] font-semibold font-nunito outline-none"
                    style={{
                      backgroundColor: MUTED_BG,
                      border: `1.5px solid ${CARD_BORDER}`,
                      color: TXT,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="h-px" style={{ backgroundColor: CARD_BORDER }} />

            <div>
              <SectionLabel>Como foi a mamada?</SectionLabel>
              <ChipGroup
                options={BREASTFEEDING_QUICK_TAGS.map(t => ({ value: t.id, label: t.label }))}
                values={obsTags}
                onToggle={id =>
                  setObsTags(prev =>
                    prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
                  )
                }
                accentColor={FEED_COLOR}
                multiSelect
              />
            </div>

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

            <ReportToggle
              checked={includeInReport}
              onCheckedChange={setIncludeInReport}
            />
          </motion.div>
        )}

        {phase === 'ended' && finishedData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div
              className="p-4 rounded-2xl"
              style={{ backgroundColor: FEED_BG, border: `1.5px solid ${FEED_BORDER}` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] flex-shrink-0"
                  style={{ backgroundColor: FEED_LIGHT }}
                >
                  🤱
                </div>
                <div>
                  <p
                    className="text-[14px] font-bold font-quicksand leading-tight"
                    style={{ color: TXT }}
                  >
                    Amamentação encerrada
                  </p>
                  <p className="text-[12px] font-nunito" style={{ color: TXT_MUTED }}>
                    Revise e salve o registro abaixo
                  </p>
                </div>
              </div>

              {finishedData.totalSec > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: 'Esquerdo',
                      value:
                        finishedData.leftSec > 0
                          ? fmtDurationShort(finishedData.leftSec)
                          : '—',
                    },
                    {
                      label: 'Direito',
                      value:
                        finishedData.rightSec > 0
                          ? fmtDurationShort(finishedData.rightSec)
                          : '—',
                    },
                    { label: 'Trocas', value: `${finishedData.switches}` },
                  ].map(stat => (
                    <div
                      key={stat.label}
                      className="rounded-xl px-2 py-2.5 text-center"
                      style={{ backgroundColor: FEED_LIGHT }}
                    >
                      <p
                        className="text-[15px] font-bold font-quicksand"
                        style={{ color: FEED_COLOR }}
                      >
                        {stat.value}
                      </p>
                      <p
                        className="text-[10px] font-bold uppercase tracking-wide font-nunito mt-0.5"
                        style={{ color: TXT_MUTED }}
                      >
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <SectionLabel>Observações rápidas</SectionLabel>
              <ChipGroup
                options={BREASTFEEDING_QUICK_TAGS.map(t => ({ value: t.id, label: t.label }))}
                values={obsTags}
                onToggle={id =>
                  setObsTags(prev =>
                    prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
                  )
                }
                accentColor={FEED_COLOR}
                multiSelect
              />
            </div>

            <div className="h-px" style={{ backgroundColor: CARD_BORDER }} />

            <div>
              <SectionLabel>Anotações (opcional)</SectionLabel>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Alguma observação sobre essa mamada..."
                className="ds-textarea"
                rows={3}
              />
            </div>

            <ReportToggle
              checked={includeInReport}
              onCheckedChange={setIncludeInReport}
            />
          </motion.div>
        )}
      </div>

      {phase === 'suggest' && (
        <StickyFooterCTA
          primaryLabel={`Iniciar — lado ${
            selectedSide === 'L' ? 'esquerdo' : 'direito'
          }`}
          onPrimary={handleStart}
          primaryColor={FEED_COLOR}
          primaryDisabled={!activeChildId}
        />
      )}

      {phase === 'manual' && (
        <StickyFooterCTA
          primaryLabel="Salvar registro"
          onPrimary={handleSaveManual}
          primaryLoading={saving}
          primaryColor={FEED_COLOR}
          primaryDisabled={!manualStartTime || !manualEndTime || !manualDurationMin}
          tertiaryLabel="Cancelar"
          onTertiary={() => setPhase('suggest')}
        />
      )}

      {phase === 'ended' && (
        <StickyFooterCTA
          primaryLabel="Salvar registro"
          onPrimary={handleSave}
          primaryLoading={saving}
          primaryColor={FEED_COLOR}
          tertiaryLabel="Descartar e voltar"
          onTertiary={() => {
            clearFeedSession();
            navigate(-1);
          }}
        />
      )}

      <AnimatePresence>
        {showBackConfirm && (
          <DiscardReviewSheet
            open
            durationSec={finishedData?.totalSec ?? totalSec}
            onStay={() => setShowBackConfirm(false)}
            onDiscard={() => {
              clearFeedSession();
              navigate(-1);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
