/**
 * SleepScreen — Full-screen sleep session flow.
 *
 * Phases: idle → active → paused → ended (review) → saved
 * Language: plain caregiver language, no jargon.
 * Back guard: if active/paused/ended, warn before navigating away.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { toast } from '@/hooks/use-toast';
import { makePayloadNotes, fmtTimer } from '@/lib/routineUtils';
import {
  ScreenHeader,
  StickyFooterCTA,
  SectionLabel,
  ChipGroup,
  ReportToggle,
  InlineStatusPill,
} from '@/components/ds';

// ─── Persistence ──────────────────────────────────────────────────────────────

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
  try { localStorage.setItem(SLEEP_SESSION_KEY, JSON.stringify(s)); } catch { /* noop */ }
}

export function clearSleepSession() {
  localStorage.removeItem(SLEEP_SESSION_KEY);
  localStorage.removeItem('ninho_sleep_start'); // legacy
}

// ─── Options (plain caregiver language) ───────────────────────────────────────

const SLEEP_LOCATION_OPTIONS = [
  { value: 'berco',    label: '🛏 Berço' },
  { value: 'colo',     label: '🤱 Colo' },
  { value: 'carrinho', label: '🛒 Carrinho' },
  { value: 'cama',     label: '🛌 Cama' },
  { value: 'outro',    label: '📦 Outro' },
];

const SLEEP_HOW_OPTIONS = [
  { value: 'sozinho', label: 'Sozinho' },
  { value: 'mamando', label: 'Mamando' },
  { value: 'colo',    label: 'No colo' },
  { value: 'embalo',  label: 'No embalo' },
  { value: 'outro',   label: 'Outro' },
];

// Plain language: "Acordou durante o sono?" instead of "Despertares"
const AWAKENINGS_OPTIONS = [
  { value: '0',  label: 'Nenhuma vez' },
  { value: '1',  label: '1 vez' },
  { value: '2',  label: '2 vezes' },
  { value: '3+', label: '3 ou mais' },
];

const SLEEP_COLOR = 'hsl(var(--color-sleep))';

// ─── Back confirm sheet ────────────────────────────────────────────────────────

