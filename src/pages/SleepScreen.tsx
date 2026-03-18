/**
 * SleepScreen — Full-screen sleep session flow.
 *
 * States: idle → active (with timer) → ended (with enrichment) → saved
 *
 * Persists active session in localStorage.
 * If a session is already running, reopening resumes it.
 *
 * Route: /sleep
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { toast } from '@/hooks/use-toast';
import { makePayloadNotes, fmtTimer } from '@/lib/routineUtils';

// ─── Persistence key ──────────────────────────────────────────────────────────
export const SLEEP_SESSION_KEY = 'ninho_sleep_v2';

export interface SleepSession {
  childId: string;
  startIso: string;
  pausedAt: string | null;   // ISO if currently paused
  accumulatedSec: number;    // total seconds before current segment
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

// ─── Chip options ─────────────────────────────────────────────────────────────

const SLEEP_LOCATION_OPTIONS = [
  { value: 'berco',      label: '🛏 Berço' },
  { value: 'colo',       label: '🤱 Colo' },
  { value: 'carrinho',   label: '🛒 Carrinho' },
  { value: 'cama',       label: '🛌 Cama' },
  { value: 'outro',      label: '📦 Outro' },
];

const SLEEP_HOW_OPTIONS = [
  { value: 'sozinho',    label: 'Sozinho' },
  { value: 'mamando',    label: 'Mamando' },
  { value: 'colo',       label: 'No colo' },
  { value: 'embalo',     label: 'No embalo' },
  { value: 'outro',      label: 'Outro' },
];

const AWAKENINGS_OPTIONS = [
  { value: '0', label: '0' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3+', label: '3+' },
];

const MAUVE = 'hsl(270,12%,52%)';
const font = 'Nunito, sans-serif';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wider mb-2"
      style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
      {children}
    </p>
  );
}

function ChipRow({
  options, value, onToggle, wrap = false,
}: {
  options: { value: string; label: string }[];
  value: string;
  onToggle: (v: string) => void;
  wrap?: boolean;
}) {
  return (
    <div className={`flex gap-2 ${wrap ? 'flex-wrap' : 'overflow-x-auto pb-1'}`}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onToggle(opt.value)}
          className="py-2.5 px-4 rounded-2xl text-sm font-semibold transition-all active:scale-95 whitespace-nowrap flex-shrink-0"
          style={{
            backgroundColor: value === opt.value ? MAUVE : 'hsl(var(--card))',
            color: value === opt.value ? 'white' : 'hsl(var(--ninho-brown))',
            border: `1.5px solid ${value === opt.value ? MAUVE : 'hsl(var(--border))'}`,
            fontFamily: font,
          }}
        >
          {opt.label}
        </button>
      ))}
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

  // Enrichment
  const [location, setLocation] = useState('');
  const [howFellAsleep, setHowFellAsleep] = useState('');
  const [awakenings, setAwakenings] = useState('');
  const [notes, setNotes] = useState('');

  // ─── Load existing session on mount ────────────────────────────
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

  // ─── Timer tick ─────────────────────────────────────────────────
  const tick = useCallback(() => {
    if (!session) return;
    const sinceSec = session.pausedAt
      ? session.accumulatedSec
      : session.accumulatedSec + Math.floor((Date.now() - new Date(session.startIso).getTime()) / 1000 - (
          // subtract time before any previous segments
          0
        ));
    // Simpler: compute elapsed from start minus accumulated pause time
    if (!session.pausedAt) {
      const startMs = new Date(session.startIso).getTime();
      const totalSec = session.accumulatedSec + Math.floor((Date.now() - startMs) / 1000);
      setElapsed(totalSec);
    }
  }, [session]);

  useEffect(() => {
    if (phase === 'active') {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, tick]);

  // ─── Actions ────────────────────────────────────────────────────

  function handleStart() {
    const childId = activeChildId ?? '';
    const now = new Date().toISOString();
    const newSession: SleepSession = {
      childId,
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
    const now = new Date().toISOString();
    const startMs = new Date(session.startIso).getTime();
    const accumulated = session.accumulatedSec + Math.floor((Date.now() - startMs) / 1000);
    const paused: SleepSession = { ...session, pausedAt: now, accumulatedSec: accumulated };
    saveSleepSession(paused);
    setSession(paused);
    setElapsed(accumulated);
    setPhase('paused');
  }

  function handleResume() {
    if (!session) return;
    const now = new Date().toISOString();
    const resumed: SleepSession = { ...session, startIso: now, pausedAt: null };
    saveSleepSession(resumed);
    setSession(resumed);
    setPhase('active');
  }

  function handleEnd() {
    if (session && !session.pausedAt) {
      handlePause();
    }
    setPhase('ended');
  }

  async function handleSave() {
    if (!user || !activeChildId || !session) return;
    setSaving(true);
    try {
      const startIso = session.startIso;
      const totalSec = phase === 'ended'
        ? session.accumulatedSec
        : elapsed;
      const endTime = new Date(new Date(startIso).getTime() + totalSec * 1000).toISOString();

      const payload: Record<string, unknown> = {};
      if (location)       payload.location      = location;
      if (howFellAsleep)  payload.how_fell_asleep = howFellAsleep;
      if (awakenings)     payload.awakenings    = awakenings;

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

  // ─── Render helpers ─────────────────────────────────────────────

  const sessionStartLabel = session
    ? new Date(session.startIso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>
      {/* Header */}
      <div
        className="flex-shrink-0 px-5 flex items-center gap-3"
        style={{
          paddingTop: 'max(52px, env(safe-area-inset-top))',
          paddingBottom: '16px',
          backgroundColor: 'hsl(var(--card))',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90"
          style={{ backgroundColor: 'hsl(var(--muted))' }}
        >
          <ArrowLeftIcon className="w-5 h-5" style={{ color: 'hsl(var(--ninho-brown))' }} />
        </button>
        <div>
          <p className="text-lg font-bold leading-tight"
            style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
            Registrar sono
          </p>
          {activeChild && (
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
              {activeChild.name}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6"
        style={{ paddingBottom: 'max(96px, calc(env(safe-area-inset-bottom) + 96px))' }}>

        {/* IDLE — not yet started */}
        {phase === 'idle' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center pt-10 gap-6">
            <div className="w-32 h-32 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${MAUVE}15`, border: `2px dashed ${MAUVE}40` }}>
              <span className="text-5xl">😴</span>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
                Pronto para dormir?
              </p>
              <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
                Inicie o cronômetro quando colocar para dormir
              </p>
            </div>
          </motion.div>
        )}

        {/* ACTIVE or PAUSED */}
        {(phase === 'active' || phase === 'paused') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 pt-6">
            {/* Timer display */}
            <div className="w-44 h-44 rounded-full flex flex-col items-center justify-center"
              style={{
                backgroundColor: `${MAUVE}12`,
                border: `3px solid ${phase === 'active' ? MAUVE : `${MAUVE}50`}`,
              }}>
              <span className="text-5xl mb-1">😴</span>
              <p className="text-2xl font-bold tabular-nums"
                style={{ color: MAUVE, fontFamily: 'Quicksand, sans-serif' }}>
                {fmtTimer(elapsed)}
              </p>
            </div>

            {/* Status */}
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center">
                {phase === 'active' && (
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: MAUVE }} />
                )}
                <p className="text-sm font-semibold"
                  style={{ color: MAUVE, fontFamily: font }}>
                  {phase === 'active' ? 'Sono em andamento' : 'Sono pausado'}
                </p>
              </div>
              {sessionStartLabel && (
                <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
                  Iniciado às {sessionStartLabel}
                </p>
              )}
            </div>

            {/* Session controls */}
            <div className="w-full flex gap-3">
              {phase === 'active' ? (
                <button onClick={handlePause}
                  className="flex-1 py-4 rounded-2xl text-sm font-bold"
                  style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--ninho-brown))', fontFamily: font }}>
                  ⏸ Pausar
                </button>
              ) : (
                <button onClick={handleResume}
                  className="flex-1 py-4 rounded-2xl text-sm font-bold"
                  style={{ backgroundColor: `${MAUVE}15`, color: MAUVE, border: `1.5px solid ${MAUVE}40`, fontFamily: font }}>
                  ▶ Continuar
                </button>
              )}
              <button onClick={handleEnd}
                className="flex-1 py-4 rounded-2xl text-sm font-bold"
                style={{ backgroundColor: MAUVE, color: 'white', fontFamily: font }}>
                ⏹ Encerrar
              </button>
            </div>
          </motion.div>
        )}

        {/* ENDED — enrichment form */}
        {phase === 'ended' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Summary pill */}
            <div className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ backgroundColor: `${MAUVE}12`, border: `1.5px solid ${MAUVE}30` }}>
              <span className="text-2xl">😴</span>
              <div>
                <p className="text-sm font-bold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
                  Sono encerrado
                </p>
                <p className="text-xs font-semibold" style={{ color: MAUVE, fontFamily: font }}>
                  Duração: {fmtTimer(session?.accumulatedSec ?? 0)}
                </p>
              </div>
            </div>

            {/* Location */}
            <div>
              <SectionLabel>Onde dormiu?</SectionLabel>
              <ChipRow
                options={SLEEP_LOCATION_OPTIONS}
                value={location}
                onToggle={v => setLocation(p => p === v ? '' : v)}
              />
            </div>

            {/* How fell asleep */}
            <div>
              <SectionLabel>Como adormeceu?</SectionLabel>
              <ChipRow
                options={SLEEP_HOW_OPTIONS}
                value={howFellAsleep}
                onToggle={v => setHowFellAsleep(p => p === v ? '' : v)}
              />
            </div>

            {/* Awakenings */}
            <div>
              <SectionLabel>Despertares</SectionLabel>
              <ChipRow
                options={AWAKENINGS_OPTIONS}
                value={awakenings}
                onToggle={v => setAwakenings(p => p === v ? '' : v)}
              />
            </div>

            {/* Notes */}
            <div>
              <SectionLabel>Observações</SectionLabel>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Dormiu tranquilo, acordou uma vez..."
                className="rounded-2xl border-border resize-none min-h-[80px]"
                rows={3}
                style={{ fontFamily: font }}
              />
            </div>

            {/* Discard */}
            <button
              onClick={handleDiscard}
              className="w-full py-2 text-xs font-semibold text-center"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}
            >
              Descartar sessão
            </button>
          </motion.div>
        )}
      </div>

      {/* Fixed bottom action */}
      <div
        className="fixed bottom-0 left-0 right-0 flex justify-center"
        style={{
          padding: `16px 20px max(24px, env(safe-area-inset-bottom))`,
          backgroundColor: 'hsl(var(--card))',
          borderTop: '1px solid hsl(var(--border))',
        }}
      >
        <div className="w-full max-w-md">
          {phase === 'idle' && (
            <button
              onClick={handleStart}
              disabled={!activeChildId}
              className="w-full py-4 rounded-2xl text-sm font-bold transition-all active:scale-98 disabled:opacity-50"
              style={{ backgroundColor: MAUVE, color: 'white', fontFamily: font }}
            >
              ▶ Iniciar sono
            </button>
          )}
          {(phase === 'active' || phase === 'paused') && (
            <p className="text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: font }}>
              Encerre o sono para salvar o registro
            </p>
          )}
          {phase === 'ended' && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 rounded-2xl text-sm font-bold transition-all active:scale-98 disabled:opacity-50"
              style={{ backgroundColor: MAUVE, color: 'white', fontFamily: font }}
            >
              {saving ? 'Salvando...' : 'Salvar sono'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
