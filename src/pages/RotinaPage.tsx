import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { FeedSheet, SleepSheet, DiaperSheet } from '@/components/home/QuickLogSheets';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tables } from '@/integrations/supabase/types';

type RoutineLog = Tables<'routine_logs'>;

// ─── Helpers ───────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(start: string, end: string) {
  const diff = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

function parsePayload(notes: string | null): Record<string, string> {
  if (!notes) return {};
  try {
    if (notes.startsWith('__payload:')) return JSON.parse(notes.slice('__payload:'.length));
  } catch { /* noop */ }
  return {};
}

function getUserNotes(notes: string | null): string | null {
  if (!notes) return null;
  if (notes.startsWith('__payload:')) {
    try {
      const obj = JSON.parse(notes.slice('__payload:'.length)) as Record<string, string>;
      return obj._notes ?? null;
    } catch { return null; }
  }
  return notes;
}

// ─── Log meta config ───────────────────────────────────────────────────────

function getLogMeta(log: RoutineLog) {
  const payload = parsePayload(log.notes);

  switch (log.type) {
    case 'feed': {
      const methodMap: Record<string, string> = { breast: 'Seio', bottle: 'Mamadeira', formula: 'Fórmula' };
      const modeLabel = payload.mode === 'timer' ? ` · Cronômetro` : '';
      const sideLabel = payload.side === 'left' ? ' (esq)' : payload.side === 'right' ? ' (dir)' : '';
      const methodLabel = methodMap[payload.feeding_method ?? ''] ?? 'Seio';
      return {
        emoji: '🍼',
        label: 'Mamada',
        sub: `${methodLabel}${sideLabel}${modeLabel}`,
        color: 'hsl(152,15%,55%)',
        bgColor: 'hsl(152,15%,55%, 0.12)',
      };
    }
    case 'sleep': {
      const duration = log.end_time ? fmtDuration(log.start_time, log.end_time) : null;
      return {
        emoji: '😴',
        label: 'Sono',
        sub: duration ? `Duração: ${duration}` : 'Em andamento',
        color: 'hsl(270,12%,52%)',
        bgColor: 'hsl(270,12%,52%, 0.12)',
      };
    }
    case 'diaper': {
      const dMap: Record<string, string> = { pee: 'Xixi 💛', poop: 'Cocô 💩', both: 'Xixi e Cocô 🔄' };
      return {
        emoji: '🧷',
        label: 'Troca',
        sub: dMap[payload.diaper_type ?? ''] ?? '',
        color: '#E8A045',
        bgColor: '#E8A04520',
      };
    }
    default:
      return { emoji: '📝', label: 'Nota', sub: '', color: 'hsl(var(--ninho-brown))', bgColor: 'hsl(var(--muted))' };
  }
}

// ─── Timeline Item ─────────────────────────────────────────────────────────

