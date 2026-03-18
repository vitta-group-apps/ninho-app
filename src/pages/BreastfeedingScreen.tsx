/**
 * BreastfeedingScreen — Full-screen breastfeeding session flow.
 *
 * Route: /breastfeeding
 *
 * Session phases:
 *   suggest → session (ACTIVE/PAUSED) → ended → saved
 *
 * Safety: back button during active/paused shows a confirmation sheet.
 * No silent data loss.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { toast } from '@/hooks/use-toast';
import { makePayloadNotes, fmtTimer, fmtDurationShort } from '@/lib/routineUtils';

// ─── Constants ─────────────────────────────────────────────────────────────

export const FEED_SESSION_KEY = 'ninho_feed_session_v6';
const SAGE  = 'hsl(152,15%,55%)';
const font  = 'Nunito, sans-serif';

type Side = 'L' | 'R';
type SessionStatus = 'ACTIVE' | 'PAUSED' | 'FINISHED';
type Phase = 'suggest' | 'session' | 'ended';

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

// ─── Persistence ───────────────────────────────────────────────────────────

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

// ─── Sub-components ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wider mb-2"
      style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
      {children}
    </p>
  );
}

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
      className="flex-1 rounded-3xl p-4 text-center transition-all duration-200 select-none"
      style={{
        backgroundColor: active ? `${SAGE}18` : 'hsl(var(--muted))',
        border: active ? `2px solid ${SAGE}50` : '2px solid transparent',
        opacity: active ? 1 : 0.5,
        transform: active ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center text-lg font-bold"
        style={{
          backgroundColor: active ? `${SAGE}25` : 'hsl(var(--border))',
          color: active ? SAGE : 'hsl(var(--muted-foreground))',
        }}>
        {arrow}
      </div>
      <p className="text-[11px] mt-2 font-bold uppercase tracking-wide"
        style={{ color: active ? SAGE : 'hsl(var(--muted-foreground))', fontFamily: font }}>
        {label}
      </p>
      {/* Timer — stable height to prevent layout shift */}
      <div className="h-9 flex items-center justify-center mt-1">
        <p className="text-2xl font-bold tabular-nums"
          style={{ color: active ? SAGE : 'hsl(var(--muted-foreground))', fontFamily: 'Quicksand, sans-serif' }}>
          {fmtTimer(Math.floor(totalMs / 1000))}
        </p>
      </div>
      {/* Status label — always occupies space to prevent height jump */}
      <div className="h-5 flex items-center justify-center gap-1 mt-1">
        {showPulse && <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: SAGE }} />}
        <span className="text-[10px] font-semibold"
          style={{
            color: active ? SAGE : 'transparent',
            fontFamily: font,
          }}>
          {active && status === 'ACTIVE' ? 'ativo' : active && status === 'PAUSED' ? 'pausado' : '\u00A0'}
        </span>
      </div>
    </button>
  );
}

