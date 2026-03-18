/**
 * SleepScreen — Full-screen sleep session flow.
 * DS v2: uses ScreenHeader, StickyFooterCTA, SectionLabel, ChipGroup, ReportToggle, InlineStatusPill.
 *
 * No gradient buttons. Solid primary (mauve). Chips always wrap.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  try { const r = localStorage.getItem(SLEEP_SESSION_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}

export function saveSleepSession(s: SleepSession) {
  try { localStorage.setItem(SLEEP_SESSION_KEY, JSON.stringify(s)); } catch { /* noop */ }
}

export function clearSleepSession() {
  localStorage.removeItem(SLEEP_SESSION_KEY);
  localStorage.removeItem('ninho_sleep_start'); // legacy
}

// ─── Options ──────────────────────────────────────────────────────────────────

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

const AWAKENINGS_OPTIONS = [
  { value: '0', label: '0' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3+', label: '3+' },
];

const SLEEP_COLOR = 'hsl(var(--color-sleep))';

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

  // Enrichment fields
  const [location, setLocation] = useState('');
  const [howFellAsleep, setHowFellAsleep] = useState('');
  const [awakenings, setAwakenings] = useState('');
  const [notes, setNotes] = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);

  // Load existing session on mount
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

  // Timer tick
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

  // Actions
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
      if (location)      payload.location        = location;
      if (howFellAsleep) payload.how_fell_asleep  = howFellAsleep;
      if (awakenings)    payload.awakenings       = awakenings;
      if (includeInReport) payload.include_in_report = true;

      const { error } = await supabase.from('routine_logs').insert({
        child_id: activeChildId,
        author_id: user.id,
        type: 'sleep',
        start_time: startIso,
        end_time: endTime,
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

  const sessionStartLabel = session
    ? new Date(session.startIso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  // Status pill for header
  const statusPill = (phase === 'active' || phase === 'paused') ? (
    <InlineStatusPill
      label={phase === 'active' ? 'Em andamento' : 'Pausado'}
      variant={phase === 'active' ? 'active' : 'paused'}
      color={SLEEP_COLOR}
    />
  ) : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* DS Header */}
      <ScreenHeader
        title="Registrar sono"
        childName={activeChild?.name}
        statusSlot={statusPill}
      />

      {/* Content */}
      <div className="ds-form-body">

        {/* IDLE */}
        {phase === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center pt-10 gap-6"
          >
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: `color-mix(in srgb, ${SLEEP_COLOR} 12%, transparent)`,
                border: `2px dashed color-mix(in srgb, ${SLEEP_COLOR} 35%, transparent)`,
              }}
            >
              <span className="text-5xl">😴</span>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold font-quicksand text-foreground">
                Pronto para dormir?
              </p>
              <p className="text-sm mt-1 text-muted-foreground font-nunito">
                Inicie o cronômetro quando colocar para dormir
              </p>
            </div>
          </motion.div>
        )}

        {/* ACTIVE or PAUSED */}
        {(phase === 'active' || phase === 'paused') && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-6 pt-6"
          >
            {/* Timer circle */}
            <div
              className="w-44 h-44 rounded-full flex flex-col items-center justify-center"
              style={{
                backgroundColor: `color-mix(in srgb, ${SLEEP_COLOR} 10%, transparent)`,
                border: `3px solid ${phase === 'active' ? SLEEP_COLOR : `color-mix(in srgb, ${SLEEP_COLOR} 40%, transparent)`}`,
              }}
            >
              <span className="text-4xl mb-1">😴</span>
              <p
                className="text-2xl font-bold tabular-nums font-quicksand"
                style={{ color: SLEEP_COLOR }}
              >
                {fmtTimer(elapsed)}
              </p>
            </div>

            {/* Status label */}
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center">
                {phase === 'active' && (
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: SLEEP_COLOR }} />
                )}
                <p className="text-sm font-semibold font-nunito" style={{ color: SLEEP_COLOR }}>
                  {phase === 'active' ? 'Sono em andamento' : 'Sono pausado'}
                </p>
              </div>
              {sessionStartLabel && (
                <p className="text-xs mt-0.5 text-muted-foreground font-nunito">
                  Iniciado às {sessionStartLabel}
                </p>
              )}
            </div>

            {/* Session controls — DS Secondary + Primary pattern */}
            <div className="w-full flex gap-3">
              {phase === 'active' ? (
                <button
                  onClick={handlePause}
                  className="flex-1 py-4 rounded-2xl text-sm font-bold font-nunito transition-all active:scale-95 bg-muted text-foreground"
                >
                  ⏸ Pausar
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  className="flex-1 py-4 rounded-2xl text-sm font-bold font-nunito transition-all active:scale-95"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${SLEEP_COLOR} 12%, transparent)`,
                    color: SLEEP_COLOR,
                    border: `1.5px solid color-mix(in srgb, ${SLEEP_COLOR} 35%, transparent)`,
                  }}
                >
                  ▶ Continuar
                </button>
              )}
              <button
                onClick={handleEnd}
                className="flex-1 py-4 rounded-2xl text-sm font-bold font-nunito transition-all active:scale-95 text-white"
                style={{ backgroundColor: SLEEP_COLOR }}
              >
                ⏹ Encerrar
              </button>
            </div>
          </motion.div>
        )}

        {/* ENDED — enrichment form */}
        {phase === 'ended' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="ds-section"
          >
            {/* Summary */}
            <div
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{
                backgroundColor: `color-mix(in srgb, ${SLEEP_COLOR} 10%, transparent)`,
                border: `1.5px solid color-mix(in srgb, ${SLEEP_COLOR} 25%, transparent)`,
              }}
            >
              <span className="text-2xl">😴</span>
              <div>
                <p className="text-sm font-bold font-quicksand text-foreground">
                  Sono encerrado
                </p>
                <p className="text-xs font-semibold font-nunito" style={{ color: SLEEP_COLOR }}>
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

            {/* Awakenings */}
            <div>
              <SectionLabel>Despertares</SectionLabel>
              <ChipGroup
                options={AWAKENINGS_OPTIONS}
                value={awakenings}
                onToggle={v => setAwakenings(p => p === v ? '' : v)}
                accentColor={SLEEP_COLOR}
              />
            </div>

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
            <ReportToggle
              checked={includeInReport}
              onCheckedChange={setIncludeInReport}
            />

            {/* Discard — tertiary link action */}
            <button
              onClick={handleDiscard}
              className="w-full py-2 text-xs font-semibold text-center text-muted-foreground font-nunito"
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
      {(phase === 'active' || phase === 'paused') && (
        <div
          className="fixed bottom-0 left-0 right-0 flex justify-center bg-card border-t border-border z-30"
          style={{ padding: '12px 16px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
        >
          <p className="text-xs text-center text-muted-foreground font-nunito">
            Encerre o sono para salvar o registro
          </p>
        </div>
      )}
      {phase === 'ended' && (
        <StickyFooterCTA
          primaryLabel="Salvar sono"
          onPrimary={handleSave}
          primaryLoading={saving}
          primaryColor={SLEEP_COLOR}
        />
      )}
    </div>
  );
}