function TimelineItem({ log, isLast }: { log: RoutineLog; isLast: boolean }) {
  const meta = getLogMeta(log);
  const userNotes = getUserNotes(log.notes);

  return (
    <div className="flex items-stretch gap-3">
      {/* Time + connector */}
      <div className="flex flex-col items-center w-12 flex-shrink-0">
        <span
          className="text-[11px] font-semibold text-center leading-tight pt-2"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
        >
          {fmtTime(log.start_time)}
        </span>
        {!isLast && (
          <div className="w-px flex-1 mt-1" style={{ backgroundColor: 'hsl(var(--border))' }} />
        )}
      </div>

      {/* Card */}
      <div
        className="flex-1 rounded-2xl px-3 py-3 mb-3 flex items-center gap-3"
        style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: meta.bgColor }}
        >
          <span className="text-lg">{meta.emoji}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
              {meta.label}
            </p>
            {log.type === 'sleep' && log.end_time && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: meta.bgColor, color: meta.color }}>
                {fmtDuration(log.start_time, log.end_time)}
              </span>
            )}
            {log.type === 'sleep' && !log.end_time && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#E8A04520', color: '#E8A045' }}>
                em andamento
              </span>
            )}
          </div>
          {meta.sub && (
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
              {meta.sub}
            </p>
          )}
          {userNotes && (
            <p className="text-xs mt-1 truncate" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
              💬 {userNotes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Daily stats bar ───────────────────────────────────────────────────────

function DailyStats({ logs }: { logs: RoutineLog[] }) {
  const feeds = logs.filter(l => l.type === 'feed').length;
  const diapers = logs.filter(l => l.type === 'diaper').length;
  const sleepLogs = logs.filter(l => l.type === 'sleep' && l.end_time);
  const totalSleepSec = sleepLogs.reduce((acc, l) => {
    return acc + Math.floor((new Date(l.end_time!).getTime() - new Date(l.start_time).getTime()) / 1000);
  }, 0);
  const sleepH = Math.floor(totalSleepSec / 3600);
  const sleepM = Math.floor((totalSleepSec % 3600) / 60);

  const stats = [
    { emoji: '🍼', label: 'Mamadas', value: String(feeds) },
    { emoji: '🧷', label: 'Trocas', value: String(diapers) },
    { emoji: '😴', label: 'Sono', value: totalSleepSec > 0 ? `${sleepH}h${sleepM}m` : '—' },
  ];

  return (
    <div className="flex gap-2 mb-5">
      {stats.map(s => (
        <div
          key={s.label}
          className="flex-1 rounded-2xl py-3 flex flex-col items-center gap-0.5"
          style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        >
          <span className="text-lg">{s.emoji}</span>
          <p className="text-base font-bold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
            {s.value}
          </p>
          <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── FAB ───────────────────────────────────────────────────────────────────

function FAB({ onFeed, onSleep, onDiaper }: { onFeed: () => void; onSleep: () => void; onDiaper: () => void }) {
  const [open, setOpen] = useState(false);

  const actions = [
    { emoji: '🍼', label: 'Mamada', onClick: onFeed, color: 'hsl(152,15%,55%)' },
    { emoji: '😴', label: 'Sono', onClick: onSleep, color: 'hsl(270,12%,52%)' },
    { emoji: '🧷', label: 'Troca', onClick: onDiaper, color: '#E8A045' },
  ];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Action bubbles */}
      <div className="fixed bottom-24 right-5 z-50 flex flex-col items-end gap-2">
        {open && actions.map((a, i) => (
          <motion.div
            key={a.label}
            initial={{ opacity: 0, y: 16, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18, delay: i * 0.04 }}
            className="flex items-center gap-2"
          >
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-full shadow-sm"
              style={{ backgroundColor: 'hsl(var(--card))', color: a.color, fontFamily: 'Nunito, sans-serif', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
            >
              {a.label}
            </span>
            <button
              onClick={() => { a.onClick(); setOpen(false); }}
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90"
              style={{ backgroundColor: a.color }}
            >
              <span className="text-xl">{a.emoji}</span>
            </button>
          </motion.div>
        ))}

        {/* Main FAB */}
        <button
          onClick={() => setOpen(v => !v)}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--ninho-mauve)), hsl(var(--ninho-sage)))',
          }}
        >
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-2xl text-white font-bold leading-none"
          >
            +
          </motion.span>
        </button>
      </div>
    </>
  );
}

// ─── Main RotinaPage ───────────────────────────────────────────────────────

export default function RotinaPage() {
  const { activeChild, loading: childLoading } = useActiveChild();

  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [feedOpen, setFeedOpen] = useState(false);
  const [sleepOpen, setSleepOpen] = useState(false);
  const [diaperOpen, setDiaperOpen] = useState(false);

  const loadLogs = useCallback(async () => {
    if (!activeChild) return;
    setLogsLoading(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('routine_logs')
        .select('*')
        .eq('child_id', activeChild.id)
        .gte('start_time', todayStart.toISOString())
        .order('start_time', { ascending: false });

      if (error) throw error;
      setLogs(data ?? []);
    } catch {
      // silent — empty state handles it
    } finally {
      setLogsLoading(false);
    }
  }, [activeChild]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>

      {/* Header */}
      <div
        className="px-5 pt-14 pb-5"
        style={{ background: 'linear-gradient(135deg, hsl(var(--ninho-sage)), hsl(var(--ninho-mauve)))' }}
      >
        <h1
          className="text-2xl font-bold text-white"
          style={{ fontFamily: 'Quicksand, sans-serif' }}
        >
          Rotina
        </h1>
        <p className="text-sm text-white/70 mt-0.5" style={{ fontFamily: 'Nunito, sans-serif' }}>
          {activeChild ? activeChild.name : 'Hoje'}
        </p>
      </div>

      <div className="px-5 pt-5">
        {childLoading ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              {[0, 1, 2].map(i => <Skeleton key={i} className="flex-1 h-20 rounded-2xl" />)}
            </div>
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        ) : !activeChild ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <p className="text-3xl mb-3">👶</p>
            <p className="text-base font-semibold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
              Nenhuma criança ativa
            </p>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
              Complete o cadastro para registrar a rotina.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Stats */}
            {logs.length > 0 && <DailyStats logs={logs} />}

            {/* Section label */}
            <p className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
              Eventos de hoje
            </p>

            {/* Timeline */}
            {logsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
              </div>
            ) : sortedLogs.length === 0 ? (
              <div
                className="rounded-2xl px-5 py-10 text-center"
                style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              >
                <p className="text-4xl mb-3">🌤️</p>
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
                  Nenhum evento registrado hoje
                </p>
                <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                  Use o botão + para começar.
                </p>
              </div>
            ) : (
              <div>
                {sortedLogs.map((log, idx) => (
                  <TimelineItem key={log.id} log={log} isLast={idx === sortedLogs.length - 1} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* FAB */}
      {activeChild && (
        <FAB
          onFeed={() => setFeedOpen(true)}
          onSleep={() => setSleepOpen(true)}
          onDiaper={() => setDiaperOpen(true)}
        />
      )}

      {/* Sheets */}
      <FeedSheet open={feedOpen} onClose={() => setFeedOpen(false)} onSaved={loadLogs} />
      <SleepSheet open={sleepOpen} onClose={() => setSleepOpen(false)} onSaved={loadLogs} />
      <DiaperSheet open={diaperOpen} onClose={() => setDiaperOpen(false)} onSaved={loadLogs} />
    </div>
  );
}