function BackConfirmSheet({
  open, onContinue, onEnd, onDiscard,
}: {
  open: boolean;
  onContinue: () => void;
  onEnd: () => void;
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
        className="w-full max-w-md rounded-t-3xl px-5 pt-6 space-y-3 bg-card"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        <p className="text-base font-bold text-center font-quicksand text-foreground">
          Sono em andamento
        </p>
        <p className="text-sm text-center pb-1 text-muted-foreground font-nunito">
          O que deseja fazer?
        </p>
        <div className="space-y-2 pb-2">
          <button
            onClick={onContinue}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-center transition-all active:scale-95 font-nunito text-white"
            style={{ backgroundColor: SLEEP_COLOR }}
          >
            Continuar o sono
          </button>
          <button
            onClick={onEnd}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-center transition-all active:scale-95 font-nunito bg-muted text-foreground"
          >
            Encerrar e salvar
          </button>
          <button
            onClick={onDiscard}
            className="w-full py-2 text-xs font-semibold text-center font-nunito text-destructive"
          >
            Descartar sessão
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type SleepPhase = 'idle' | 'active' | 'paused' | 'ended';

export default function SleepScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeChildId, activeChild } = useActiveChild();

  const [phase, setPhase] = useState<SleepPhase>('idle');
  const [session, setSession] = useState<SleepSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [saving, setSaving] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  // Review fields
  const [location, setLocation] = useState('');
  const [howFellAsleep, setHowFellAsleep] = useState('');
  const [awakenings, setAwakenings] = useState('');
  const [notes, setNotes] = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);

  useEffect(() => {
    const existing = loadSleepSession();
    if (existing && existing.childId === activeChildId) {
      setSession(existing);
      if (existing.pausedAt) {
        setPhase('paused');
        setElapsed(existing.accumulatedSec);
      } else {
        setPhase('active');
      }
    }
  }, [activeChildId]);

  const tick = useCallback(() => {
    setSession(prev => {
      if (!prev || prev.pausedAt) return prev;
      const startMs = new Date(prev.startIso).getTime();
      const totalSec = prev.accumulatedSec + Math.floor((Date.now() - startMs) / 1000);
      setElapsed(totalSec);
      return prev;
    });
  }, []);

  useEffect(() => {
    if (phase === 'active') {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, tick]);

  function handleStart() {
    const now = new Date().toISOString();
    const newSession: SleepSession = {
      childId: activeChildId ?? '',
      startIso: now,
      pausedAt: null,
      accumulatedSec: 0,
    };
    saveSleepSession(newSession);
    setSession(newSession);
    setPhase('active');
    setElapsed(0);
  }

  function handlePause() {
    if (!session) return;
    const startMs = new Date(session.startIso).getTime();
    const accumulated = session.accumulatedSec + Math.floor((Date.now() - startMs) / 1000);
    const paused: SleepSession = { ...session, pausedAt: new Date().toISOString(), accumulatedSec: accumulated };
    saveSleepSession(paused);
    setSession(paused);
    setElapsed(accumulated);
    setPhase('paused');
  }

  function handleResume() {
    if (!session) return;
    const resumed: SleepSession = { ...session, startIso: new Date().toISOString(), pausedAt: null };
    saveSleepSession(resumed);
    setSession(resumed);
    setPhase('active');
  }

  function handleEnd() {
    if (session && !session.pausedAt) handlePause();
    setPhase('ended');
  }

  async function handleSave() {
    if (!user || !activeChildId || !session) return;
    setSaving(true);
    try {
      const startIso = session.startIso;
      const totalSec = session.accumulatedSec;
      const endTime = new Date(new Date(startIso).getTime() + totalSec * 1000).toISOString();

      const payload: Record<string, unknown> = {};
      if (location)        payload.location          = location;
      if (howFellAsleep)   payload.how_fell_asleep   = howFellAsleep;
      if (awakenings)      payload.awakenings         = awakenings;
      if (includeInReport) payload.include_in_report  = true;

      const { error } = await supabase.from('routine_logs').insert({
        child_id:   activeChildId,
        author_id:  user.id,
        type:       'sleep',
        start_time: startIso,
        end_time:   endTime,
        notes: (notes.trim() || Object.keys(payload).length > 0)
          ? makePayloadNotes(payload, notes)
          : null,
      });

      if (error) throw error;
      clearSleepSession();
      toast({ title: '😴 Sono registrado' });
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

  function handleDiscard() {
    clearSleepSession();
    navigate(-1);
  }

  function handleBack() {
    // Sessions are background-persistent — navigating away during active/paused
    // never interrupts the session. Only "ended" (unsaved review) needs confirmation.
    if (phase === 'ended') {
      setShowBackConfirm(true);
    } else {
      // idle, active, paused: just navigate back — session continues in background
      navigate(-1);
    }
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
    <div className="min-h-screen flex flex-col bg-background">
      <ScreenHeader
        title="Registrar sono"
        childName={activeChild?.name}
        onBack={handleBack}
        statusSlot={statusPill}
      />

      <div className="ds-form-body">

        {/* ── IDLE ─────────────────────────────────────────────────────── */}
        {phase === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center pt-8 gap-8"
          >
            <div
              className="w-36 h-36 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: `color-mix(in srgb, ${SLEEP_COLOR} 10%, transparent)`,
                border: `2px dashed color-mix(in srgb, ${SLEEP_COLOR} 30%, transparent)`,
              }}
            >
              <span className="text-[56px]">😴</span>
            </div>

            <div className="text-center space-y-1.5">
              <p className="text-[18px] font-bold font-quicksand text-foreground">
                Pronto para dormir?
              </p>
              <p className="text-[13px] text-muted-foreground font-nunito leading-snug max-w-[220px] mx-auto">
                Inicie o cronômetro quando colocar para dormir
              </p>
            </div>
          </motion.div>
        )}

        {/* ── ACTIVE or PAUSED ─────────────────────────────────────────── */}
        {(phase === 'active' || phase === 'paused') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-7 pt-4"
          >
            {/* Timer circle — dominant visual */}
            <div
              className="w-48 h-48 rounded-full flex flex-col items-center justify-center"
              style={{
                backgroundColor: `color-mix(in srgb, ${SLEEP_COLOR} 8%, transparent)`,
                border: `3px solid ${phase === 'active'
                  ? SLEEP_COLOR
                  : `color-mix(in srgb, ${SLEEP_COLOR} 35%, transparent)`}`,
              }}
            >
              <span className="text-[40px] mb-1">😴</span>
              <p
                className="text-[34px] font-bold tabular-nums font-quicksand leading-none"
                style={{ color: SLEEP_COLOR }}
              >
                {fmtTimer(elapsed)}
              </p>
            </div>

            {/* Status label */}
            <div className="text-center space-y-1">
              <div className="flex items-center gap-2 justify-center">
                {phase === 'active' && (
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: SLEEP_COLOR }}
                  />
                )}
                <p className="text-[14px] font-semibold font-nunito" style={{ color: SLEEP_COLOR }}>
                  {phase === 'active' ? 'Sono em andamento' : 'Sono pausado'}
                </p>
              </div>
              {sessionStartLabel && (
                <p className="text-[12px] text-muted-foreground font-nunito">
                  Iniciado às {sessionStartLabel}
                </p>
              )}
            </div>

            {/* Controls */}
            <div className="w-full flex gap-3">
              {phase === 'active' ? (
                <button
                  onClick={handlePause}
                  className="flex-1 py-4 rounded-2xl text-[14px] font-bold font-nunito transition-all active:scale-95 bg-secondary text-foreground"
                >
                  ⏸ Pausar
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  className="flex-1 py-4 rounded-2xl text-[14px] font-bold font-nunito transition-all active:scale-95"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${SLEEP_COLOR} 10%, transparent)`,
                    color: SLEEP_COLOR,
                    border: `1.5px solid color-mix(in srgb, ${SLEEP_COLOR} 30%, transparent)`,
                  }}
                >
                  ▶ Continuar
                </button>
              )}
              <button
                onClick={handleEnd}
                className="flex-1 py-4 rounded-2xl text-[14px] font-bold font-nunito transition-all active:scale-95 text-white"
                style={{ backgroundColor: SLEEP_COLOR }}
              >
                ⏹ Encerrar
              </button>
            </div>

            <p className="text-[12px] text-center text-muted-foreground font-nunito px-4">
              Encerre para salvar o registro desta soneca
            </p>
          </motion.div>
        )}

        {/* ── ENDED — review form ───────────────────────────────────────── */}
        {phase === 'ended' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary card */}
            <div
              className="flex items-center gap-4 p-4 rounded-2xl"
              style={{
                backgroundColor: `color-mix(in srgb, ${SLEEP_COLOR} 9%, hsl(var(--card)))`,
                border: `1.5px solid color-mix(in srgb, ${SLEEP_COLOR} 22%, transparent)`,
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0"
                style={{ backgroundColor: `color-mix(in srgb, ${SLEEP_COLOR} 18%, transparent)` }}
              >
                😴
              </div>
              <div>
                <p className="text-[14px] font-bold font-quicksand text-foreground leading-tight">
                  Sono encerrado
                </p>
                <p
                  className="text-[13px] font-semibold font-nunito mt-0.5"
                  style={{ color: SLEEP_COLOR }}
                >
                  Duração: {fmtTimer(session?.accumulatedSec ?? 0)}
                </p>
              </div>
            </div>

            {/* Where slept */}
            <div>
              <SectionLabel>Onde dormiu?</SectionLabel>
              <ChipGroup
                options={SLEEP_LOCATION_OPTIONS}
                value={location}
                onToggle={v => setLocation(p => p === v ? '' : v)}
                accentColor={SLEEP_COLOR}
              />
            </div>

            {/* How fell asleep */}
            <div>
              <SectionLabel>Como adormeceu?</SectionLabel>
              <ChipGroup
                options={SLEEP_HOW_OPTIONS}
                value={howFellAsleep}
                onToggle={v => setHowFellAsleep(p => p === v ? '' : v)}
                accentColor={SLEEP_COLOR}
              />
            </div>

            {/* Awakenings — plain language */}
            <div>
              <SectionLabel>Acordou durante o sono?</SectionLabel>
              <ChipGroup
                options={AWAKENINGS_OPTIONS}
                value={awakenings}
                onToggle={v => setAwakenings(p => p === v ? '' : v)}
                accentColor={SLEEP_COLOR}
              />
            </div>

            <div className="h-px" style={{ backgroundColor: 'hsl(var(--border))' }} />

            {/* Notes */}
            <div>
              <SectionLabel>Observações</SectionLabel>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Dormiu tranquilo, acordou uma vez..."
                className="ds-textarea"
                rows={3}
              />
            </div>

            {/* Medical report */}
            <ReportToggle checked={includeInReport} onCheckedChange={setIncludeInReport} />

            {/* Discard — tertiary */}
            <button
              onClick={handleDiscard}
              className="w-full py-2.5 text-[12px] font-semibold text-center text-muted-foreground font-nunito"
            >
              Descartar sessão
            </button>
          </motion.div>
        )}
      </div>

      {/* DS Sticky CTA */}
      {phase === 'idle' && (
        <StickyFooterCTA
          primaryLabel="▶ Iniciar sono"
          onPrimary={handleStart}
          primaryDisabled={!activeChildId}
          primaryColor={SLEEP_COLOR}
        />
      )}
      {phase === 'ended' && (
        <StickyFooterCTA
          primaryLabel={saving ? 'Salvando...' : 'Salvar sono'}
          onPrimary={handleSave}
          primaryLoading={saving}
          primaryColor={SLEEP_COLOR}
        />
      )}

      {/* Back nav guard */}
      <AnimatePresence>
        {showBackConfirm && (
          <BackConfirmSheet
            open
            onContinue={() => setShowBackConfirm(false)}
            onEnd={() => { setShowBackConfirm(false); handleEnd(); }}
            onDiscard={() => { setShowBackConfirm(false); handleDiscard(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
