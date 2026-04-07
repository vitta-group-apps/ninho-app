/**
 * SleepScreen — Full-screen sleep session flow.
 *
 * Phases: idle → active → paused → ended (review) → saved
 *         idle → manual (registro sem cronômetro)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '../components/ui/textarea';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';
import { useActiveChild } from '../contexts/ActiveChildContext';
import { toast } from '../hooks/use-toast';
import { fmtTimer } from '../lib/routineUtils';
import {
  SLEEP_LOCATION_OPTIONS,
  SLEEP_HOW_OPTIONS,
  AWAKENINGS_OPTIONS,
  SLEEP_TYPE_OPTIONS,
  SLEEP_POSITION_OPTIONS,
  SLEEP_QUALITY_OPTIONS,
} from '../lib/eventSystem';
import {
  ScreenHeader, StickyFooterCTA, SectionLabel,
  ChipGroup, ReportToggle, InlineStatusPill,
} from '../components/ds';

// ── Cores fixas ──
const SLEEP_COLOR  = '#806e84';
const SLEEP_BG     = '#f4f0f3';
const SLEEP_BORDER = '#e3d9e2';
const SLEEP_LIGHT  = '#ede8ef';
const CARD_BG      = '#ffffff';
const CARD_BORDER  = '#E5E0D8';
const MUTED_BG     = '#E8E8E2';
const TXT          = '#2C2C2C';
const TXT_MUTED    = '#7A7A7A';

// ── Persistence ──
export const SLEEP_SESSION_KEY = 'ninho_sleep_v2';

export interface SleepSession {
  childId: string;
  startIso: string;
  pausedAt: string | null;
  accumulatedSec: number;
}

export function loadSleepSession(): SleepSession | null {
  try {
    const r = localStorage.getItem(SLEEP_SESSION_KEY);
    return r ? JSON.parse(r) : null;
  } catch { return null; }
}

export function saveSleepSession(s: SleepSession) {
  try { localStorage.setItem(SLEEP_SESSION_KEY, JSON.stringify(s)); } catch { }
}

export function clearSleepSession() {
  localStorage.removeItem(SLEEP_SESSION_KEY);
  localStorage.removeItem('ninho_sleep_start');
}

// ── Helpers de tempo ──
function timeToMinutes(time: string): number | null {
  if (!time || !time.includes(':')) return null;
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function minutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function nowTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}

// ── Options ──












// ── Discard sheet ──
function DiscardReviewSheet({
  open, onStay, onDiscard,
}: {
  open: boolean; onStay: () => void; onDiscard: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onStay}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        className="w-full max-w-md rounded-t-3xl px-5 pt-6 space-y-3"
        style={{ backgroundColor: CARD_BG, paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        <p className="text-base font-bold text-center font-quicksand" style={{ color: TXT }}>
          Descartar o registro?
        </p>
        <p className="text-sm text-center pb-1 font-nunito" style={{ color: TXT_MUTED }}>
          O sono já foi encerrado. Voltar agora descartará o registro.
        </p>
        <div className="space-y-2 pb-2">
          <button onClick={onStay}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-center transition-all active:scale-95 font-nunito text-white"
            style={{ backgroundColor: SLEEP_COLOR, border: 'none', cursor: 'pointer' }}>
            Continuar e salvar
          </button>
          <button onClick={onDiscard}
            className="w-full py-2 text-xs font-semibold text-center font-nunito"
            style={{ color: '#C04A4A', background: 'none', border: 'none', cursor: 'pointer' }}>
            Descartar e voltar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Formulário de qualidade (reutilizado em ended e manual) ──
function SleepQualityForm({
  location, setLocation,
  howFellAsleep, setHowFellAsleep,
  awakenings, setAwakenings,
  sleepType, setSleepType,
  sleepPosition, setSleepPosition,
  sleepQuality, setSleepQuality,
  usedPacifier, setUsedPacifier,
  notes, setNotes,
  includeInReport, setIncludeInReport,
}: {
  location: string; setLocation: (v: string) => void;
  howFellAsleep: string; setHowFellAsleep: (v: string) => void;
  awakenings: string; setAwakenings: (v: string) => void;
  sleepType: string; setSleepType: (v: string) => void;
  sleepPosition: string; setSleepPosition: (v: string) => void;
  sleepQuality: string; setSleepQuality: (v: string) => void;
  usedPacifier: boolean; setUsedPacifier: (v: boolean) => void;
  notes: string; setNotes: (v: string) => void;
  includeInReport: boolean; setIncludeInReport: (v: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <SectionLabel>Tipo de sono</SectionLabel>
        <ChipGroup options={SLEEP_TYPE_OPTIONS} value={sleepType}
          onToggle={v => setSleepType(sleepType === v ? '' : v)} accentColor={SLEEP_COLOR} />
      </div>

      <div>
        <SectionLabel>Onde dormiu?</SectionLabel>
        <ChipGroup options={SLEEP_LOCATION_OPTIONS} value={location}
          onToggle={v => setLocation(location === v ? '' : v)} accentColor={SLEEP_COLOR} />
      </div>

      <div>
        <SectionLabel>Como adormeceu?</SectionLabel>
        <ChipGroup options={SLEEP_HOW_OPTIONS} value={howFellAsleep}
          onToggle={v => setHowFellAsleep(howFellAsleep === v ? '' : v)} accentColor={SLEEP_COLOR} />
      </div>

      <div>
        <SectionLabel>Posição de sono</SectionLabel>
        <ChipGroup options={SLEEP_POSITION_OPTIONS} value={sleepPosition}
          onToggle={v => setSleepPosition(sleepPosition === v ? '' : v)} accentColor={SLEEP_COLOR} />
        {sleepPosition && sleepPosition !== 'costas' && (
          <div className="mt-2 flex items-start gap-2 px-3 py-2.5 rounded-xl"
            style={{ backgroundColor: '#FDF3E9', border: '1px solid #f0d5b0' }}>
            <span className="text-[12px] flex-shrink-0">⚠️</span>
            <p className="text-[11px] font-nunito leading-snug" style={{ color: '#7a5030' }}>
              A AAP recomenda que bebês durmam sempre de costas até 1 ano para reduzir o risco de morte súbita.
            </p>
          </div>
        )}
      </div>

      <div>
        <SectionLabel>Como foi o sono?</SectionLabel>
        <ChipGroup options={SLEEP_QUALITY_OPTIONS} value={sleepQuality}
          onToggle={v => setSleepQuality(sleepQuality === v ? '' : v)} accentColor={SLEEP_COLOR} />
      </div>

      <div>
        <SectionLabel>Acordou durante o sono?</SectionLabel>
        <ChipGroup options={AWAKENINGS_OPTIONS} value={awakenings}
          onToggle={v => setAwakenings(awakenings === v ? '' : v)} accentColor={SLEEP_COLOR} />
      </div>

      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[13px] font-bold font-quicksand" style={{ color: TXT }}>
            Usou chupeta
          </p>
          <p className="text-[11px] font-nunito mt-0.5" style={{ color: TXT_MUTED }}>
            A AAP recomenda chupeta durante o sono
          </p>
        </div>
        <button
          onClick={() => setUsedPacifier(!usedPacifier)}
          className="w-12 h-6 rounded-full transition-all flex-shrink-0"
          style={{ backgroundColor: usedPacifier ? SLEEP_COLOR : MUTED_BG, border: 'none', cursor: 'pointer' }}>
          <div className="w-5 h-5 rounded-full bg-white transition-all mx-0.5"
            style={{ transform: usedPacifier ? 'translateX(24px)' : 'translateX(0)' }} />
        </button>
      </div>

      <div className="h-px" style={{ backgroundColor: CARD_BORDER }} />

      <div>
        <SectionLabel>Observações</SectionLabel>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Dormiu tranquilo, acordou uma vez, estava agitado..." className="ds-textarea" rows={3} />
      </div>

      <ReportToggle checked={includeInReport} onCheckedChange={setIncludeInReport} />
    </div>
  );
}

// ── Main Component ──
type SleepPhase = 'idle' | 'active' | 'paused' | 'ended' | 'manual';

export default function SleepScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeChildId, activeChild } = useActiveChild();

  const [phase, setPhase]     = useState<SleepPhase>('idle');
  const [session, setSession] = useState<SleepSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [saving, setSaving]   = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const [location, setLocation]               = useState('');
  const [howFellAsleep, setHowFellAsleep]     = useState('');
  const [awakenings, setAwakenings]           = useState('');
  const [sleepType, setSleepType]             = useState('');
  const [sleepPosition, setSleepPosition]     = useState('');
  const [sleepQuality, setSleepQuality]       = useState('');
  const [usedPacifier, setUsedPacifier]       = useState(false);
  const [notes, setNotes]                     = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);

  const [manualStartTime, setManualStartTime] = useState(nowTime);
  const [manualEndTime, setManualEndTime]     = useState(nowTime);
  const [manualDurationMin, setManualDurationMin] = useState('');

  function handleManualStartChange(value: string) {
    setManualStartTime(value);
    const startMin = timeToMinutes(value);
    const duration = Number(manualDurationMin);
    if (startMin !== null && duration > 0) {
      setManualEndTime(minutesToTime(startMin + duration));
    }
  }

  function handleManualEndChange(value: string) {
    setManualEndTime(value);
    const endMin   = timeToMinutes(value);
    const startMin = timeToMinutes(manualStartTime);
    if (endMin !== null && startMin !== null) {
      const diff = endMin - startMin;
      setManualDurationMin(String(diff >= 0 ? diff : diff + 1440));
    }
  }

  function handleManualDurationChange(value: string) {
    setManualDurationMin(value);
    const duration = Number(value);
    const startMin = timeToMinutes(manualStartTime);
    if (duration > 0 && startMin !== null) {
      setManualEndTime(minutesToTime(startMin + duration));
    }
  }

  useEffect(() => {
    const existing = loadSleepSession();
    if (existing && existing.childId === activeChildId) {
      setSession(existing);
      if (existing.pausedAt) { setPhase('paused'); setElapsed(existing.accumulatedSec); }
      else { setPhase('active'); }
    }
  }, [activeChildId]);

  const tick = useCallback(() => {
    setSession(prev => {
      if (!prev || prev.pausedAt) return prev;
      const startMs  = new Date(prev.startIso).getTime();
      const totalSec = prev.accumulatedSec + Math.floor((Date.now() - startMs) / 1000);
      setElapsed(totalSec);
      return prev;
    });
  }, []);

  useEffect(() => {
    if (phase === 'active') { intervalRef.current = setInterval(tick, 1000); }
    else { if (intervalRef.current) clearInterval(intervalRef.current); }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, tick]);

  function handleStart() {
    const now = new Date().toISOString();
    const s: SleepSession = { childId: activeChildId ?? '', startIso: now, pausedAt: null, accumulatedSec: 0 };
    saveSleepSession(s); setSession(s); setPhase('active'); setElapsed(0);
  }

  function handlePause() {
    if (!session) return;
    const acc = session.accumulatedSec + Math.floor((Date.now() - new Date(session.startIso).getTime()) / 1000);
    const paused: SleepSession = { ...session, pausedAt: new Date().toISOString(), accumulatedSec: acc };
    saveSleepSession(paused); setSession(paused); setElapsed(acc); setPhase('paused');
  }

  function handleResume() {
    if (!session) return;
    const resumed: SleepSession = { ...session, startIso: new Date().toISOString(), pausedAt: null };
    saveSleepSession(resumed); setSession(resumed); setPhase('active');
  }

  function handleEnd() {
    if (session && !session.pausedAt) handlePause();
    setPhase('ended');
  }

  function buildPayload() {
    const p: Record<string, unknown> = {};
    if (sleepType)       p.sleep_type        = sleepType;
    if (location)        p.location          = location;
    if (howFellAsleep)   p.how_fell_asleep   = howFellAsleep;
    if (sleepPosition)   p.sleep_position    = sleepPosition;
    if (sleepQuality)    p.sleep_quality     = sleepQuality;
    if (awakenings)      p.awakenings        = awakenings;
    if (usedPacifier)    p.used_pacifier     = true;
    if (includeInReport) p.include_in_report = true;
    return p;
  }

  async function handleSave() {
    if (!user || !activeChildId || !session) return;
    setSaving(true);
    try {
      const startIso = session.startIso;
      const totalSec = session.accumulatedSec;
      const endTime  = new Date(new Date(startIso).getTime() + totalSec * 1000).toISOString();
      const payload  = buildPayload();

      const { error } = await supabase.from('routine_logs').insert([{
        child_id: activeChildId,
        author_id: user.id,
        type: 'sleep' as const,
        start_time: startIso,
        end_time: endTime,
        payload: Object.keys(payload).length > 0 ? payload as unknown as import('../integrations/supabase/types').Json : null,
        notes: notes.trim() || null,
      }]);

      if (error) throw error;

      clearSleepSession();
      toast({ title: '😴 Sono registrado' });
      navigate(-1);
    } catch (e: unknown) {
      toast({
        title: 'Erro ao salvar',
        description: e instanceof Error ? e.message : 'Tente novamente',
        variant: 'destructive'
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
      const [sh, sm] = manualStartTime.split(':').map(Number);
      const [eh, em] = manualEndTime.split(':').map(Number);

      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sh, sm, 0);
      let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eh, em, 0);

      if (endDate <= startDate) {
        endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
      }

      const payload = buildPayload();

      const { error } = await supabase.from('routine_logs').insert([{
        child_id: activeChildId,
        author_id: user.id,
        type: 'sleep' as const,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        payload: Object.keys(payload).length > 0 ? payload as unknown as import('../integrations/supabase/types').Json : null,
        notes: notes.trim() || null,
      }]);

      if (error) throw error;

      toast({ title: '😴 Sono registrado' });
      navigate(-1);
    } catch (e: unknown) {
      toast({
        title: 'Erro ao salvar',
        description: e instanceof Error ? e.message : 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() { clearSleepSession(); navigate(-1); }

  function handleBack() {
    if (phase === 'ended') { setShowBackConfirm(true); }
    else if (phase === 'manual') { setShowBackConfirm(true); }
    else { navigate(-1); }
  }

  const sessionStartLabel = session
    ? new Date(session.startIso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  const statusPill = (phase === 'active' || phase === 'paused') ? (
    <InlineStatusPill
      label={phase === 'active' ? 'Em andamento' : 'Pausado'}
      variant={phase === 'active' ? 'active' : 'paused'}
      color={SLEEP_COLOR}
    />
  ) : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F5F0' }}>
      <ScreenHeader
        title="Registrar sono"
        childName={activeChild?.name}
        onBack={handleBack}
        statusSlot={statusPill}
      />

      <div className="ds-form-body">

        {phase === 'idle' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center pt-8 gap-8">
            <div className="w-36 h-36 rounded-full flex items-center justify-center"
              style={{ backgroundColor: SLEEP_BG, border: `2px dashed ${SLEEP_BORDER}` }}>
              <span className="text-[56px]">😴</span>
            </div>
            <div className="text-center space-y-1.5">
              <p className="text-[18px] font-bold font-quicksand" style={{ color: TXT }}>
                Pronto para dormir?
              </p>
              <p className="text-[13px] font-nunito leading-snug max-w-[220px] mx-auto" style={{ color: TXT_MUTED }}>
                Inicie o cronômetro quando colocar para dormir
              </p>
            </div>

            <div className="w-full pt-2" style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] font-nunito mb-2 text-center"
                style={{ color: TXT_MUTED }}>
                Outras opções
              </p>
              <button
                onClick={() => {
                  const t = nowTime();
                  setManualStartTime(t);
                  setManualEndTime(t);
                  setManualDurationMin('');
                  setPhase('manual');
                }}
                className="w-full py-2.5 text-[12px] font-semibold font-nunito text-center"
                style={{ color: TXT_MUTED, background: 'none', border: 'none', cursor: 'pointer' }}>
                Registrar sem cronômetro
              </button>
            </div>
          </motion.div>
        )}

        {(phase === 'active' || phase === 'paused') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-7 pt-4">
            <div className="w-48 h-48 rounded-full flex flex-col items-center justify-center"
              style={{
                backgroundColor: SLEEP_BG,
                border: `3px solid ${phase === 'active' ? SLEEP_COLOR : SLEEP_BORDER}`,
              }}>
              <span className="text-[40px] mb-1">😴</span>
              <p className="text-[34px] font-bold tabular-nums font-quicksand leading-none"
                style={{ color: SLEEP_COLOR }}>
                {fmtTimer(elapsed)}
              </p>
            </div>

            <div className="text-center space-y-1">
              <div className="flex items-center gap-2 justify-center">
                {phase === 'active' && (
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: SLEEP_COLOR }} />
                )}
                <p className="text-[14px] font-semibold font-nunito" style={{ color: SLEEP_COLOR }}>
                  {phase === 'active' ? 'Sono em andamento' : 'Sono pausado'}
                </p>
              </div>
              {sessionStartLabel && (
                <p className="text-[12px] font-nunito" style={{ color: TXT_MUTED }}>
                  Iniciado às {sessionStartLabel}
                </p>
              )}
            </div>

            <div className="w-full flex gap-3">
              {phase === 'active' ? (
                <button onClick={handlePause}
                  className="flex-1 py-4 rounded-2xl text-[14px] font-bold font-nunito transition-all active:scale-95"
                  style={{ backgroundColor: MUTED_BG, color: TXT, border: 'none', cursor: 'pointer' }}>
                  Pausar
                </button>
              ) : (
                <button onClick={handleResume}
                  className="flex-1 py-4 rounded-2xl text-[14px] font-bold font-nunito transition-all active:scale-95"
                  style={{ backgroundColor: SLEEP_BG, color: SLEEP_COLOR, border: `1.5px solid ${SLEEP_BORDER}`, cursor: 'pointer' }}>
                  Continuar
                </button>
              )}
              <button onClick={handleEnd}
                className="flex-1 py-4 rounded-2xl text-[14px] font-bold font-nunito transition-all active:scale-95 text-white"
                style={{ backgroundColor: SLEEP_COLOR, border: 'none', cursor: 'pointer' }}>
                Encerrar
              </button>
            </div>

            <p className="text-[12px] text-center font-nunito px-4" style={{ color: TXT_MUTED }}>
              Encerre para salvar o registro desta soneca
            </p>
          </motion.div>
        )}

        {phase === 'manual' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ backgroundColor: SLEEP_BG, border: `1.5px solid ${SLEEP_BORDER}` }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0"
                style={{ backgroundColor: SLEEP_LIGHT }}>
                😴
              </div>
              <div>
                <p className="text-[14px] font-bold font-quicksand leading-tight" style={{ color: TXT }}>
                  Registro manual
                </p>
                <p className="text-[12px] font-nunito mt-0.5" style={{ color: TXT_MUTED }}>
                  Preencha os dados do sono
                </p>
              </div>
            </div>

            <div>
              <SectionLabel>Horários</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.06em] font-nunito mb-2"
                    style={{ color: TXT_MUTED }}>Início</p>
                  <input type="time" value={manualStartTime}
                    onChange={e => handleManualStartChange(e.target.value)}
                    className="w-full h-12 px-4 rounded-2xl text-[15px] font-semibold font-nunito outline-none"
                    style={{ backgroundColor: MUTED_BG, border: `1.5px solid ${CARD_BORDER}`, color: TXT }}
                  />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.06em] font-nunito mb-2"
                    style={{ color: TXT_MUTED }}>Fim</p>
                  <input type="time" value={manualEndTime}
                    onChange={e => handleManualEndChange(e.target.value)}
                    className="w-full h-12 px-4 rounded-2xl text-[15px] font-semibold font-nunito outline-none"
                    style={{ backgroundColor: MUTED_BG, border: `1.5px solid ${CARD_BORDER}`, color: TXT }}
                  />
                </div>
              </div>

              <div className="mt-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] font-nunito mb-2"
                  style={{ color: TXT_MUTED }}>Duração (minutos)</p>
                <input type="number" inputMode="numeric" min="1" max="720"
                  placeholder="ex: 90" value={manualDurationMin}
                  onChange={e => handleManualDurationChange(e.target.value)}
                  className="w-full h-12 px-4 rounded-2xl text-[15px] font-semibold font-nunito outline-none"
                  style={{ backgroundColor: MUTED_BG, border: `1.5px solid ${CARD_BORDER}`, color: TXT }}
                />
              </div>

              <p className="text-[11px] font-nunito mt-2 text-center" style={{ color: TXT_MUTED }}>
                Início, fim e duração se calculam automaticamente entre si
              </p>
            </div>

            <div className="h-px" style={{ backgroundColor: CARD_BORDER }} />

            <SleepQualityForm
              location={location} setLocation={setLocation}
              howFellAsleep={howFellAsleep} setHowFellAsleep={setHowFellAsleep}
              awakenings={awakenings} setAwakenings={setAwakenings}
              sleepType={sleepType} setSleepType={setSleepType}
              sleepPosition={sleepPosition} setSleepPosition={setSleepPosition}
              sleepQuality={sleepQuality} setSleepQuality={setSleepQuality}
              usedPacifier={usedPacifier} setUsedPacifier={setUsedPacifier}
              notes={notes} setNotes={setNotes}
              includeInReport={includeInReport} setIncludeInReport={setIncludeInReport}
            />
          </motion.div>
        )}

        {phase === 'ended' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ backgroundColor: SLEEP_BG, border: `1.5px solid ${SLEEP_BORDER}` }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0"
                style={{ backgroundColor: SLEEP_LIGHT }}>
                😴
              </div>
              <div>
                <p className="text-[14px] font-bold font-quicksand leading-tight" style={{ color: TXT }}>
                  Sono encerrado
                </p>
                <p className="text-[13px] font-semibold font-nunito mt-0.5" style={{ color: SLEEP_COLOR }}>
                  Duração: {fmtTimer(session?.accumulatedSec ?? 0)}
                </p>
              </div>
            </div>

            <SleepQualityForm
              location={location} setLocation={setLocation}
              howFellAsleep={howFellAsleep} setHowFellAsleep={setHowFellAsleep}
              awakenings={awakenings} setAwakenings={setAwakenings}
              sleepType={sleepType} setSleepType={setSleepType}
              sleepPosition={sleepPosition} setSleepPosition={setSleepPosition}
              sleepQuality={sleepQuality} setSleepQuality={setSleepQuality}
              usedPacifier={usedPacifier} setUsedPacifier={setUsedPacifier}
              notes={notes} setNotes={setNotes}
              includeInReport={includeInReport} setIncludeInReport={setIncludeInReport}
            />
          </motion.div>
        )}
      </div>

      {phase === 'idle' && (
        <StickyFooterCTA
          primaryLabel="▶ Iniciar sono"
          onPrimary={handleStart}
          primaryDisabled={!activeChildId}
          primaryColor={SLEEP_COLOR}
        />
      )}

      {phase === 'manual' && (
        <StickyFooterCTA
          primaryLabel="Salvar registro"
          onPrimary={handleSaveManual}
          primaryLoading={saving}
          primaryColor={SLEEP_COLOR}
          tertiaryLabel="Cancelar"
          onTertiary={() => setPhase('idle')}
        />
      )}

      {phase === 'ended' && (
        <StickyFooterCTA
          primaryLabel="Salvar registro"
          onPrimary={handleSave}
          primaryLoading={saving}
          primaryColor={SLEEP_COLOR}
          tertiaryLabel="Descartar sessão"
          onTertiary={handleDiscard}
        />
      )}

      <AnimatePresence>
        {showBackConfirm && (
          <DiscardReviewSheet
            open
            onStay={() => setShowBackConfirm(false)}
            onDiscard={() => { setShowBackConfirm(false); handleDiscard(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