/** Back-navigation confirmation sheet */
function BackConfirmSheet({
  open, durationSec,
  onContinue, onSaveReview, onDiscard,
}: {
  open: boolean;
  durationSec: number;
  onContinue: () => void;
  onSaveReview: () => void;
  onDiscard: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onContinue}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        className="w-full max-w-md rounded-t-3xl px-5 pb-safe pt-6 space-y-3"
        style={{ backgroundColor: 'hsl(var(--card))' }}
        onClick={e => e.stopPropagation()}
      >
        <p className="text-base font-bold text-center"
          style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
          Sessão em andamento
        </p>
        <p className="text-sm text-center pb-1"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
          {durationSec >= 60
            ? `Você tem ${fmtDurationShort(durationSec)} registrados.`
            : 'Sessão muito curta. O que deseja fazer?'}
        </p>
        <div className="space-y-2 pb-4">
          <button onClick={onContinue}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-center transition-all active:scale-95"
            style={{ backgroundColor: SAGE, color: 'white', fontFamily: font }}>
            Continuar sessão
          </button>
          {durationSec >= 30 && (
            <button onClick={onSaveReview}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-center transition-all active:scale-95"
              style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--ninho-brown))', fontFamily: font }}>
              Encerrar e revisar
            </button>
          )}
          <button onClick={onDiscard}
            className="w-full py-2 text-xs font-semibold text-center"
            style={{ color: 'hsl(var(--destructive))', fontFamily: font }}>
            Descartar sessão
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function BreastfeedingScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeChildId, activeChild } = useActiveChild();

  const [phase, setPhase] = useState<Phase>('suggest');
  const [selectedSide, setSelectedSide] = useState<Side>('L');
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  // Timer state
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('ACTIVE');
  const [sessionStartEpoch, setSessionStartEpoch] = useState(0);
  const [activeSide, setActiveSide] = useState<Side>('L');
  const [switchCount, setSwitchCount] = useState(0);
  const sideTimesRef  = useRef<SideTimes>({ L: 0, R: 0 });
  const segmentStart  = useRef<number | null>(null);
  const activeSideRef = useRef<Side>('L');
  const [, forceRender] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ended review state
  const [finishedData, setFinishedData] = useState<FinishedData | null>(null);
  const [obsTags, setObsTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Load existing session on mount ────────────────────────────────────────
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
        if (existing.segmentStartEpoch) {
          segmentStart.current = existing.segmentStartEpoch;
        }
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

  // ── Session actions ────────────────────────────────────────────────────────

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
      end:   new Date(),
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
      if (obsTags.length > 0)  payload.tags = obsTags.join(',');
      if (includeInReport)     payload.include_in_report = true;

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

  // ── Back navigation ────────────────────────────────────────────────────────

  function handleBack() {
    if (phase === 'session') {
      setShowBackConfirm(true);
    } else if (phase === 'ended') {
      // Already cleared session — ask before losing review state
      setShowBackConfirm(true);
    } else {
      navigate(-1);
    }
  }

  function handleConfirmContinue() {
    setShowBackConfirm(false);
  }

  function handleConfirmSaveReview() {
    setShowBackConfirm(false);
    if (phase === 'session') handleEnd();
    // If already in ended, just close confirm
  }

  function handleConfirmDiscard() {
    clearFeedSession();
    navigate(-1);
  }

  const display = getDisplay();
  const totalSec = getCurrentTotalSec();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-5 flex items-center gap-3"
        style={{
          paddingTop: 'max(52px, env(safe-area-inset-top))',
          paddingBottom: '16px',
          backgroundColor: 'hsl(var(--card))',
          borderBottom: '1px solid hsl(var(--border))',
        }}>
        <button onClick={handleBack}
          className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90"
          style={{ backgroundColor: 'hsl(var(--muted))' }}>
          <ArrowLeftIcon className="w-5 h-5" style={{ color: 'hsl(var(--ninho-brown))' }} />
        </button>
        <div className="min-w-0">
          <p className="text-lg font-bold leading-tight truncate"
            style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
            Amamentação
          </p>
          {activeChild && (
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
              {activeChild.name}
            </p>
          )}
        </div>
        {/* Session status pill */}
        {phase === 'session' && (
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full flex-shrink-0"
            style={{ backgroundColor: sessionStatus === 'ACTIVE' ? `${SAGE}15` : 'hsl(var(--muted))' }}>
            {sessionStatus === 'ACTIVE' && (
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: SAGE }} />
            )}
            <span className="text-[11px] font-bold"
              style={{ color: sessionStatus === 'ACTIVE' ? SAGE : 'hsl(var(--muted-foreground))', fontFamily: font }}>
              {sessionStatus === 'ACTIVE' ? 'Em andamento' : 'Pausada'}
            </span>
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6"
        style={{ paddingBottom: 'max(96px, calc(env(safe-area-inset-bottom) + 96px))' }}>

        {/* ── SUGGEST phase ──────────────────────────────────────────────── */}
        {phase === 'suggest' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6 pt-6">
            <div className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${SAGE}18`, border: `2px dashed ${SAGE}40` }}>
              <span className="text-5xl">🤱</span>
            </div>
            <div className="text-center">
              <p className="text-base font-bold"
                style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
                Pronta para mamar?
              </p>
              <p className="text-sm mt-1"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
                Escolha o lado e inicie o cronômetro
              </p>
            </div>
            <div className="w-full">
              <SectionLabel>Por qual lado começar?</SectionLabel>
              <div className="flex gap-3">
                {(['L', 'R'] as Side[]).map(s => (
                  <SideCard key={s} side={s}
                    active={selectedSide === s}
                    totalMs={0}
                    status="ACTIVE"
                    onClick={() => setSelectedSide(s)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── SESSION phase ──────────────────────────────────────────────── */}
        {phase === 'session' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Total timer — large and prominent */}
            <div className="flex flex-col items-center py-4 px-4 rounded-2xl"
              style={{ backgroundColor: 'hsl(var(--card))', border: `1.5px solid ${SAGE}30` }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-1"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
                Tempo total
              </p>
              <p className="text-5xl font-bold tabular-nums"
                style={{ color: SAGE, fontFamily: 'Quicksand, sans-serif' }}>
                {fmtTimer(Math.floor(display.total / 1000))}
              </p>
            </div>

            {/* Side cards — tap to switch */}
            <div>
              <SectionLabel>
                {sessionStatus === 'ACTIVE' ? 'Toque no lado para alternar' : 'Sessão pausada'}
              </SectionLabel>
              <div className="flex gap-3">
                {(['L', 'R'] as Side[]).map(s => (
                  <SideCard key={s} side={s}
                    active={activeSide === s}
                    totalMs={display[s]}
                    status={sessionStatus}
                    onClick={sessionStatus === 'ACTIVE' ? handleSwitch : undefined}
                  />
                ))}
              </div>
              {switchCount > 0 && (
                <p className="text-center text-xs mt-2"
                  style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
                  {switchCount} troca{switchCount > 1 ? 's' : ''} de lado
                </p>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              {sessionStatus === 'ACTIVE' ? (
                <button onClick={handlePause}
                  className="flex-1 py-4 rounded-2xl text-sm font-bold transition-all active:scale-95"
                  style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--ninho-brown))', fontFamily: font }}>
                  ⏸ Pausar
                </button>
              ) : (
                <button onClick={handleResume}
                  className="flex-1 py-4 rounded-2xl text-sm font-bold transition-all active:scale-95"
                  style={{ backgroundColor: `${SAGE}15`, color: SAGE, border: `1.5px solid ${SAGE}40`, fontFamily: font }}>
                  ▶ Continuar
                </button>
              )}
              <button onClick={handleEnd}
                className="flex-1 py-4 rounded-2xl text-sm font-bold transition-all active:scale-95"
                style={{ backgroundColor: SAGE, color: 'white', fontFamily: font }}>
                ⏹ Encerrar
              </button>
            </div>
          </motion.div>
        )}

        {/* ── ENDED phase — review before saving ────────────────────────── */}
        {phase === 'ended' && finishedData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-6">

            {/* Summary */}
            <div className="flex items-center gap-3 px-4 py-4 rounded-2xl"
              style={{ backgroundColor: `${SAGE}12`, border: `1.5px solid ${SAGE}30` }}>
              <span className="text-3xl">🤱</span>
              <div>
                <p className="text-sm font-bold"
                  style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
                  Sessão encerrada
                </p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: SAGE, fontFamily: font }}>
                  {[
                    finishedData.leftSec  > 0 ? `E: ${fmtDurationShort(finishedData.leftSec)}`  : null,
                    finishedData.rightSec > 0 ? `D: ${fmtDurationShort(finishedData.rightSec)}` : null,
                    finishedData.switches > 0
                      ? `${finishedData.switches} troca${finishedData.switches > 1 ? 's' : ''}` : null,
                  ].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>

            {/* Quick tags */}
            <div>
              <SectionLabel>Como foi a mamada?</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {QUICK_TAGS.map(tag => {
                  const active = obsTags.includes(tag.id);
                  return (
                    <button key={tag.id}
                      onClick={() => setObsTags(p => active ? p.filter(t => t !== tag.id) : [...p, tag.id])}
                      className="py-2 px-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
                      style={{
                        backgroundColor: active ? `${SAGE}20` : 'hsl(var(--card))',
                        color: active ? SAGE : 'hsl(var(--ninho-brown))',
                        border: `1.5px solid ${active ? `${SAGE}50` : 'hsl(var(--border))'}`,
                        fontFamily: font,
                      }}>
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Observations */}
            <div>
              <SectionLabel>Observações</SectionLabel>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Como foi a mamada? Alguma observação..."
                className="rounded-2xl border-border resize-none"
                rows={3}
                style={{ fontFamily: font, minHeight: '80px' }}
              />
            </div>

            {/* Medical report toggle */}
            <div className="flex items-center justify-between px-4 py-4 rounded-2xl"
              style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <div>
                <p className="text-sm font-semibold leading-tight"
                  style={{ color: 'hsl(var(--ninho-brown))', fontFamily: font }}>
                  Incluir no relatório médico
                </p>
                <p className="text-xs mt-0.5"
                  style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
                  Aparecerá no próximo relatório gerado
                </p>
              </div>
              <Switch checked={includeInReport} onCheckedChange={setIncludeInReport} />
            </div>
          </motion.div>
        )}
      </div>

      {/* Fixed footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center"
        style={{
          padding: '16px 20px',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          backgroundColor: 'hsl(var(--card))',
          borderTop: '1px solid hsl(var(--border))',
        }}>
        <div className="w-full max-w-md">
          {phase === 'suggest' && (
            <button onClick={handleStart}
              className="w-full py-4 rounded-2xl text-sm font-bold transition-all active:scale-95"
              style={{ backgroundColor: SAGE, color: 'white', fontFamily: font }}>
              ▶ Iniciar mamada — lado {selectedSide === 'L' ? 'esquerdo' : 'direito'}
            </button>
          )}
          {phase === 'session' && (
            <button onClick={handleEnd}
              className="w-full py-4 rounded-2xl text-sm font-bold transition-all active:scale-95"
              style={{ backgroundColor: SAGE, color: 'white', fontFamily: font }}>
              ⏹ Encerrar e revisar
            </button>
          )}
          {phase === 'ended' && (
            <button onClick={handleSave} disabled={saving}
              className="w-full py-4 rounded-2xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: SAGE, color: 'white', fontFamily: font }}>
              {saving ? 'Salvando...' : 'Salvar mamada'}
            </button>
          )}
        </div>
      </div>

      {/* Back nav confirmation */}
      <AnimatePresence>
        {showBackConfirm && (
          <BackConfirmSheet
            open
            durationSec={phase === 'ended' ? (finishedData?.totalSec ?? 0) : totalSec}
            onContinue={handleConfirmContinue}
            onSaveReview={handleConfirmSaveReview}
            onDiscard={handleConfirmDiscard}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
