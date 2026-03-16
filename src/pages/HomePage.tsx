import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BeakerIcon,
  MoonIcon,
  ShieldCheckIcon,
  CalendarIcon,
  PlusIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { ChildSwitcher } from '@/components/home/ChildSwitcher';
import { FeedSheet, SleepSheet, DiaperSheet } from '@/components/home/QuickLogSheets';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tables } from '@/integrations/supabase/types';

type RoutineLog = Tables<'routine_logs'>;

// ─── Helper: format time ───────────────────────────────────────────────────
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ─── Summary Card ──────────────────────────────────────────────────────────
interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  empty?: boolean;
  color: string;
}
function SummaryCard({ icon, label, value, sub, empty, color }: SummaryCardProps) {
  return (
    <div
      className="flex-1 min-w-0 rounded-2xl p-4 flex flex-col gap-2"
      style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
          {label}
        </p>
        <p className={`text-sm font-bold leading-tight mt-0.5 ${empty ? 'opacity-40' : ''}`}
          style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
          {value}
        </p>
        {sub && (
          <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Quick Action Button ───────────────────────────────────────────────────
function QuickAction({ emoji, label, onClick, color }: { emoji: string; label: string; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-1.5 py-4 rounded-2xl transition-all active:scale-95"
      style={{ backgroundColor: `${color}15`, border: `1.5px solid ${color}30` }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${color}25` }}
      >
        <span className="text-xl">{emoji}</span>
      </div>
      <span className="text-xs font-bold" style={{ color, fontFamily: 'Nunito, sans-serif' }}>
        {label}
      </span>
    </button>
  );
}

// ─── Timeline Item ─────────────────────────────────────────────────────────
function TimelineItem({ log }: { log: RoutineLog }) {
  const details = (log.details as Record<string, string | number> | null) ?? {};

  const meta = {
    feed: {
      emoji: '🍼',
      label: 'Mamada',
      sub: details.feeding_method === 'breast' ? 'Seio'
        : details.feeding_method === 'bottle' ? 'Mamadeira'
        : details.feeding_method === 'formula' ? 'Fórmula' : '',
      color: 'hsl(var(--ninho-sage))',
    },
    sleep: {
      emoji: '😴',
      label: 'Sono',
      sub: log.end_time
        ? `até ${fmtTime(log.end_time)}`
        : 'em andamento',
      color: 'hsl(var(--ninho-mauve))',
    },
    diaper: {
      emoji: '🧷',
      label: 'Troca',
      sub: details.diaper_type === 'pee' ? 'Xixi'
        : details.diaper_type === 'poop' ? 'Cocô'
        : details.diaper_type === 'both' ? 'Xixi e Cocô' : '',
      color: '#E8A045',
    },
    note: { emoji: '📝', label: 'Nota', sub: '', color: 'hsl(var(--ninho-brown))' },
  }[log.type] ?? { emoji: '📝', label: log.type, sub: '', color: 'hsl(var(--ninho-brown))' };

  return (
    <div className="flex items-start gap-3">
      {/* Time + line */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-semibold w-11 text-center"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
          {fmtTime(log.start_time)}
        </span>
        <div className="w-px flex-1 mt-1 min-h-[16px]" style={{ backgroundColor: 'hsl(var(--border))' }} />
      </div>

      {/* Card */}
      <div
        className="flex-1 rounded-2xl px-3 py-2.5 mb-2 flex items-center gap-2.5"
        style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${meta.color}18` }}
        >
          <span className="text-base">{meta.emoji}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
            {meta.label}
          </p>
          {meta.sub && (
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
              {meta.sub}
            </p>
          )}
          {log.notes && (
            <p className="text-xs mt-0.5 truncate" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
              {log.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main HomePage ─────────────────────────────────────────────────────────
export default function HomePage() {
  const { activeChild, loading: childLoading, error: childError, getAgeLabel } = useActiveChild();

  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  const [nextVaccine, setNextVaccine] = useState<{ name: string } | null | undefined>(undefined);

  const [feedOpen, setFeedOpen] = useState(false);
  const [sleepOpen, setSleepOpen] = useState(false);
  const [diaperOpen, setDiaperOpen] = useState(false);

  // ── Load today's routine logs ──
  const loadLogs = useCallback(async () => {
    if (!activeChild) return;
    setLogsLoading(true);
    setLogsError(null);
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
    } catch (e: unknown) {
      setLogsError('Não foi possível carregar os eventos de hoje.');
    } finally {
      setLogsLoading(false);
    }
  }, [activeChild]);

  // ── Load next vaccine ──
  const loadNextVaccine = useCallback(async () => {
    if (!activeChild) return;
    try {
      // Find pending vaccines for this child
      const { data } = await supabase
        .from('child_vaccines')
        .select('vaccine_id, vaccines_catalog(name, recommended_age_days)')
        .eq('child_id', activeChild.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1);

      if (data && data.length > 0) {
        const vc = data[0].vaccines_catalog as { name: string; recommended_age_days: number | null } | null;
        setNextVaccine(vc ? { name: vc.name } : null);
      } else {
        setNextVaccine(null);
      }
    } catch {
      setNextVaccine(null);
    }
  }, [activeChild]);

  useEffect(() => {
    loadLogs();
    loadNextVaccine();
  }, [loadLogs, loadNextVaccine]);

  // ── Derived: last feed & sleep ──
  const lastFeed = logs.find(l => l.type === 'feed');
  const lastSleep = logs.find(l => l.type === 'sleep');

  // ── Greeting ──
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const sageHex = 'hsl(152,15%,55%)';
  const mauveHex = 'hsl(270,12%,52%)';
  const orangeHex = '#E8A045';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>

      {/* ─── Header ─── */}
      <div
        className="px-5 pt-12 pb-5"
        style={{
          background: `linear-gradient(135deg, hsl(var(--ninho-mauve)), hsl(var(--ninho-sage)))`,
        }}
      >
        <p className="text-sm text-white/70 mb-3" style={{ fontFamily: 'Nunito, sans-serif' }}>
          {greeting} 👋
        </p>
        <ChildSwitcher />
      </div>

      {/* ─── Error state ─── */}
      {childError && (
        <div className="mx-5 mt-4 px-4 py-3 rounded-2xl flex items-center gap-2"
          style={{ backgroundColor: 'hsl(var(--destructive) / 0.1)', border: '1px solid hsl(var(--destructive) / 0.2)' }}>
          <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(var(--destructive))' }} />
          <p className="text-xs" style={{ color: 'hsl(var(--destructive))', fontFamily: 'Nunito, sans-serif' }}>
            Não foi possível carregar os dados da criança. Tente novamente.
          </p>
        </div>
      )}

      {childLoading ? (
        <div className="px-5 pt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : !activeChild ? (
        <div className="flex flex-col items-center justify-center px-5 pt-16 text-center">
          <p className="text-base font-semibold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
            Nenhuma criança encontrada
          </p>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
            Complete o cadastro para ver o painel.
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="px-5 pt-5 pb-8 space-y-5"
        >

          {/* ─── Summary Cards 2×2 ─── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
              Resumo do dia
            </p>
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard
                icon={<BeakerIcon className="w-4 h-4" />}
                label="Última mamada"
                color={sageHex}
                value={lastFeed ? fmtTime(lastFeed.start_time) : 'Nenhuma'}
                sub={lastFeed ? fmtDate(lastFeed.start_time) : undefined}
                empty={!lastFeed}
              />
              <SummaryCard
                icon={<MoonIcon className="w-4 h-4" />}
                label="Último sono"
                color={mauveHex}
                value={lastSleep ? fmtTime(lastSleep.start_time) : 'Nenhum'}
                sub={lastSleep
                  ? lastSleep.end_time ? `até ${fmtTime(lastSleep.end_time)}` : 'em andamento'
                  : undefined}
                empty={!lastSleep}
              />
              <SummaryCard
                icon={<ShieldCheckIcon className="w-4 h-4" />}
                label="Próxima vacina"
                color={orangeHex}
                value={nextVaccine === undefined ? '...' : nextVaccine?.name ?? 'Nenhuma agendada'}
                empty={!nextVaccine}
              />
              <SummaryCard
                icon={<CalendarIcon className="w-4 h-4" />}
                label="Próxima consulta"
                color="#9B6B9B"
                value="Nenhuma agendada"
                empty
              />
            </div>
          </div>

          {/* ─── Quick Actions ─── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
              Registrar agora
            </p>
            <div className="flex gap-3">
              <QuickAction emoji="🍼" label="Mamada" onClick={() => setFeedOpen(true)} color={sageHex} />
              <QuickAction emoji="😴" label="Sono" onClick={() => setSleepOpen(true)} color={mauveHex} />
              <QuickAction emoji="🧷" label="Troca" onClick={() => setDiaperOpen(true)} color={orangeHex} />
            </div>
          </div>

          {/* ─── Daily Timeline ─── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
              Hoje
            </p>

            {logsError && (
              <div className="px-4 py-3 rounded-2xl mb-3 flex items-center gap-2"
                style={{ backgroundColor: 'hsl(var(--destructive) / 0.08)', border: '1px solid hsl(var(--destructive) / 0.15)' }}>
                <ExclamationCircleIcon className="w-4 h-4" style={{ color: 'hsl(var(--destructive))' }} />
                <p className="text-xs" style={{ color: 'hsl(var(--destructive))', fontFamily: 'Nunito, sans-serif' }}>
                  {logsError}
                </p>
              </div>
            )}

            {logsLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map(i => <Skeleton key={i} className="h-14 rounded-2xl" />)}
              </div>
            ) : logs.length === 0 ? (
              <div
                className="rounded-2xl px-5 py-8 text-center"
                style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              >
                <p className="text-3xl mb-2">🌤️</p>
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
                  Nenhum evento registrado hoje
                </p>
                <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
                  Use os botões acima para começar.
                </p>
              </div>
            ) : (
              <div className="pb-2">
                {logs.map(log => <TimelineItem key={log.id} log={log} />)}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ─── Quick Log Sheets ─── */}
      <FeedSheet open={feedOpen} onClose={() => setFeedOpen(false)} onSaved={loadLogs} />
      <SleepSheet open={sleepOpen} onClose={() => setSleepOpen(false)} onSaved={loadLogs} />
      <DiaperSheet open={diaperOpen} onClose={() => setDiaperOpen(false)} onSaved={loadLogs} />
    </div>
  );
}
